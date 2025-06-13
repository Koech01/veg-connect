from .utils import plantDf
from forum.models import Group
from django.db.models import Q 
from django.db import transaction
from rest_framework import status
from profiles.models import Profile
from rest_framework.views import APIView 
from home.models import PlantSearchHistory
from profiles.auth import JWTAuthentication
from rest_framework.response import Response
from forum.models import Message, GroupMessage
from rest_framework.permissions import IsAuthenticated 
from .models import Plant, LifeCycle, LightRequirement, SoilType


# Create your views here. 
class ClickedPlantView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.GET.get('query', '').strip().lower()

        if not query:
            return Response({'error': 'Query required'}, status=status.HTTP_400_BAD_REQUEST)

        for _, row in plantDf.iterrows():
            common = str(row['Common name']).strip()
            scientific = str(row['Scientific name']).strip()
            alternates = [alt.strip() for alt in str(row['Alternate name']).split(',') if alt.strip()]

            matched = (
                query == common.lower()
                or query == scientific.lower()
                or query in [alt.lower() for alt in alternates]
            )

            if matched:
                plantData = row.to_dict()
                plantData['displayName'] = query


                with transaction.atomic():
                    nameFilters = Q(commonName__iexact=common) | Q(scientificName__iexact=scientific)
                    for altName in alternates:
                        nameFilters |= Q(commonName__iexact=altName)


                    plantObj = Plant.objects.filter(nameFilters).first()

                    if not plantObj:
                        plantObj = Plant.objects.create(
                            commonName=common,
                            scientificName=scientific,
                            family=str(plantData.get('Family', 'Unknown')).strip(),
                            width=float(plantData.get('Width', 0.0)),
                            height=float(plantData.get('Height', 0.0)),
                            soilpH=str(plantData.get('Soil pH', '6.0 - 7.0')).strip(),
                            usdaHardinessZone=str(plantData.get('USDA Hardiness Zone', 'Unknown')).strip(),
                            waterRequirement=str(plantData.get('Water Requirement', 'Moist')).strip(),
                            utility=str(plantData.get('Utility', '')).strip(),
                            alternateNames=str(plantData.get('Alternate name', '')).strip(),
                            taskRecommendations=str(plantData.get('Task Recommendations.', '')).strip(),
                        )

                        for lCycle in str(plantData.get('Life cycle', '')).split(','):
                            name = lCycle.strip()
                            if name:
                                lifeCycle, _ = LifeCycle.objects.get_or_create(name=name)
                                plantObj.lifeCycles.add(lifeCycle)

                        for sType in str(plantData.get('Soil type', '')).split(','):
                            name = sType.strip()
                            if name:
                                soilType, _ = SoilType.objects.get_or_create(name=name)
                                plantObj.soilTypes.add(soilType)

                        for lRequirement in str(plantData.get('Light requirement', '')).split(','):
                            name = lRequirement.strip()
                            if name:
                                lightReq, _ = LightRequirement.objects.get_or_create(name=name)
                                plantObj.lightRequirements.add(lightReq)

                    try:
                        profile = Profile.objects.get(username=request.user)
                    except Profile.DoesNotExist:
                        return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

                    if not PlantSearchHistory.objects.filter(user=profile, plant=plantObj).exists():
                        PlantSearchHistory.objects.create(user=profile, plant=plantObj)
                 
                return Response(plantData, status=status.HTTP_200_OK)
                 
        return Response({'error': 'No matching plant found'}, status=status.HTTP_404_NOT_FOUND)
    

class SharePlantView(APIView):
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            profile = Profile.objects.get(username=request.user.username)
        except Profile.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        data          = request.data
        userGroupsIds = data.get('userGroupsIds', [])
        plantName     = data.get('commonName')
        textMessage   = data.get('textMessage') 
 
        if not plantName:
            return Response({'error': 'commonName is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plant = Plant.objects.get(commonName__iexact=plantName.strip())
        except Plant.DoesNotExist:
            return Response({'error': 'Plant not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            for ids in userGroupsIds:
                itemId   = ids.get('id')
                itemType = ids.get('type')

                if itemType == 'user':
                    try:
                        receiver = Profile.objects.get(id=itemId)
                        Message.objects.create(user=profile, sender=profile, receiver=receiver, plant=plant, text=textMessage)
                        Message.objects.create(user=receiver, sender=profile, receiver=receiver, plant=plant, text=textMessage)
                        if not receiver.newChat:
                            receiver.newChat = True
                            receiver.save()
                    except Profile.DoesNotExist:
                        continue

                elif itemType == 'group':
                    try:
                        group = Group.objects.get(id=itemId)
                        GroupMessage.objects.create(group=group, sender=profile, plant=plant, text=textMessage)
                        group.members.filter(newChat=False).exclude(id=profile.id).update(newChat=True)
                    except Group.DoesNotExist:
                        continue

        return Response({'message': 'Task sent successfully.'}, status=status.HTTP_200_OK)