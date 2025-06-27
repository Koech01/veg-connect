import io 
from PIL import Image   
from tasks.models import Tasks 
from django.urls import reverse
from django.utils import timezone
from rest_framework import status 
from rest_framework.test import APITestCase
from profiles.models import Profile, ProfileToken
from forum.models import Group, Message, GroupMessage 
from django.core.files.uploadedfile import SimpleUploadedFile
from profiles.auth import generateAccessToken, generateRefreshToken 


# Create your tests here.
class AuthTestCase(APITestCase):
    def setUp(self):
        self.user = Profile.objects.create_user(
            username='groupuser',
            email='groupuser@example.com',
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


class UserChatsViewTestCase(APITestCase):
    def setUp(self):
        self.user = Profile.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='Testpass@123'
        )

        self.otherUser = Profile.objects.create_user(
            username='otherUser',
            email='otherUser@example.com',
            password='Testpass@123'
        )
 
        self.accessToken = generateAccessToken(self.user.id)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.accessToken}')

        self.group = Group.objects.create(name='TestGroup')
        self.group.members.add(self.user)
        self.group.admins.add(self.user)

        self.directMessage = Message.objects.create(
            user=self.user,
            sender=self.otherUser,
            receiver=self.user,
            text='Hello',
            isRead=False
        )

        self.groupMessage = GroupMessage.objects.create(
            group=self.group,
            sender=self.otherUser,
            text='Hello chat.'
        )

        self.url = reverse('userChatsView')

    def test_user_chats_view_success(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('chatMessages', response.data)
        self.assertIn('chatProfiles', response.data)
        self.assertIn('chatGroups', response.data)

        chatMessages = response.data['chatMessages']
        self.assertTrue(any(message['text'] == 'Hello' for message in chatMessages))
        self.assertTrue(any(message['text'] == 'Hello chat.' for message in chatMessages))

    def test_user_chats_view_unread_count(self):
        response = self.client.get(self.url)
        chatMessages = response.data['chatMessages']
        direct = next((msg for msg in chatMessages if msg['text'] == 'Hello'), None)
        self.assertIsNotNone(direct)
        self.assertIn('unreadCount', direct)
        self.assertEqual(direct['unreadCount'], 1)

    def test_user_chats_view_unauth(self):
        self.client.credentials()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class CreateGroupViewTestCase(AuthTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse('createGroupView')
        Tasks.objects.all().delete()

    def test_create_group_success(self):
        payload = {'newGroupName' : 'ValidGroup123'}

        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Group.objects.count(), 1)

        group = Group.objects.first()
        self.assertEqual(group.name, payload['newGroupName'])
        self.assertIn(self.user, group.admins.all())
        self.assertIn(self.user, group.members.all())

    def test_create_group_name_required(self):
        payload = {'newGroupName' : ''}
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_create_group_name_too_short(self):
        payload = {'newGroupName' : 'abc'}
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_create_group_name_is_numeric(self):
        payload = {'newGroupName' : '123456'}
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
      
    def test_create_group_name_special_charcters(self):
        payload = {'newGroupName' : '@#$%^&'}
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_group_duplicate_name(self):
        Group.objects.create(name='existingGroup')
        payload = {'newGroupName' : 'existingGroup'}
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_group_unauth(self):
        self.client.credentials()
        payload = {'newGroupName' : 'anotherGroup'}
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class JoinGroupViewTestCase(AuthTestCase):
    def setUp(self):
        super().setUp()
    
    def test_auto_join_adds_users_to_members(self):
        group = Group.objects.create(name='AutoJoinGroup', autoJoin=True)
        url = reverse('joinGroupView', kwargs={'groupId' : group.id})
        
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        group.refresh_from_db()
        self.assertIn(self.user, group.members.all())
        self.assertNotIn(self.user, group.request.all())

    def test_request_added_if_not_already_requested(self):
        group = Group.objects.create(name='ManualJoinGroup', autoJoin=False)
        url = reverse('joinGroupView', kwargs={'groupId' : group.id})
        
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        group.refresh_from_db()
        self.assertIn(self.user, group.request.all())
        self.assertNotIn(self.user, group.members.all())

    def test_request_removed_if_not_already_requested(self):
        group = Group.objects.create(name='RequestedJoinGroup', autoJoin=False)
        group.request.add(self.user)
        url = reverse('joinGroupView', kwargs={'groupId' : group.id})
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        group.refresh_from_db()
        self.assertNotIn(self.user, group.members.all())
        self.assertNotIn(self.user, group.request.all())

    def test_join_group_user_not_found(self):
        self.user.delete()
        group = Group.objects.create(name='NotFoundGroup', autoJoin=False)
        url = reverse('joinGroupView', kwargs={'groupId' : group.id})
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_join_group_not_found(self):
        badUrl = reverse('joinGroupView', kwargs={'groupId' : 999})
        response = self.client.patch(badUrl)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)

    def test_join_group_unauth(self):
        self.client.credentials()
        group = Group.objects.create(name='UnauthJoinGroup', autoJoin=False)
        url = reverse('joinGroupView', kwargs={'groupId' : group.id})
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class GroupRequestViewTestCase(AuthTestCase):
    def setUp(self):
        super().setUp()

        self.firstUser = Profile.objects.create_user(
            username='firstUser',
            email='firstUser@example.com',
            password='Testpass@123'
        )
        self.group = Group.objects.create(name='RequestedGroup')
        self.group.admins.add(self.user)
        self.group.members.add(self.user) 

    def test_accept_request(self):
        self.group.request.add(self.firstUser)

        url = reverse('groupRequestView', kwargs={ 'requestType': 'accept', 'groupId': self.group.id, 'profileId': self.firstUser.id})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.firstUser, self.group.members.all())
        self.assertNotIn(self.firstUser, self.group.request.all())

    def test_decline_request(self):
        self.group.request.add(self.firstUser)

        url = reverse('groupRequestView', kwargs={'requestType': 'decline', 'groupId': self.group.id, 'profileId' : self.firstUser.id})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.firstUser, self.group.request.all())

    def test_elevate_member_to_admin(self):
        self.group.members.add(self.firstUser)

        url = reverse('groupRequestView', kwargs={'requestType': 'elevate', 'groupId': self.group.id, 'profileId' : self.firstUser.id})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.firstUser, self.group.admins.all())
    
    def test_remove_user_as_member_and_admin(self):
        self.group.members.add(self.firstUser)
        self.group.admins.add(self.firstUser)

        url = reverse('groupRequestView', kwargs={'requestType': 'remove', 'groupId': self.group.id, 'profileId' : self.firstUser.id})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.firstUser, self.group.members.all())
        self.assertNotIn(self.firstUser, self.group.admins.all())

    def test_admin_exit_assign_new(self):
        self.group.members.add(self.firstUser)

        url = reverse('groupRequestView', kwargs={'requestType': 'exit', 'groupId': self.group.id, 'profileId' : self.user.id })

        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.group.refresh_from_db()

        self.assertNotIn(self.user, self.group.members.all())
        self.assertIn(self.firstUser, self.group.members.all())
        self.assertIn(self.firstUser, self.group.admins.all())

    def test_demote_admin(self):
        self.group.members.add(self.firstUser)
        self.group.admins.add(self.firstUser)

        url = reverse('groupRequestView', kwargs={ 'requestType': 'demote', 'groupId': self.group.id, 'profileId' : self.firstUser.id})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.firstUser, self.group.admins.all())

    def test_group_not_found(self):
        self.group.request.add(self.firstUser)

        url = reverse('groupRequestView', kwargs={'requestType': 'accept', 'groupId': 999, 'profileId' : self.firstUser.id})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_group_unauth_request(self):
        self.group.request.add(self.firstUser)
        self.client.credentials()

        url = reverse('groupRequestView', kwargs={'requestType': 'accept', 'groupId': self.group.id, 'profileId' : self.firstUser.id})

        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class GroupUpdateAutoJoinViewTestCase(AuthTestCase):
    def generatePhotoFile(self):
        img = Image.new('RGB', (100, 100), color='red')
        tempFile = io.BytesIO()
        img.save(tempFile, format='PNG')
        tempFile.name = 'test.png'
        tempFile.seek(0) 
        return SimpleUploadedFile('test.png', tempFile.read(), content_type='image/png')
    
    def setUp(self):
        super().setUp()

        self.group = Group.objects.create(name='InitialGroup')
        self.group.admins.add(self.user)
        self.group.members.add(self.user)

        self.url = reverse('groupUpdateView', kwargs={'groupId' : self.group.id})
 
    def test_update_group_success(self):
        payload = {
            'groupName': 'UpdatedGroup',
            'groupDescription': 'Updated description'
        }

        imageFile = self.generatePhotoFile()
        response = self.client.patch(self.url, data=payload, format='multipart', files={'groupIcon' : imageFile})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.group.refresh_from_db()
        self.assertEqual(self.group.name, payload['groupName'])
        self.assertEqual(self.group.description, payload['groupDescription'])

    def test_update_group_name_is_too_short(self):
        response = self.client.patch(self.url, {'groupName' : 'abc'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_update_group_name_is_numeric(self):
        response = self.client.patch(self.url, {'groupName' : '12345'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_update_group_name_is_special_charcters(self):
        response = self.client.patch(self.url, {'groupName' : '!@#$%'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_group_name_duplicate(self):
        Group.objects.create(name='ExistingGroup')
        response = self.client.patch(self.url, {'groupName' : 'ExistingGroup'}) 
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_group_unauth(self):
        self.client.credentials()
        payload = {'groupName' : 'NoAuthGroup'}
        response = self.client.patch(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ClearChatTestCaseView(AuthTestCase):
    def setUp(self):
        super().setUp()

        self.group = Group.objects.create(name='MessagesGroup')
        self.otherUser = Profile.objects.create_user(
            username='otherUser',
            email='otherUser@example.com',
            password='Testpass@123'
        )

        self.group.members.add(self.user)
        self.group.admins.add(self.user)

        self.groupMessage = GroupMessage.objects.create(
            group=self.group,
            sender=self.user,
            text='Hello everyone.'
        )

        self.chatMessage = Message.objects.create(
            user=self.user,
            sender=self.otherUser,
            receiver=self.user,
            text=f"Hey {self.user}."
        )

    def test_clear_user_chat_successfully(self):
        url = reverse('clearChatMessagesView', kwargs={'chatType': 'user', 'chatId': self.otherUser.id})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Chat cleared.')
        self.assertIn(self.user, Message.objects.first().deletedBy.all())

    def test_clear_user_chat_with_no_messages(self):
        Message.objects.all().delete()

        url = reverse('clearChatMessagesView', kwargs={'chatType': 'user', 'chatId': self.otherUser.id})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'No messages found.')

    def test_clear_user_chat_user_not_found(self):
        url = reverse('clearChatMessagesView', kwargs={'chatType': 'user', 'chatId': 999})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_clear_group_chat_successfully(self):
        url = reverse('clearChatMessagesView', kwargs={'chatType': 'group', 'chatId': self.group.id})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Group chat cleared.')
        self.assertIn(self.user, GroupMessage.objects.first().deletedBy.all())

    def  test_clear_group_chat_not_found(self):
        url = reverse('clearChatMessagesView', kwargs={'chatType': 'group', 'chatId': 999})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_clear_group_chat_with_no_messages(self):
        GroupMessage.objects.all().delete()

        url = reverse('clearChatMessagesView', kwargs={'chatType': 'group', 'chatId': self.group.id})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'No messages found.')

    def test_unauth_user_cannot_clear_chat(self):
        self.client.credentials()
        url = reverse('clearChatMessagesView', kwargs={'chatType': 'user', 'chatId': self.otherUser.id})
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)