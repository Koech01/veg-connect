import re
import random
from django.db import transaction
from rest_framework import status
from profiles.models import Profile
from django.db.models import Q, Count
from rest_framework.views import APIView
from profiles.auth import JWTAuthentication
from rest_framework.response import Response
from .models import Message, Group, GroupMessage
from profiles.serializers import ProfileSerializer
from django.db.models import OuterRef, Subquery, Max
from .serializers import MessageSerializer, GroupMessageSerializer, GroupSerializer


# Create your views here.
class CreateGroupView(APIView):
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        groupName = request.data.get('newGroupName', '').strip() 
        
        if not groupName or groupName == "Name":
            return Response({'error':"Name is required."}, status=status.HTTP_400_BAD_REQUEST)

        if len(groupName) < 5:
            return Response({'error': "Name must be at least 5 characters."}, status=status.HTTP_400_BAD_REQUEST)
 
        if groupName.isdigit():
            return Response({'error': "Name cannot be only numbers."}, status=status.HTTP_400_BAD_REQUEST)

        if not re.search(r'[a-zA-Z0-9]', groupName): 
            return Response({'error': "Name cannot be only special characters."}, status=status.HTTP_400_BAD_REQUEST)

        if Group.objects.filter(name=groupName).exists():
            return Response({'error': 'Group with this name already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            newGroup = Group.objects.create(name=groupName,)
            newGroup.admins.add(profile)
            newGroup.members.add(profile)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        groupSerializer = GroupSerializer(newGroup)
        return Response(groupSerializer.data, status=status.HTTP_201_CREATED)
  

class GroupUpdateView(APIView):
    authentication_classes = [JWTAuthentication]

    def patch(self, request, groupId):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            group = Group.objects.get(id=groupId)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not group.admins.filter(id=profile.id).exists():
            return Response({'error': 'User is not a group admin.'}, status=status.HTTP_403_FORBIDDEN)

        data      = request.data
        groupIcon = request.FILES.get('groupIcon')
        groupName = data.get('groupName', group.name).strip()

        if not groupName or groupName.lower() == "name":
            return Response({'error': "Group name is required."}, status=status.HTTP_400_BAD_REQUEST)

        if len(groupName) < 5:
            return Response({'error': "Group name must be at least 5 characters."}, status=status.HTTP_400_BAD_REQUEST)

        if groupName.isdigit():
            return Response({'error': "Group name cannot be only numbers."}, status=status.HTTP_400_BAD_REQUEST)

        if not re.search(r'[a-zA-Z0-9]', groupName):
            return Response({'error': "Group name cannot consist only of special characters."}, status=status.HTTP_400_BAD_REQUEST)
 
        if Group.objects.filter(name=groupName).exclude(id=group.id).exists():
            return Response({'error': "A group with this name already exists."}, status=status.HTTP_400_BAD_REQUEST)
 
        group.name        = groupName
        group.description = data.get('groupDescription', "").strip() or "An empty canvas for your group's identity—add a description to set the tone!."

        try:
            if groupIcon:
                group.groupIcon = groupIcon
            group.save()
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
 
        serializer = GroupSerializer(group)
        return Response(serializer.data, status=status.HTTP_200_OK)

 
class UserChatsView(APIView):
    authentication_classes = [JWTAuthentication]

    def countUnreadMessages(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        groupIds = profile.groupMembers.values_list('id', flat=True)

        unreadUserMessages = (
            Message.objects.filter(Q(user=profile, receiver=profile))
            .exclude(sender=profile)
            .exclude(deletedBy=profile)
            .exclude(isRead=True)
            .values('sender')  # Group by sender
            .annotate(unreadCount=Count('id'))  
            )

        unreadGroupMessages = (
            GroupMessage.objects.filter(group_id__in=groupIds)
            .exclude(sender=profile)
            .exclude(isRead=profile)
            .values('group_id')  # Group by group id
            .annotate(unreadCount=Count('id')) 
        )

        userMessageCounts = [
            {
                'type': 'user', 'sender': Profile.objects.get(id=item['sender']).username, 'unreadCount' : item['unreadCount']
            }
            for item in unreadUserMessages
        ]
        
        groupMessageCounts = [
            {
                'type' : 'group', 'group' : Group.objects.get(id=item['group_id']).name, 'unreadCount': item['unreadCount']
            }
            for item in unreadGroupMessages
        ]

        combinedMessageCounts = userMessageCounts + groupMessageCounts

        if len(combinedMessageCounts) == 0 and profile.newChat == True:
            profile.newChat = False
            profile.save()
        return combinedMessageCounts


    def get(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)
 
        # Get the latest message id per each chatUser
        latestUserMessageIds = Message.objects.filter(user=profile).filter(
            (Q(sender=profile) | Q(receiver=profile)),
            (Q(sender=OuterRef('receiver')) | Q(receiver=OuterRef('receiver')))
        ).exclude(deletedBy=profile)      
        latestUserMessageIds = latestUserMessageIds.order_by('-created').values('id')[:1]

        # Retrieve the latest chat messages based on the latestMessageIds
        latestUserMessages = Message.objects.filter(
            id__in=Subquery(
                Message.objects.filter((Q(sender=profile) | Q(receiver=profile)))
                .values('sender', 'receiver')
                .distinct().annotate( messageIds=Subquery(latestUserMessageIds)).values('messageIds')
            )
        ).select_related('sender', 'receiver').order_by('-created')

        # Unread group message counts for each group
        unreadMessages = self.countUnreadMessages(request)
        groupIds       = profile.groupMembers.values_list('id', flat=True)
        
        # Annotating each group with the latest created message timestamp
        groupMessages       = GroupMessage.objects.filter(group_id__in=groupIds).exclude(deletedBy=profile)
        latestGroupMessages = groupMessages.values('group').annotate(latest_created=Max('created'))
        
        # Now fetch the actual message objects for the latest messages in each group
        latestGroupMessageObjects = GroupMessage.objects.filter(
            group__in=[group['group'] for group in latestGroupMessages],
            created__in=[group['latest_created'] for group in latestGroupMessages]
        ).order_by('-created')

        # New chat users excluding latestmessage users and profile
        chatUserIds  = latestUserMessages.values_list('sender__id', 'receiver__id')
        chatUserIds  = set([userId for pair in chatUserIds for userId in pair])
        newChatUsers = Profile.objects.filter(visibility=True).exclude(id__in=chatUserIds).exclude(id=profile.id)

        # Profile groups with no group message
        profileGroups = Group.objects.filter(members=profile)
        newGroups     = profileGroups.exclude(groupMessage__isnull=False)

        chatSerializer      = MessageSerializer(latestUserMessages, many=True)
        groupSerializer     = GroupMessageSerializer(latestGroupMessageObjects, many=True)
        newUsersSerializer  = ProfileSerializer(newChatUsers, many=True)
        newGroupsSerializer = GroupSerializer(newGroups, many=True)
  
        serializedMessages = chatSerializer.data + groupSerializer.data
        serializedMessages = sorted(serializedMessages, key=lambda x: x['created'], reverse=True)

        for message in serializedMessages:
            if 'group' in message and message['group']:
                matchingGroup = next(
                    (
                        item for item in unreadMessages 
                        if item['type'] == 'group' and item['group'] == message['group']['name']
                    ),  None
                )
                if matchingGroup:
                    message['unreadCount'] = matchingGroup['unreadCount']

            elif 'receiver' in message and message['receiver']:
                matchingUser = next(
                    (
                        item for item in unreadMessages 
                        if item['type'] == 'user' and item['sender'] == message['sender']['username']
                    ), None
                )
                if matchingUser:
                    message['unreadCount'] = matchingUser['unreadCount']
        return Response({
            "chatMessages" : serializedMessages,
            "chatProfiles" : newUsersSerializer.data,
            "chatGroups"   : newGroupsSerializer.data
        }, status=status.HTTP_200_OK)


class UserMessagesView(APIView):
    authentication_classes = [JWTAuthentication]

    def patch(self, request, chatType, chatId):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        if chatType == 'user':
            try:
                chatUser = Profile.objects.get(id=chatId)
            except Profile.DoesNotExist:
                return Response({'error' : 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

            messages = Message.objects.filter(
                Q(user=profile, sender=profile, receiver=chatUser) | Q(user=profile, sender=chatUser, receiver=profile)
            ).exclude(deletedBy=profile)
            unreadMessages = messages.filter(isRead=False).exclude(sender=profile)
            unreadMessages.update(isRead=True)
            messages = messages.order_by('created')

            if messages.exists():
                serializer = MessageSerializer(messages, many=True)
                return Response({"chatMessages" : serializer.data}, status=status.HTTP_200_OK)
            else:
                recipient = ProfileSerializer(chatUser)
                return Response({"newChatUser" : recipient.data}, status=status.HTTP_200_OK)
            
        elif chatType == 'group':
            try:
                group = Group.objects.get(id=chatId)
            except Group.DoesNotExist:
                return Response({'error' : 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            if not group.members.filter(id=profile.id).exists():
                return Response({'error' : 'User is not a group member.'}, status=status.HTTP_403_FORBIDDEN)
            
            groupMessages = GroupMessage.objects.filter(group=group).exclude(deletedBy=profile)
            for message in groupMessages:
                message.isRead.add(profile) 
            groupMessages = groupMessages.order_by('created')

            if groupMessages.exists():
                serializer = GroupMessageSerializer(groupMessages, many=True)
                return Response({"chatMessages" : serializer.data}, status=status.HTTP_200_OK)
            else:
                groupSerializer = GroupSerializer(group)
                return Response({"emptyChatGroup" : groupSerializer.data}, status=status.HTTP_200_OK)


class JoinGroupView(APIView):
    authentication_classes = [JWTAuthentication]

    def patch(self, request, groupId):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            group = Group.objects.get(id=groupId)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if not group.autoJoin and profile in group.request.all():
            group.request.remove(profile)
        elif not group.autoJoin and profile not in group.request.all():
            group.request.add(profile)
        elif group.autoJoin:
            group.members.add(profile)

        serializer = GroupSerializer(group)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GroupRequestView(APIView):
    authentication_classes = [JWTAuthentication]

    def patch(self, request, requestType, groupId, profileId):
        member  = Profile.objects.get(id=profileId)

        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            group = Group.objects.get(id=groupId)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if requestType == 'accept':
            with transaction.atomic():
                if profile in group.admins.all() and member in group.request.all():
                    group.members.add(member)
                    group.request.remove(member)

        elif requestType == 'decline':
            with transaction.atomic():
                if profile in group.admins.all() and member in group.request.all():
                    group.request.remove(member)

        elif requestType == 'elevate':
            with transaction.atomic():
                if profile in group.admins.all() and member in group.members.all() and member not in group.admins.all():
                    group.admins.add(member)

        elif requestType == 'remove':
            with transaction.atomic():
                if profile in group.admins.all() and member in group.members.all():
                    if member in group.admins.all():
                        group.admins.remove(member)
                    group.members.remove(member)

        elif requestType == 'exit':
            with transaction.atomic():
                if profile in group.admins.all() and member in group.members.all() and profile.id == member.id:
                    if group.admins.count() == 1:
                        if group.members.exclude(id=profile.id).exists():
                            newAdmin = group.members.exclude(id=profile.id).first()
                            group.admins.add(newAdmin)

                    if member in group.admins.all():
                        group.admins.remove(member)
                    group.members.remove(member)

        elif requestType == 'demote':
            with transaction.atomic():
                if profile in group.admins.all() and member in group.admins.all():
                    group.admins.remove(member)

        serializer = GroupSerializer(group)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GroupUpdateAutoJoinView(APIView):
    authentication_classes = [JWTAuthentication]

    def patch(self, request, groupId, autoJoinVal):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            group = Group.objects.get(id=groupId)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not group.admins.filter(id=profile.id).exists():
            return Response({'error': 'User is not a group admin.'}, status=status.HTTP_403_FORBIDDEN)
 
        if autoJoinVal.lower() == 'true':
            group.autoJoin = True
        else:
            group.autoJoin = False
        group.save()

        serializer = GroupSerializer(group)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class ClearChatView(APIView):
    authentication_classes = [JWTAuthentication]

    def patch(self, request, chatType, chatId):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        if chatType == 'user':
            try:
                chatUser = Profile.objects.get(id=chatId)
            except Profile.DoesNotExist:
                return Response({'error' : 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

            messages = Message.objects.filter(
                Q(user=profile, sender=profile, receiver=chatUser) | Q(user=profile, sender=chatUser, receiver=profile)
            )
            
            if messages.exists(): 
                with transaction.atomic():
                    for message in messages:
                        message.deletedBy.add(profile)  
                return Response({'message': 'Chat cleared.'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'No messages found.'}, status=status.HTTP_404_NOT_FOUND)
        
        elif chatType == 'group':
            try:
                group = Group.objects.get(id=chatId)
            except Group.DoesNotExist:
                return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

            if not group.members.filter(id=profile.id).exists():
                return Response({'error': 'User is not a group member.'}, status=status.HTTP_403_FORBIDDEN)

            groupMessages = GroupMessage.objects.filter(group=group).order_by('created')

            if groupMessages.exists():
                with transaction.atomic():
                    for groupMessage in groupMessages:
                        groupMessage.deletedBy.add(profile)
                return Response({'message': 'Group chat cleared.'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'No messages found.'}, status=status.HTTP_404_NOT_FOUND)
            

class GroupSuggestionView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        joinedGroupsCount    = profile.groupMembers.count() 
        requestedGroupsCount = profile.groupRequest.count()
        totalGroupsCount     = Group.objects.count()
  
        if totalGroupsCount == 0:
            return Response({'message': "No groups available at the moment."}, status=status.HTTP_200_OK)
 
        if joinedGroupsCount >= totalGroupsCount:
            return Response({'message': "You've joined all groups - new ones coming soon!"}, status=status.HTTP_200_OK)
 
        if requestedGroupsCount >= totalGroupsCount - joinedGroupsCount:
            return Response({'message': "You're on the waitlist for several groups, hang tight or watch for new ones!"}, status=status.HTTP_200_OK)
 
        availableGroups = Group.objects.exclude(members=profile).exclude(request=profile)
        if availableGroups.exists():
            group      = random.choice(availableGroups)
            serializer = GroupSerializer(group)
            return Response(serializer.data, status=status.HTTP_200_OK) 
        return Response({'error': 'No groups available.'}, status=status.HTTP_404_NOT_FOUND)