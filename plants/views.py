import random
from .models import Plants
from forum.models import Group
from django.db import transaction
from rest_framework import status
from profiles.models import Profile
from rest_framework.views import APIView
from .serializers import PlantSerializer
from profiles.auth import JWTAuthentication
from rest_framework.response import Response
from forum.models import Message, GroupMessage


# Create your views here.
class PlantGrowthDaysView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        plants = Plants.objects.exclude(growingDays__isnull=True).exclude(growingDays__exact='')

        if plants.count() >= 6:
            filteredPlants = random.sample(list(plants), 6)
        else:
            filteredPlants = list(plants)
        
        plantSerializer = PlantSerializer(filteredPlants, many=True)
        return Response(plantSerializer.data, status=status.HTTP_200_OK)
    

class ClickedPlantView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request, plantId):
        try:
            plant = Plants.objects.get(id=plantId)
        except Plants.DoesNotExist:
            return Response({'error':'Plant not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        plantSerializer = PlantSerializer(plant)
        return Response(plantSerializer.data, status=status.HTTP_200_OK)
    

class SharePlantView(APIView):
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            profile = Profile.objects.get(username=request.user.username)
        except Profile.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        data          = request.data
        userGroupsIds = data.get('userGroupsIds', [])
        plantId       = data.get('plantId')
        textMessage   = data.get('textMessage') 

        try:
            plant = Plants.objects.get(id=plantId)
        except Plants.DoesNotExist:
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