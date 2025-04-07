from .models import Plants
from rest_framework import serializers

class PlantSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Plants
        fields = [
            'id',
            'plantName',
            'binomialName',
            'description',
            'sunRequirements',
            'growingDays',
            'sowingMethod',
            'spreadDiameter',
            'rowSpacing',
            'height'
        ]