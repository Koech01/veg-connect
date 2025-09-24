import requests 
from plants.models import Plants 
from rest_framework.views import APIView
from profiles.auth import JWTAuthentication
from rest_framework.response import Response 
from plants.serializers import PlantSerializer 


class CreatePlantsOnSetup(APIView):
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        plantList = [
            "van zerden garlic", "kale", "turnip", "corn", "cress", "fennel",
            "carrot, scarlet nantes", "cherry belle radish", "black beauty eggplant",
            "cauliflower", "leek", "black seeded simpson lettuce", "coriander",
            "salanova lettuce", "okra", "green bean", "beet, detroit dark red, medium top",
            "potato", "lovage", "radicchio", "kohlrabi", "saffron"
        ]
        self.createBatch(plantList, startIndex=0, batchSize=4)

        allPlants  = Plants.objects.all()
        serialized = PlantSerializer(allPlants, many=True)
        return Response({"plants": serialized.data}, status=200)

    def createBatch(self, plantList, startIndex=0, batchSize=15):
        endIndex = startIndex + batchSize
        batch    = plantList[startIndex:endIndex]

        existingNames     = set(Plants.objects.values_list('plantName', flat=True).distinct())
        existingBinomials = set(Plants.objects.values_list('binomialName', flat=True).distinct())

        newPlants = []

        for searchItem in batch:
            openfarmUrl = f"https://openfarm.cc/api/v1/crops?filter={searchItem}"
            response    = requests.get(openfarmUrl)

            if response.status_code != 200:
                continue

            openfarmData = response.json()

            for plantData in openfarmData.get('data', []):
                attributes = plantData.get('attributes', {})
                newPlant = self.createPlantInstance(attributes)

                if newPlant:
                    if newPlant.plantName not in existingNames and newPlant.binomialName not in existingBinomials:
                        print('newPlant:', newPlant.plantName)
                        newPlants.append(newPlant)
                        existingNames.add(newPlant.plantName)
                        existingBinomials.add(newPlant.binomialName)

        if newPlants:
            Plants.objects.bulk_create(newPlants)

        if endIndex < len(plantList):
            self.createBatch(plantList, startIndex=endIndex, batchSize=batchSize)

    @staticmethod
    def createPlantInstance(attributes):
        if attributes.get('description') and attributes.get('sowing_method'):
            return Plants(
                plantName=attributes.get('name', '').lower(),
                binomialName=attributes.get('binomial_name', ''),
                description=attributes.get('description', ''),
                sunRequirements=attributes.get('sun_requirements', 'N/A'),
                growingDays=attributes.get('growing_degree_days', None),
                sowingMethod=attributes.get('sowing_method', ''),
                spreadDiameter=attributes.get('spread', None),
                rowSpacing=attributes.get('row_spacing', None),
                height=attributes.get('height', None)
            )
        return None 