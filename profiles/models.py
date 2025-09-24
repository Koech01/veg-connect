from django.db import models
from home.models import City 
from plants.models import Plant
from .imageUID import profileIconUID
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator
from django.contrib.auth.password_validation import validate_password


class Profile(AbstractUser):
    THEME_CHOICES = ( ('light', 'Light'), ('dark', 'Dark'), )

    username       = models.CharField(max_length=50, unique=True, blank=False)
    firstName      = models.CharField(max_length=50, blank=True)
    lastName       = models.CharField(max_length=50, blank=True)
    email          = models.CharField(max_length=255, unique=True)
    password       = models.CharField(max_length=100)
    profileIcon    = models.ImageField(default='profileIcon.png', upload_to=profileIconUID, validators=[FileExtensionValidator(['png', 'jpeg', 'jpg'])])
    displayTheme   = models.CharField(max_length=5, choices=THEME_CHOICES, default='light')
    newChat        = models.BooleanField(default=False)
    visibility     = models.BooleanField(default=True)
    guestMode      = models.BooleanField(default=False)
    receiveMails   = models.BooleanField(default=False)
    climate        = models.ForeignKey(City, on_delete=models.SET_NULL, related_name='userClimate', blank=True, null=True)
    plantInterests = models.ManyToManyField(Plant, blank=True, related_name='plantUserInterests') 
    plantHistory   = models.ManyToManyField('home.PlantSearchHistory', blank=True, related_name='plantUserHistory')
    created        = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD  = 'username'
    REQUIRED_FIELDS = []

    def clean(self):
        super().clean()
        try:
            validate_password(self.password, self)
        except ValidationError as error:
            self.add_error('password', error)

    
class ProfileToken(models.Model):
    userId    = models.IntegerField()
    token     = models.CharField(max_length=255)
    createdAt = models.DateTimeField(auto_now_add=True)
    expiredAt = models.DateTimeField()

    def __str__(self):
        return f"{self.token}"


class ResetPassword(models.Model):
    email = models.CharField(max_length=255)
    token = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return f"{self.email} {self.token}"