from tasks.models import Tasks
from plants.models import Plant
from profiles.models import Profile
from rest_framework import serializers
from .models import Message, MessageFile, Group, GroupMessage
 

class MessagePlantSerializer(serializers.ModelSerializer):
    lifeCycles = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )
    soilTypes = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )
    lightRequirements = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )
    
    class Meta:
        model  = Plant
        fields = [
            'id',
            'commonName',
            'scientificName',
            'family',
            'width',
            'soilpH',
            'height',
            'usdaHardinessZone',
            'waterRequirement',
            'lifeCycles',
            'soilTypes',
            'lightRequirements',
            'utility',
            'alternateNames',
            'taskRecommendations',
        ]


class MessageTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tasks
        fields = ['id', 'title', 'description', 'completed', 'created']


class MessageProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Profile
        fields = ['id', 'username', 'profileIcon']


class MessageFileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MessageFile
        fields = ['id', 'file', 'created']


class MessageSerializer(serializers.ModelSerializer):
    user        = MessageProfileSerializer()
    sender      = MessageProfileSerializer()
    receiver    = MessageProfileSerializer()
    task        = MessageTaskSerializer()
    plant       = MessagePlantSerializer()
    files       = MessageFileSerializer(many=True)
    unreadCount = serializers.IntegerField(default=0) 
    
    class Meta:
        model  = Message
        fields = ['id', 'user', 'sender', 'receiver', 'text', 'files', 'task', 'plant', 'unreadCount', 'created']

    def get_user(self, obj):
        return obj.user.id
    
    def get_sender(self, obj):
        return obj.sender.id
    
    def get_receiver(self, obj):
        return obj.receiver.id
    

class GroupSerializer(serializers.ModelSerializer):
    groupIcon = serializers.ImageField(max_length=None, use_url=True, required=False)
    admins    = MessageProfileSerializer(many=True)
    members   = MessageProfileSerializer(many=True)
    request   = MessageProfileSerializer(many=True)
    
    class Meta:
        model  = Group
        fields = ['id', 'name', 'description', 'admins', 'groupIcon', 'members', 'request', 'autoJoin', 'created']
     
     
class GroupMessageSerializer(serializers.ModelSerializer):
    group       = GroupSerializer()
    sender      = MessageProfileSerializer()
    task        = MessageTaskSerializer()
    plant       = MessagePlantSerializer()
    files       = MessageFileSerializer(many=True)  
    unreadCount = serializers.IntegerField(default=0) 

    class Meta:
        model  = GroupMessage
        fields = ['id', 'group', 'sender', 'text', 'files', 'task', 'plant', 'unreadCount', 'created']

    def get_sender(self, obj):
        return obj.sender.id