from django.db import models


# Create your models here.
class Plants(models.Model):
    plantName       = models.CharField(max_length=100)
    binomialName    = models.CharField(max_length=255, null=True, blank=True)
    description     = models.TextField()
    sunRequirements = models.CharField(max_length=100, blank=True, null=True)
    growingDays     = models.CharField(max_length=50, blank=True, null=True)
    sowingMethod    = models.TextField()
    spreadDiameter  = models.CharField(max_length=50, blank=True, null=True)
    rowSpacing      = models.CharField(max_length=50, blank=True, null=True)
    height          = models.CharField(max_length=50, blank=True, null=True)