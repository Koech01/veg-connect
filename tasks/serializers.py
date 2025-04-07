from plants.models import Plants
from profiles.models import Profile
from rest_framework import serializers
from .models import Tasks, TaskSuggestion


class TaskProfileSeriazlier(serializers.ModelSerializer):
    class Meta:
        model  = Profile
        fields = ['id', 'username', 'profileIcon']


class TaskSerializer(serializers.ModelSerializer):
    owner = TaskProfileSeriazlier()

    class Meta:
        model  = Tasks
        fields = [
            'id',
            'owner',
            'title',
            'recurring',
            'recurringType',
            'completed',
            'description',
            'scheduledTime',
            'created'
        ]

    def get_owner(self, obj):
        return obj.owner.id
 

class TaskPlantSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Plants
        fields = ['id', 'plantName']


class TaskSuggestionSerializer(serializers.ModelSerializer):
    plant  = TaskPlantSerializer()

    class Meta:
        model  = TaskSuggestion
        fields = ['id', 'plant', 'taskType', 'description']