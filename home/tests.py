from tasks.models import Tasks
from django.urls import reverse 
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