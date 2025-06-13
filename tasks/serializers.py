from .models import Tasks
from profiles.models import Profile
from rest_framework import serializers


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