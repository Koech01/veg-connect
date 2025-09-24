from django.db import models
from profiles.models import Profile


# Create your models here.
class Tasks(models.Model):
    owner         = models.ForeignKey(Profile, on_delete=models.CASCADE)
    title         = models.CharField(max_length=200, blank=False)
    description   = models.TextField(max_length=500, blank=False)
    recurring     = models.BooleanField(default=False)
    recurringType = models.CharField(max_length=10, choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly')], null=True, blank=True)
    completed     = models.BooleanField(default=False)
    scheduledTime = models.DateTimeField()
    created       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Tasks'  