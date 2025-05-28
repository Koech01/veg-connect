import json
from forum.models import Group
from django.urls import reverse
from plants.models import Plants
from django.utils import timezone
from rest_framework import status 
from rest_framework.test import APITestCase
from tasks.models import Tasks, TaskSuggestion 
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

        self.plant1 = Plants.objects.create( 
            plantName="Tomato",
            binomialName=f"Binomial Tomato",
            description=f"Description Tomato",
            sunRequirements="Full sun",
            growingDays="110 days",
            sowingMethod="Direct sow",
            spreadDiameter="20cm",
            rowSpacing="30cm",
            height="50cm" 
        )

        self.plant2 = Plants.objects.create(
            plantName="Cucumber", 
            binomialName=f"Binomial Cucumber",
            description=f"Description Cucumber",
            sunRequirements="Partial sun",
            growingDays="90 days",
            sowingMethod="Plogh",
            spreadDiameter="25cm",
            rowSpacing="35cm",
            height="55cm"  
        )

        self.plant3 = Plants.objects.create(
            plantName="Carrot",
            binomialName="Daucus carota",
            description="Root vegetable, usually orange in color.",
            sunRequirements="Full sun",
            growingDays="70 days",
            sowingMethod="Direct sow",
            spreadDiameter="5cm",
            rowSpacing="10cm",
            height="30cm"
        )

        self.suggestion1 = TaskSuggestion.objects.create(
            plant=self.plant1,
            taskType='Watering',
            description='Water tomatoes in the evening.'
        )

        self.suggestion2 = TaskSuggestion.objects.create(
            plant=self.plant2,
            taskType='Harvesting',
            description='Harvesting Cucumbers.'
        )

        self.suggestion3 = TaskSuggestion.objects.create(
            plant=self.plant3,
            taskType='Weeding',
            description='Spraying pesticides on carrot nursery.'
        )

        self.suggestionDuplicate = TaskSuggestion.objects.create(
            plant=self.plant1,
            taskType='Watering',
            description='Water tomatoes in the evening.'
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


class CreateTaskSuggestionViewTestCase(AuthenticationTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse('createTaskSuggestion')

    def test_create_task_suggestions(self): 
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        expectedTaskProps = {"Growing Days", "Full Sun", "Partial Sun", "Row Spacing", "Spread Diameter", "Height"}
        taskTypes = TaskSuggestion.objects.exclude(
            id__in=[self.suggestion1.id, self.suggestion2.id, self.suggestion3.id, self.suggestionDuplicate.id]
        ).values_list('taskType', flat=True)
        self.assertTrue(set(taskTypes).issubset(expectedTaskProps))

        for plant in [self.plant1, self.plant2]:
            for taskType in taskTypes:
                count = TaskSuggestion.objects.filter(plant=plant, taskType=taskType).count()
                self.assertLessEqual(count, 1)

    def test_create_task_suggestions_unauthenticated(self):
        self.client.credentials() 
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


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

    def test_auth_user_gets_tasks_and_unique_suggestions(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tasks', response.data)
        self.assertIn('suggestions', response.data)

        self.assertEqual(len(response.data['tasks']), 1)
        self.assertEqual(response.data['tasks'][0]['title'], self.task.title)

        suggestions = response.data['suggestions']
        self.assertLessEqual(len(suggestions), 2)

        seen = set()
        for suggestion in suggestions:
            key = (suggestion['plant']['plantName'], suggestion['taskType'])
            self.assertNotIn(key, seen)
            seen.add(key)

    def test_unauth_user_cannot_access_endpoint(self):
        self.client.credentials()  # Remove auth 
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
        self.client.credentials()  # Remove auth
        url = reverse('clickedTaskView', kwargs={'taskId': self.task.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MobileTaskInsightViewTestCase(AuthenticationTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse('mobileTasksView')

    def test_get_task_insight(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('suggestions', response.data)
        self.assertEqual(len(response.data['suggestions']), 3)

    def test_unauth_user_cannot_access_endpoint(self):
        self.client.credentials()
        response = self.client.get(self.url)
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