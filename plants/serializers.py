from rest_framework import serializers
from .models import Plant, SoilType, LifeCycle, LightRequirement


class SoilTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoilType
        fields = ['id', 'name']


class LifeCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = LifeCycle
        fields = ['id', 'name']


class LightRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = LightRequirement
        fields = ['id', 'name']


class PlantSerializer(serializers.ModelSerializer):
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
        model = Plant
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