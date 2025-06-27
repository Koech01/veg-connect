from .models import Tasks
from datetime import timedelta
from forum.models import Group 
from rest_framework import status
from django.db import transaction
from dateutil.parser import parse
from profiles.models import Profile 
from .serializers import TaskSerializer 
from rest_framework.views import APIView
from profiles.auth import JWTAuthentication
from rest_framework.response import Response
from forum.serializers import GroupSerializer
from forum.models import Message, GroupMessage
from profiles.serializers import ProfileSerializer
from django.utils.timezone import now, make_aware, is_naive


# Create your views here.
class CreateTaskView(APIView):
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error':'User doesnot exist.'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            taskTitle         = request.data.get('taskTitle')
            taskDescription   = request.data.get('taskDescription')
            taskRepeat        = request.data.get('taskRepeat')
            recurringType     = request.data.get('recurringType')
            taskScheduledTime = request.data.get('scheduledTime')

            if not taskTitle or taskTitle.strip() == "" or taskTitle.strip().lower() == "task title":
                return Response({'error':"Task Title cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
            
            if not taskDescription or taskDescription.strip() == "" or taskDescription.strip().lower() == "task details (e.g., 'apply compost to boost growth')":
                return Response({'error':"Task Description cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
            
            if not taskScheduledTime:
                return Response({'error': 'Set task scheduled time and date.'}, status=status.HTTP_400_BAD_REQUEST)
 
            try:
                scheduledDate = parse(taskScheduledTime)
 
                if is_naive(scheduledDate):
                    scheduledDate = make_aware(scheduledDate)

                currentTime = now()

                if not (currentTime <= scheduledDate <= currentTime + timedelta(days=365)):
                    return Response({'error': 'Scheduled time cannot be in the past.'}, status=status.HTTP_400_BAD_REQUEST)
                
            except Exception:
                return Response({'error': 'Invalid scheduled time format.'}, status=status.HTTP_400_BAD_REQUEST)

            else:
                pass
                task = Tasks.objects.create(
                    owner         = profile,
                    title         = request.data.get('taskTitle'),
                    description   = request.data.get('taskDescription'),
                    recurring     = taskRepeat,
                    recurringType = recurringType if taskRepeat else None,
                    scheduledTime = taskScheduledTime
                )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        taskSerializer = TaskSerializer(task)
        return Response(taskSerializer.data, status=status.HTTP_201_CREATED)


class ProfileTasksView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error':'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        userTasks = Tasks.objects.filter(owner=profile)
        taskSerializer = TaskSerializer(userTasks, many=True)
 
        return Response(taskSerializer.data, status=status.HTTP_200_OK)
    
    
class ClickedTaskView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request, taskId):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error':'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            task = Tasks.objects.get(id=taskId, owner=profile)
        except Tasks.DoesNotExist:
            return Response({'error':'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        taskSerializer = TaskSerializer(task)
        return Response(taskSerializer.data, status=status.HTTP_200_OK)


class TaskShareUsersAndGroupsView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        users            = Profile.objects.filter(visibility=True).exclude(id=profile.id)
        groups           = Group.objects.filter(members=profile)
        usersSerializer  = ProfileSerializer(users, many=True)
        groupsSerializer = GroupSerializer(groups, many=True)
        return Response({ 'users' : usersSerializer.data, 'groups': groupsSerializer.data }, status=status.HTTP_200_OK)
    

class ShareTaskView(APIView):
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            profile = Profile.objects.get(username=request.user.username)
        except Profile.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        data          = request.data
        userGroupsIds = data.get('userGroupsIds', [])
        taskId        = data.get('taskId')
        textMessage   = data.get('textMessage') 

        try:
            task = Tasks.objects.get(id=taskId)
        except Tasks.DoesNotExist:
            return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            for ids in userGroupsIds:
                itemId   = ids.get('id')
                itemType = ids.get('type')

                if itemType == 'user':
                    try:
                        receiver = Profile.objects.get(id=itemId)
                        Message.objects.create(user=profile, sender=profile, receiver=receiver, task=task, text=textMessage)
                        Message.objects.create(user=receiver, sender=profile, receiver=receiver, task=task, text=textMessage)
                        if not receiver.newChat:
                            receiver.newChat = True
                            receiver.save()
                    except Profile.DoesNotExist:
                        continue

                elif itemType == 'group':
                    try:
                        group = Group.objects.get(id=itemId)
                        GroupMessage.objects.create(group=group, sender=profile, task=task, text=textMessage) 
                        group.members.filter(newChat=False).exclude(id=profile.id).update(newChat=True)
                    except Group.DoesNotExist:
                        continue

        return Response({'message': 'Task sent successfully.'}, status=status.HTTP_200_OK)


class TaskCompleteToggleView(APIView):
    authentication_classes = [JWTAuthentication]

    def patch(self, request, taskId, taskCompletedVal):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            task = Tasks.objects.get(id=taskId)
        except Tasks.DoesNotExist:
            return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        if task.owner == profile:
            if taskCompletedVal.lower() == 'true':
                task.completed = True
            else:
                task.completed = False
            task.save() 
        else:
            return Response({'error' : 'Not authorized to modify this task.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class DeleteTaskView(APIView):
    authentication_classes = [JWTAuthentication]

    def delete(self, request, taskId):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            task = Tasks.objects.get(id=taskId)
        except Tasks.DoesNotExist:
            return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        if task.owner != profile:
            return Response({'error': f'{profile.user} is not the task owner.'}, status=status.HTTP_403_FORBIDDEN)

        task.delete()
        return Response({'message': 'Task deleted successfully.'}, status=status.HTTP_200_OK)