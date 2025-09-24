import os  
import shutil
import tempfile
import pandas as pd 
from .models import Plant
from unittest.mock import patch
from django.urls import reverse  
from django.utils import timezone
from home.models import PlantSearchHistory
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


class ClickedPlantViewTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('clickedPlantView')   
        self.user = Profile.objects.create_user(
            username='plantclicker',
            email='plantclicker@example.com',
            password='SecurePass123!'
        )
        self.accessToken = generateAccessToken(self.user.id)
        self.refreshToken = generateRefreshToken(self.user.id)
        ProfileToken.objects.create(
            userId=self.user.id,
            token=self.refreshToken,
            expiredAt=timezone.now() + timezone.timedelta(days=7)
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.accessToken}')
 
        self.tempDir = tempfile.mkdtemp()
        self.mockCsvPath = os.path.join(self.tempDir, 'vectorised-plant-dataset.csv')
        self._original_read_csv = pd.read_csv
        pd.read_csv = self.mock_read_csv

        self.create_mock_dataset([
            {
                "Common name": "Tomato",
                "Scientific name": "Solanum lycopersicum",
                "Family": "Solanaceae",
                "Width": 0.5,
                "Height": 1.0,
                "Soil pH": "6.0 - 7.0",
                "USDA Hardiness Zone": "10",
                "Water Requirement": "Moist",
                "Life cycle": "Annual",
                "Soil type": "Loamy",
                "Light requirement": "Full Sun",
                "Utility": "Edible, Medicinal",
                "Alternate name": "Tomato Plant, Garden Tomato",
                "Task Recommendations.": "Water regularly."
            }
        ])

        self.patched_plantDf = pd.read_csv(self.mockCsvPath)
        self.plantDf_patcher = patch('plants.views.plantDf', self.patched_plantDf)
        self.plantDf_patcher.start()

    def tearDown(self):
        self.plantDf_patcher.stop()
        pd.read_csv = self._original_read_csv
        shutil.rmtree(self.tempDir, ignore_errors=True)

    def mock_read_csv(self, path, *args, **kwargs):
        return self._original_read_csv(self.mockCsvPath, *args, **kwargs)

    def create_mock_dataset(self, rows):
        columns = [
            "Common name", "Scientific name", "Family", "Width", "Height", "Soil pH",
            "USDA Hardiness Zone", "Water Requirement", "Life cycle", "Soil type",
            "Light requirement", "Utility", "Alternate name", "Task Recommendations."
        ]
        df = pd.DataFrame(rows, columns=columns)
        df.to_csv(self.mockCsvPath, index=False)

    def test_successful_query_by_common_name(self):
        response = self.client.get(self.url, {'query': 'Tomato'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['displayName'], 'tomato')
        self.assertTrue(Plant.objects.filter(commonName='Tomato').exists())
        self.assertTrue(PlantSearchHistory.objects.filter(user=self.user).exists())

    def test_successful_query_by_alternate_name(self):
        response = self.client.get(self.url, {'query': 'Garden Tomato'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['displayName'], 'garden tomato')

    def test_successful_query_by_scientific_name(self):
        response = self.client.get(self.url, {'query': 'Solanum lycopersicum'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['displayName'], 'solanum lycopersicum')

    def test_query_with_no_match_returns_404(self):
        response = self.client.get(self.url, {'query': 'AvocadoPlant'})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data['error'], 'No matching plant found')

    def test_query_without_query_param_returns_400(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'Query required')

    def test_unauthenticated_access_returns_403(self):
        self.client.credentials()
        response = self.client.get(self.url, {'query': 'Tomato'})
        self.assertEqual(response.status_code, 403)

    def test_duplicate_search_does_not_create_duplicate_history(self):
        self.client.get(self.url, {'query': 'Tomato'})
        self.client.get(self.url, {'query': 'Tomato'})
        self.assertEqual(PlantSearchHistory.objects.filter(user=self.user).count(), 1)


class SharePlantViewTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('sharePlantView')  
 
        self.sender = Profile.objects.create_user(
            username='sender',
            email='sender@example.com',
            password='password123'
        )
        self.receiver = Profile.objects.create_user(
            username='receiver',
            email='receiver@example.com',
            password='password123'
        )
        self.receiver2 = Profile.objects.create_user(
            username='receiver2',
            email='receiver2@example.com',
            password='password123'
        )
 
        self.accessToken = generateAccessToken(self.sender.id)
        self.refreshToken = generateRefreshToken(self.sender.id)
        ProfileToken.objects.create(
            userId=self.sender.id,
            token=self.refreshToken,
            expiredAt=timezone.now() + timezone.timedelta(days=7)
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.accessToken}')
 
        self.plant = Plant.objects.create(
            commonName="Tomato",
            scientificName="Solanum lycopersicum",
            family="Solanaceae",
            width=0.5,
            height=1.0,
            soilpH="6.0 - 7.0",
            usdaHardinessZone="10",
            waterRequirement="Moist",
            utility="Edible",
            alternateNames="Tomato Plant",
            taskRecommendations="Water regularly"
        )
 
        self.group = Group.objects.create(name="Gardeners")
        self.group.members.add(self.sender, self.receiver2)

    def test_share_plant_with_user_and_group_successfully(self):
        payload = {
            "commonName": "Tomato",
            "textMessage": "Check out this plant!",
            "userGroupsIds": [
                {"id": self.receiver.id, "type": "user"},
                {"id": self.group.id, "type": "group"}
            ]
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], 'Task sent successfully.')
 
        self.assertEqual(Message.objects.filter(user=self.sender, receiver=self.receiver, plant=self.plant).count(), 1)
        self.assertEqual(Message.objects.filter(user=self.receiver, receiver=self.receiver, plant=self.plant).count(), 1)

        self.assertEqual(Message.objects.filter(user=self.receiver, plant=self.plant).count(), 1)
 
        self.assertEqual(GroupMessage.objects.filter(group=self.group, plant=self.plant).count(), 1)
 
        self.receiver.refresh_from_db()
        self.receiver2.refresh_from_db()
        self.assertTrue(self.receiver.newChat)
        self.assertTrue(self.receiver2.newChat)

    def test_share_plant_missing_common_name_returns_400(self):
        payload = {
            "userGroupsIds": [{"id": self.receiver.id, "type": "user"}],
            "textMessage": "Look at this plant!"
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'commonName is required.')

    def test_share_plant_with_invalid_plant_name_returns_404(self):
        payload = {
            "commonName": "Nonexistent Plant",
            "userGroupsIds": [{"id": self.receiver.id, "type": "user"}],
            "textMessage": "Look at this!"
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data['error'], 'Plant not found.')

    def test_share_plant_with_invalid_user_or_group_ids_skips_them(self):
        payload = {
            "commonName": "Tomato",
            "userGroupsIds": [
                {"id": 9999, "type": "user"},   
                {"id": 8888, "type": "group"}   
            ],
            "textMessage": "Check this plant"
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], 'Task sent successfully.')
        self.assertEqual(Message.objects.count(), 0)
        self.assertEqual(GroupMessage.objects.count(), 0)

    def test_unauthenticated_user_cannot_share_plant(self):
        self.client.credentials()
        payload = {
            "commonName": "Tomato",
            "userGroupsIds": [{"id": self.receiver.id, "type": "user"}],
            "textMessage": "Check this plant"
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, 403)