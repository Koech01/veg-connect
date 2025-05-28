from .models import Plants
from django.urls import reverse
from rest_framework import status
from django.utils import timezone
from rest_framework.test import APITestCase
from profiles.models import Profile, ProfileToken  
from forum.models import Group, GroupMessage, Message
from profiles.auth import generateAccessToken, generateRefreshToken 


# Create your tests here.
class AuthenticationTestCase(APITestCase):
    def setUp(self):
        self.user = Profile.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='Testpass@123'
        )

        self.accessToken  = generateAccessToken(self.user.id)
        self.refreshToken = generateRefreshToken(self.user.id)
 
        ProfileToken.objects.create(
            userId=self.user.id,
            token=self.refreshToken,
            expiredAt=timezone.now() + timezone.timedelta(days=7) 
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.accessToken}')


class PlantGrowthDaysViewTestCase(AuthenticationTestCase):

    def setUp(self):
        super().setUp()
        self.url = reverse('plantGrowthDaysView')

        for i in range(10):
            Plants.objects.create(
                plantName=f"Plant {i}",
                binomialName=f"Binomial {i}",
                description=f"Description {i}",
                sunRequirements="Full sun",
                growingDays="60-90 days",
                sowingMethod="Direct sow",
                spreadDiameter="20cm",
                rowSpacing="30cm",
                height="50cm"
            )

        #Plant with no growingDays
        Plants.objects.create(
            plantName="NoDaysPlant",
            description="No growing days here",
            sowingMethod="Sow",
        )

    def test_return_of_six_randm_plant_obj_with_growthDays(self): 
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 6)

        for plant in response.data:
            self.assertIn('growingDays', plant)
            self.assertNotEqual(plant['growingDays'], '')

    def test_excludes_plants_without_growing_days(self): 
        response = self.client.get(self.url)
        plantNames = [plant['plantName'] for plant in response.data]
        self.assertNotIn('NoDaysPlant', plantNames)

    def test_unautheticated_user_cannot_access_endpoint(self):
        self.client.credentials() 
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ClickedPlantViewTestCase(AuthenticationTestCase):
    
    def setUp(self):
        super().setUp()

        self.plant = Plants.objects.create(
            plantName="Tomato",
            binomialName="Solanum lycopersicum",
            description="Fruit-bearing plant",
            sunRequirements="Full sun",
            growingDays="60-90 days",
            sowingMethod="Direct sow",
            spreadDiameter="30cm",
            rowSpacing="40cm",
            height="80cm"
        )

    def test_successful_plant_object_retrieval(self):
        url = reverse('clickedPlantView', kwargs={'plantId' : self.plant.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['plantName'], self.plant.plantName)

    def test_plant_object_not_found(self):
        url = reverse('clickedPlantView', kwargs={'plantId' : 999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Plant not found.')

    def test_unautheticated_user_cannot_access_endpoint(self):
        self.client.credentials()
        url = reverse('clickedPlantView', kwargs={'plantId' : self.plant.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SharePlntViewTestCase(APITestCase):

    def setUp(self):
        self.sender = Profile.objects.create_user(
            username='senderUser',
            email='sender@example.com',
            password='Testpass@123'
        )

        self.receiver = Profile.objects.create_user(
            username='receiverUser',
            email='receiver@example.com',
            password='Testpass@123'
        )

        self.group = Group.objects.create(name='Test Group')
        self.group.members.set([self.sender, self.receiver])
        self.group.admins.add(self.sender)

        self.plant = Plants.objects.create(
            plantName="Tomato",
            binomialName="Solanum lycopersicum",
            description="Fruit-bearing plant",
            sunRequirements="Full sun",
            growingDays="60-90 days",
            sowingMethod="Direct sow",
            spreadDiameter="30cm",
            rowSpacing="40cm",
            height="80cm"
        )

        self.accessToken  = generateAccessToken(self.sender.id)
        self.refreshToken = generateRefreshToken(self.sender.id)

        ProfileToken.objects.create(
            userId = self.sender.id,
            token = self.refreshToken,
            expiredAt = timezone.now() + timezone.timedelta(days=7)
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.accessToken}')
        self.url = reverse('sharePlantView')

    def test_share_plant_to_user(self):
        payload = {
            "plantId": self.plant.id,
            "textMessage": "Check this plant!",
            "userGroupsIds": [{"id": self.receiver.id, "type": "user"} ]
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Message.objects.filter(sender=self.sender, receiver=self.receiver, plant=self.plant).count(), 2)

    def test_share_plant_to_group(self):
        payload = {
            "plantId": self.plant.id,
            "textMessage": "Check this plant!",
            "userGroupsIds": [{"id": self.group.id, "type": "group"} ]
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(GroupMessage.objects.filter(group=self.group, sender=self.sender, plant=self.plant).count(), 1)

    def test_invalid_plant_id(self):
        payload = {
            "plantId": 999,
            "textMessage": "Invalid plant !",
            "userGroupsIds": [{"id": self.receiver.id, "type": "user"} ]
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Plant not found.')

    def test_invalid_user_id(self):
        payload = {
            "plantId": self.plant.id,
            "textMessage": "Some message",
            "userGroupsIds": [{"id": 9999, "type": "user"}]   
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Message.objects.count(), 0)

    def test_invalid_group_id(self):
        payload = {
            "plantId": self.plant.id,
            "textMessage": "Check this plant!",
            "userGroupsIds": [{"id": 999, "type": "group"} ]
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(GroupMessage.objects.count(), 0)

    def test_unautheticated_access_endpoint(self):
        self.client.credentials()

        payload = {
            "plantId": self.plant.id,
            "textMessage": "Invalid plant !",
            "userGroupsIds": [{"id": self.receiver.id, "type": "user"} ]
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)