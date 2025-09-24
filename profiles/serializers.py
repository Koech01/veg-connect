from .models import Profile
from rest_framework import serializers
from home.serializers import CitySerializer
from django.core.validators import EmailValidator
from rest_framework.validators import UniqueValidator
from django.core.validators import MinLengthValidator
from django.contrib.auth.password_validation import validate_password


class ProfileSerializer(serializers.ModelSerializer):
    profileIcon = serializers.ImageField(max_length=None, use_url=True, required=False)
    username    = serializers.CharField(
        required=True,
        validators=[
            UniqueValidator(queryset=Profile.objects.all()),
            MinLengthValidator(5, message='Username must be at least 5 characters.')
        ],
        error_messages={
            'unique'    : 'This username is already taken.',
            'min_length': 'Username must be at least 5 characters.',
        }
    )

    email = serializers.CharField(
        validators=[
            EmailValidator(message='Enter a valid email address.')
        ],
        error_messages={ 'invalid': 'Enter a valid email address.', }
    )

    password = serializers.CharField(
        max_length=100,
        write_only=True,
        validators=[validate_password],
        error_messages={
            'password_too_short'       : 'Password must contain at least 8 characters.',
            'password_too_common'      : 'This password is too common.',
            'password_entirely_numeric': 'Password cannot be entirely numeric.',
            'password_entirely_alpha'  : 'Password cannot be entirely alphabetic.',
        }
    )

    climate = CitySerializer(required=False, allow_null=True)

    class Meta:
        model  = Profile
        fields = [
            'id', 
            'password',
            'username', 
            'firstName', 
            'lastName', 
            'email', 
            'profileIcon', 
            'displayTheme', 
            'newChat', 
            'visibility', 
            'guestMode', 
            'receiveMails',  
            'climate', 
            'plantInterests', 
            'plantHistory',  
            'created'
        ]
        extra_kwargs = { 'password' : {'write_only' : True} }


    def validate_email(self, value):
        if self.instance: 
            existingProfiles = Profile.objects.exclude(id=self.instance.id)
            if existingProfiles.filter(email=value).exists():
                raise serializers.ValidationError('This email is already taken.')
        else:
            if Profile.objects.filter(email=value).exists():
                raise serializers.ValidationError('This email is already taken.')
        return value

    def create(self, validated_data): 
        plantInterests = validated_data.pop('plantInterests', [])
        plantHistory   = validated_data.pop('plantHistory', [])

        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)

        if password:
            instance.set_password(password)
        instance.save()
 
        if plantInterests:
            instance.plantInterests.set(plantInterests)
        if plantHistory:
            instance.plantHistory.set(plantHistory) 
        return instance