import json
from tasks.models import Tasks 
from forum.models import Group
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

        self.task = Tasks.objects.create(
            owner=self.user,  
            title='Test title.',
            description='A test task description.',
            scheduledTime=timezone.now() + timezone.timedelta(days=2)
        )

        self.user2 = Profile.objects.create(
            username='farmerKenya',
            email='farmerKenya@example.com',
            password='Testpass@123'
        )

        self.user3 = Profile.objects.create(
            username='farmerNigeria',
            email='farmerNigeria@example.com',
            password='Testpass@123'
        )

        self.group1 = Group.objects.create(
            groupIcon   = '',
            name        = 'Test Group 1',
            description = 'Test Group One.', 
            autoJoin    = True,
            created     = timezone.now() - timezone.timedelta(days=5)
        )

        self.group1.admins.set([self.user.id, self.user2.id])
        self.group1.members.set([self.user.id, self.user2.id])
 
        self.group2 = Group.objects.create(
            groupIcon   = '',
            name        = 'Test Group 2',
            description = 'Test Group Two.',
            autoJoin    = True,
            created     = timezone.now() - timezone.timedelta(days=4)
        )

        self.group2.admins.set([self.user2.id, self.user3.id])
        self.group2.members.set([self.user.id, self.user2.id, self.user3.id])


class CreateTaskViewTestCase(AuthenticationTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse('createTaskView')
        Tasks.objects.all().delete()

    def test_create_task_success(self):
        scheduleTime = (timezone.now() + timezone.timedelta(days=3)).isoformat()
        taskObj = {
            'taskTitle': 'Irrigation Check',
            'taskDescription': 'Check the irrigation system for leaks.',
            'taskRepeat': True,
            'recurringType': 'weekly',
            'scheduledTime': scheduleTime
        }

        response = self.client.post(self.url, data=json.dumps(taskObj), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Tasks.objects.count(), 1)
        self.assertEqual(Tasks.objects.first().title, 'Irrigation Check')

    def test_create_task_missing_title(self):
        taskObj = {
            'taskTitle': '',
            'taskDescription': 'Some Description no title',
            'taskRepeat': False,
            'scheduledTime': (timezone.now() + timezone.timedelta(days=2)).isoformat()
        }

        response = self.client.post(self.url, data=json.dumps(taskObj), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_create_task_missing_description(self):
        taskObj = {
            'taskTitle': 'Task no description',
            'taskDescription': '',
            'taskRepeat': False,
            'scheduledTime': (timezone.now() + timezone.timedelta(days=2)).isoformat()
        }

        response = self.client.post(self.url, data=json.dumps(taskObj), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_create_task_in_the_past(self):
        taskObj = {
            'taskTitle': 'Old task',
            'taskDescription': 'Some Description',
            'taskRepeat': False,
            'scheduledTime': (timezone.now() - timezone.timedelta(days=2)).isoformat()
        }

        response = self.client.post(self.url, data=json.dumps(taskObj), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_create_task_unauthenticated(self):
        self.client.credentials()   
        taskObj = {
            'taskTitle': 'Task auth check',
            'taskDescription': 'check for auth',
            'taskRepeat': True,
            'recurringType': 'weekly',
            'scheduledTime': (timezone.now() + timezone.timedelta(days=3)).isoformat()
        }
 
        response = self.client.post(self.url, data=json.dumps(taskObj), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ProfileTasksViewTestCase(AuthenticationTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse('allTasksView')
        self.now = timezone.now()

        Tasks.objects.all().delete()
 
        self.task1 = Tasks.objects.create(
            owner=self.user,
            title='Water Plants',
            description='Daily watering routine.',
            scheduledTime=self.now + timezone.timedelta(days=1)
        )
        self.task2 = Tasks.objects.create(
            owner=self.user,
            title='Fertilize Soil',
            description='Monthly soil fertilization.',
            recurring=True,
            recurringType='monthly',
            scheduledTime=self.now + timezone.timedelta(days=30)
        )
 
        Tasks.objects.create(
            owner=self.user2,
            title='User2 Task',
            description='Should not be visible to self.user.',
            scheduledTime=self.now + timezone.timedelta(days=2)
        )   

    def test_get_tasks_success_authenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        taskTitles = {task['title'] for task in response.data}
        self.assertIn('Water Plants', taskTitles)
        self.assertIn('Fertilize Soil', taskTitles)
        self.assertNotIn('User2 Task', taskTitles)

    def test_get_empty_tasks(self):
        Tasks.objects.filter(owner=self.user).delete()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_get_tasks_unauthenticated(self):
        self.client.credentials()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ClickedTaskViewTestCase(AuthenticationTestCase):
    def setUp(self):
        super().setUp()

    def test_auth_user_can_view_own_task(self):
        url = reverse('clickedTaskView', kwargs={'taskId': self.task.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.task.id)
        self.assertEqual(response.data['title'], self.task.title)

    def test_return_404_if_task_not_found(self):
        url = reverse('clickedTaskView', kwargs={'taskId': 999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Task not found.')

    def test_unauth_user_cannot_access_endpoint(self):
        self.client.credentials()  
        url = reverse('clickedTaskView', kwargs={'taskId': self.task.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

 
class TaskCompleteToggleViewTestCase(AuthenticationTestCase):
    def setUp(self):
        super().setUp()

    def test_user_can_mark_task_as_completed(self):
        url = reverse('taskComplete', kwargs={'taskId': self.task.id, 'taskCompletedVal':'true'})
        response = self.client.patch(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['completed'])

    def test_users_can_mark_task_as_incomplete(self):
        self.task.completed = True
        self.task.save()

        url = reverse('taskComplete', kwargs={'taskId': self.task.id, 'taskCompletedVal':'false'})
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['completed'])

    def test_user_cannot_toggle_others_task(self):
        othersTask = Tasks.objects.create(
            owner=self.user2,
            title='Other user task.',
            description='Should not be accessible.',
            scheduledTime=timezone.now() + timezone.timedelta(days=3)
        )

        url = reverse('taskComplete', kwargs={'taskId':othersTask.id, 'taskCompletedVal':'true'})
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'Not authorized to modify this task.')

    def test_handles_task_not_found(self):
        url = reverse('taskComplete', kwargs={'taskId':999, 'taskCompletedVal':'true'})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Task not found.')
    
    def test_handles_profile_not_found(self):
        self.user.delete()
        url = reverse('taskComplete', kwargs={'taskId':self.task.id, 'taskCompletedVal':'false'})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], 'User profile not found')

    def test_unauth_user_cannot_access_endpoint(self):
        self.client.credentials()
        url = reverse('taskComplete', kwargs={'taskId' : self.task.id, 'taskCompletedVal' : 'true'})
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DeleteTaskViewTestCase(AuthenticationTestCase):
    def setUp(self):
        super().setUp()
 
    def test_auth_user_can_delete_own_task(self):
        url = reverse('deleteTaskView', kwargs={'taskId':self.task.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Task deleted successfully.')
        self.assertFalse(Tasks.objects.filter(id=self.task.id).exists())

    def test_task_not_found_returns_404(self):
        url = reverse('deleteTaskView', kwargs={'taskId':9999})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Task not found.')

    def test_unauth_user_cannot_cannot_access_endpoint(self):
        self.client.credentials()
        url = reverse('deleteTaskView', kwargs={'taskId': self.task.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)