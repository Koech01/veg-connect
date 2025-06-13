from django.db import models


# Create your models here.
class SoilType(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class LifeCycle(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class LightRequirement(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Plant(models.Model):
    commonName        = models.CharField(max_length=255)
    scientificName    = models.CharField(max_length=255)
    family            = models.CharField(max_length=255)
    width             = models.FloatField(help_text="Width in meters")
    soilpH            = models.CharField(max_length=50, help_text="Example: '6.2 - 6.8'")
    height            = models.FloatField(help_text="Height in meters")
    usdaHardinessZone = models.CharField(max_length=50)
    waterRequirement  = models.CharField(
        max_length=50,
        choices=[
            ("Dry", "Dry"),
            ("Moist", "Moist"),
            ("Wet", "Wet"),
            ("Dry, Moist", "Dry, Moist"),
            ("Moist, Wet", "Moist, Wet"),
            ("Dry, Moist, Wet", "Dry, Moist, Wet"),
            ("Moist, Wet, Water", "Moist, Wet, Water"),
            ("Wet, Water", "Wet, Water"),
        ]
    )

    lifeCycles          = models.ManyToManyField(LifeCycle)
    soilTypes           = models.ManyToManyField(SoilType)
    lightRequirements   = models.ManyToManyField(LightRequirement)
    utility             = models.TextField(help_text="Comma-separated values")
    alternateNames      = models.TextField(help_text="Comma-separated alternative names")
    taskRecommendations = models.TextField(help_text="Full-text recommendations")

    class Meta:
        ordering = ['commonName']
        verbose_name = 'Plant'
        verbose_name_plural = 'Plants'

    def __str__(self):
        return self.commonName