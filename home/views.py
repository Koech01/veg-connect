from tasks.models import Tasks
from tasks.models import Tasks
from datetime import timedelta 
from plants.utils import plantDf
from django.utils import timezone
from rest_framework import status
from django.db.models import Count
from profiles.models import Profile
from forum.models import GroupMessage
from plants.utils import searchPlants
from rest_framework.views import APIView 
from profiles.auth import JWTAuthentication
from .serializers import BookmarkSerializer
from rest_framework.response import Response
from tasks.serializers import TaskSerializer 
from django.utils.timezone import now, timedelta
from profiles.serializers import ProfileSerializer
from home.models import PlantSearchHistory, Bookmark
from rest_framework.permissions import IsAuthenticated 
from verdant.companionContext import generateCompanionDescription
from verdant.recommendations import getPersonalizedSimilarPlants, recommendCompanionPair


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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        searchItem = request.GET.get('search', '').strip().lower()

        if not searchItem:
            return Response({"error": "No search term provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        taskObjs = Tasks.objects.filter(owner=profile, title__icontains=searchItem).only('title', 'description')
        taskSerializer = TaskSerializer(taskObjs, many=True)
        plantResult = searchPlants(searchItem)

        return Response({'plants' : plantResult, 'tasks' : taskSerializer.data}, status.HTTP_200_OK)
    

class PlantsRecommendationView(APIView): 
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Get recommended plant names
        userInterests = list(profile.plantInterests.values_list('commonName', flat=True))
        climate = profile.climate.precipitationClass if profile.climate else []
        userHistory = list(
            PlantSearchHistory.objects.filter(user=profile).select_related('plant').values_list('plant__commonName', flat=True)
        )
 
        contextualPlants = getPersonalizedSimilarPlants(userInterests, userHistory, climate, top_n=2)
        companionPlants = recommendCompanionPair(userInterests + contextualPlants, climate)

        if not contextualPlants:
            return Response({'plants': []}, status=status.HTTP_200_OK)

        plantDataList = []
        for name in contextualPlants:
            match = plantDf[
                (plantDf['Common name'].str.strip().str.lower() == name.strip().lower()) |
                (plantDf['Scientific name'].str.strip().str.lower() == name.strip().lower()) |
                (plantDf['Alternate name'].str.lower().str.contains(name.strip().lower()))
            ]

            if not match.empty:
                row = match.iloc[0]
                plantData = {
                    'commonName': str(row.get('Common name', '')).strip(),
                    'scientificName': str(row.get('Scientific name', '')).strip(),
                    'family': str(row.get('Family', 'Unknown')).strip(),
                    'width': float(row.get('Width', 0.0)),
                    'height': float(row.get('Height', 0.0)),
                    'soilpH': str(row.get('Soil pH', '6.0 - 7.0')).strip(),
                    'usdaHardinessZone': str(row.get('USDA Hardiness Zone', 'Unknown')).strip(),
                    'waterRequirement': str(row.get('Water Requirement', 'Moist')).strip(),
                    'utility': str(row.get('Utility', '')).strip(),
                    'alternateNames': str(row.get('Alternate name', '')).strip(),
                    'taskRecommendations': str(row.get('Task Recommendations.', '')).strip(),
                }
                plantDataList.append(plantData)

            if isinstance(companionPlants, dict) and 'pair' in companionPlants and len(companionPlants['pair']) == 2:
                plant1, tag1 = companionPlants['pair'][0]
                plant2, tag2 = companionPlants['pair'][1]
                companionPlants = generateCompanionDescription(tag1, tag2, plant1, plant2)

        return Response({'contextualPlants': plantDataList, 'companionPlants' : companionPlants}, status=status.HTTP_200_OK)


class GroupPlantsRankView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        today       = now()
        lastWeek    = today - timedelta(days=7)
        twoWeeksAgo = today - timedelta(days=14)

        groups = profile.groupMembers.all()

        weekOldMessages = GroupMessage.objects.filter(
            group__in=groups,
            created__gte=lastWeek,
            plant__isnull=False
        )

        olderMessages = GroupMessage.objects.filter(
            group__in=groups,
            created__gte=twoWeeksAgo,
            created__lt=lastWeek,
            plant__isnull=False
        )

        def getPlantCount(queryset):
            return queryset.values('plant__id', 'plant__commonName').annotate(count=Count('plant')).order_by('-count')

        currentCounts = getPlantCount(weekOldMessages)
        previousCounts = getPlantCount(olderMessages)

        prevFreqMap = {item['plant__id']: item['count'] for item in previousCounts}
        prevRankMap = {item['plant__id']: idx for idx, item in enumerate(previousCounts)}

        seenIdx = set()
        rankedData = []

        for idx, item in enumerate(currentCounts):
            plantId = item['plant__id']
            name    = item['plant__commonName']

            # Avoid duplicates
            if plantId in seenIdx:
                continue
            seenIdx.add(plantId)

            currentCount  = item['count']
            previousCount = prevFreqMap.get(plantId, 0)
            previousRank  = prevRankMap.get(plantId)

            if previousRank is None:
                changeSymbol = "+"
                percentChange = ""

            elif not previousCounts:
                changeSymbol = "-"
                percentChange = ""

            else:
                rankDiff = previousRank - idx
                if rankDiff > 0:
                    changeSymbol = "+"
                elif rankDiff < 0:
                    changeSymbol = "-"
                else:
                    changeSymbol = "-"

                if previousCount > 0:
                    changePercent = ((currentCount - previousCount) / previousCount) * 100
                    percentChange = f"{abs(round(changePercent))}%"
                else:
                    percentChange = ""

            rankedData.append({ "rank": len(rankedData) + 1, "name": name, "change": changeSymbol, "percentChange": percentChange })

            if len(rankedData) == 3:
                break  
        return Response(rankedData, status=status.HTTP_200_OK) 
    

class ToggleBookmarkView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        title   = request.data.get('title')
        context = request.data.get('context')
        bType   = request.data.get('type')

        if not title or not context or not bType:
            return Response({'error': 'Missing required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        bookmark, created = Bookmark.objects.get_or_create(title=title, context=context, type=bType)

        if profile in bookmark.users.all():
            bookmark.users.remove(profile)
            
            if bookmark.users.count() == 0:
                bookmark.delete()
                return Response({'message': 'Bookmark removed and deleted.'}, status=status.HTTP_204_NO_CONTENT)
            return Response({'message': 'Bookmark removed.'}, status=status.HTTP_200_OK)
        else:
            bookmark.users.add(profile)
            return Response({'message': 'Bookmark added.'}, status=status.HTTP_201_CREATED)


class BookmarkListView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        bookmarks  = Bookmark.objects.filter(users=profile)
        plantPairs = bookmarks.filter(type='plantPair')
        tasks      = bookmarks.filter(type='task')

        return Response({
            'plantPairs': BookmarkSerializer(plantPairs, many=True).data,
            'tasks': BookmarkSerializer(tasks, many=True).data
        }, status=status.HTTP_200_OK)