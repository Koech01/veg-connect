import requests
from django.db.models import Q
from tasks.models import Tasks
from tasks.models import Tasks
from datetime import timedelta
from plants.models import Plants
from django.utils import timezone
from rest_framework import status
from profiles.models import Profile
from rest_framework.views import APIView
from profiles.auth import JWTAuthentication
from rest_framework.response import Response
from tasks.serializers import TaskSerializer 
from plants.serializers import PlantSerializer
from profiles.serializers import ProfileSerializer


# Create your views here.
class HomeView(APIView):
    authentication_classes = [JWTAuthentication]

    def nextScheduledTime(self, task):
        if task.recurringType == 'daily':
            return timezone.now() + timedelta(days=1)
        elif task.recurringType == 'weekly':
            return timezone.now() + timedelta(weeks=1)
        elif task.recurringType == 'monthly':
            return timezone.now() + timedelta(weeks=4)  
        return timezone.now()
    
    def patch(self, request):
        profile        = Profile.objects.get(username=request.user)
        recurringTasks = Tasks.objects.filter(owner=profile, recurring=True)
        newTasks       = []

        for task in recurringTasks:
            if task.scheduledTime < timezone.now() and not task.completed:

                if not Tasks.objects.filter(owner=profile, title=task.title, scheduledTime__gt=task.scheduledTime).exists():
                    taskScheduledTime = self.nextScheduledTime(task)

                    newTask = Tasks(
                        owner         = profile,
                        title         = task.title,
                        description   = task.description,
                        recurring     = True,
                        recurringType = task.recurringType,
                        scheduledTime = taskScheduledTime
                    )
                    newTasks.append(newTask)
            
        if newTasks:
            Tasks.objects.bulk_create(newTasks)

        profileSerializer = ProfileSerializer(profile)
        return Response(profileSerializer.data)
    

class SearchView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        searchItem = request.GET.get('search', '').strip().lower()

        if not searchItem:
            return Response({"error": "No search term provided"}, status=status.HTTP_400_BAD_REQUEST)

        taskObjs          = Tasks.objects.filter(owner=profile, title__icontains=searchItem).only('title', 'description')
        plantObjs         = Plants.objects.filter(Q(plantName__icontains=searchItem) | Q(binomialName__icontains=searchItem)).only('binomialName', 'description')
        taskSerializer    = TaskSerializer(taskObjs, many=True)
        plantSerializer   = PlantSerializer(plantObjs, many=True)
     
        if plantObjs.exists():
            plantSerializer = PlantSerializer(plantObjs, many=True)
            return Response({ "plants": plantSerializer.data, "tasks":taskSerializer.data }, status=status.HTTP_200_OK)
        
        openfarmUrl      = f"https://openfarm.cc/api/v1/crops?filter={searchItem}"
        openfarmResponse = requests.get(openfarmUrl)

        if openfarmResponse.status_code != 200:
            return Response({"error": "Failed to retrieve data from OpenFarm"}, status=openfarmResponse.status_code)

        openfarmData = openfarmResponse.json()
        newPlants    = []

        for plantData in openfarmData.get('data', [])[:5]:
            plantAttributes = plantData.get('attributes', {})
            newPlant        = self.createPlantInstance(plantAttributes)
            print('newPlant: ', newPlant.plantName)

            if newPlant:
                if not Plants.objects.filter(Q(binomialName=newPlant.binomialName) | Q(plantName=newPlant.plantName)).exists():
                    newPlants.append(newPlant)

        if newPlants:
            Plants.objects.bulk_create(newPlants)

        updatedPlants = Plants.objects.filter(Q(plantName__icontains=searchItem) | Q(binomialName__icontains=searchItem))
        updatedPlantSerializer = PlantSerializer(updatedPlants, many=True)
        return Response({"plants" : updatedPlantSerializer.data, "tasks" : taskSerializer.data  }, status=status.HTTP_200_OK)


    @staticmethod
    def createPlantInstance(attributes):
        if attributes.get('description') and attributes.get('sowing_method'): 
            return Plants(
                plantName       = attributes.get('name', '').lower(),
                binomialName    = attributes.get('binomial_name', ''),
                description     = attributes.get('description', ''),
                sunRequirements = attributes.get('sun_requirements', 'N/A'),  
                growingDays     = attributes.get('growing_degree_days', None),
                sowingMethod    = attributes.get('sowing_method', ''),
                spreadDiameter  = attributes.get('spread', None),
                rowSpacing      = attributes.get('row_spacing', None),
                height          = attributes.get('height', None)
            )
        return None  