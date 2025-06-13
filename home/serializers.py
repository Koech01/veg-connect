from rest_framework import serializers
from plants.serializers import PlantSerializer 
from .models import City, PlantSearchHistory, Bookmark


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model  = City
        fields = ['id', 'country', 'name', 'precipitationClass'] 


class PlantSearchHistorySerializer(serializers.ModelSerializer): 
    plant = PlantSerializer()
 
    class Meta:
        model  = PlantSearchHistory
        fields = ['id', 'user', 'plant', 'created'] 

    def get_user(self, obj):
        from profiles.serializers import ProfileSerializer 
        return ProfileSerializer(obj.user).data
    

class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Bookmark
        fields = ['id', 'users', 'title', 'context', 'type', 'created'] 