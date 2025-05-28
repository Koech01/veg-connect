from tasks.models import Tasks
from django.urls import reverse 
from unittest.mock import patch
from plants.models import Plants
from django.utils import timezone
from rest_framework import status 
from rest_framework.test import APITestCase 
from profiles.models import Profile, ProfileToken
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

        self.oldRecurringTask = Tasks.objects.create(
            owner=self.user,
            title='Water Plants',
            description='Water the garden',
            recurring=True,
            recurringType='daily',
            scheduledTime=timezone.now() - timezone.timedelta(days=1),
            completed=False
        )

        self.futureRecurringTask = Tasks.objects.create(
            owner=self.user,
            title='Fertilize Plants',
            description='Add fertilizer',
            recurring=True,
            recurringType='weekly',
            scheduledTime=timezone.now() + timezone.timedelta(days=2),
            completed=False 
        )

        self.completedTaksk = Tasks.objects.create(
            owner=self.user,
            title='Old Task',
            description='Completed task',
            recurring=True,
            recurringType='monthly',
            scheduledTime=timezone.now() - timezone.timedelta(days=5),
            completed=True
        )


class HomeViewTestCase(AuthenticationTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse('homeView')

    def test_patch_creates_new_recurring_task(self):
        response = self.client.patch(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        newTaskExists = Tasks.objects.filter(
            owner=self.user,
            title='Water Plants',
            scheduledTime__gt=self.oldRecurringTask.scheduledTime
        ).exists()

        self.assertTrue(newTaskExists)

    def test_patch_doesnot_duplicate_existing_future_task(self):
        Tasks.objects.create(
            owner=self.user,
            title='Water Plants',
            description='Water the garden',
            recurring=True,
            recurringType='daily',
            scheduledTime=timezone.now() + timezone.timedelta(days=1)
        )

        response = self.client.patch(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        duplicate = Tasks.objects.filter(
            owner=self.user,
            title='Water Plants',
            scheduledTime__gt=self.oldRecurringTask.scheduledTime
        )

        self.assertEqual(duplicate.count(), 1)
    
    def test_unauth_user_cannot_access_endpoint(self):
        self.client.credentials()
        response = self.client.patch(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SearchViewTestCase(AuthenticationTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse('searchView')

        self.task = Tasks.objects.create(
            owner=self.user,
            title='Water the tomato plants',
            description='Detailed task about watering.',
            scheduledTime=timezone.now() + timezone.timedelta(days=1)
        )

        self.plant = Plants.objects.create(
            plantName='Tomato',
            binomialName='Solanum lycopersicum',
            description='Common tomato plant.',
            sunRequirements='Full Sun',
            growingDays='90',
            sowingMethod='Direct sow',
            spreadDiameter='45cm',
            rowSpacing='60cm',
            height='120cm'
        )

    def test_search_returns_tasks_and_plants(self):
        response = self.client.get(self.url, {'search' : 'tomato'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tasks', response.data)
        self.assertIn('plants', response.data)
        self.assertTrue(any('tomato' in task['title'].lower() for task in response.data['tasks']))
        self.assertTrue(any('tomato' in task['plantName'].lower() for task in response.data['plants']))

    def test_search_without_query_returns_400(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'No search term provided')
    
    @patch("requests.get")
    def test_search_triggers_openfarm_api_no_match(self, mock_get):
        Plants.objects.all().delete()
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            'data' : [{
                'attributes' : {
                    'name': 'Tomato',
                    'binomial_name': 'Solanum lycopersicum',
                    'description': 'A red juicy fruit',
                    'sun_requirements': 'Full sun',
                    'growing_degree_days': '90 days',
                    'sowing_method': 'Direct sow',
                    'spread': '50cm',
                    'row_spacing': '60cm',
                    'height': '100cm'
                }
            }]
        }

        response = self.client.get(self.url, {'search':'tomato'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('plants', response.data)
        self.assertTrue(any(plant['plantName'].lower() == 'tomato' for plant in response.data['plants']))

    @patch("requests.get")
    def test_search_triggers_openfarm_api_on_match(self, mock_get):
        Plants.objects.all().delete()
        mock_get.return_value.status_code = 500
        mock_get.return_value.json.return_value = {}
        response = self.client.get(self.url, {'search':'unknownplant'})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data['error'], 'Failed to retrieve data from OpenFarm')