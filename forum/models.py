from django.db import models
from tasks.models import Tasks
from plants.models import Plant
from .imageUID import groupIconUID
from profiles.models import Profile
from .fileUID import messageFileUID
from django.core.validators import FileExtensionValidator


# Create your models here.
class MessageFile(models.Model):
    file = models.FileField(
        upload_to  = messageFileUID, 
        validators = [FileExtensionValidator(['png', 'jpeg', 'jpg', 'mp4', 'avi', 'mov'])]
    )
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        formattedDate = self.created.strftime("%I:%M %p %d %B, %Y")
        return f"id : {self.id}, Created on : {formattedDate}"


class Message(models.Model):
    user      = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='user')
    sender    = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='sender')
    receiver  = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='receiver')
    task      = models.ForeignKey(Tasks, on_delete=models.CASCADE, related_name='messageTask', blank=True, null=True)
    plant     = models.ForeignKey(Plant, on_delete=models.CASCADE, related_name='messagePlants', blank=True, null=True)
    deletedBy = models.ManyToManyField(Profile, blank=True, related_name="userDeletedMessage")
    text      = models.CharField(max_length=1000, blank=True)
    files     = models.ManyToManyField(MessageFile, blank=True)
    isRead    = models.BooleanField(default=False)
    created   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created',)

    def __str__(self):
        return f"id : {self.id}, text : {self.text[:20]}"


class Group(models.Model):
    groupIcon   = models.ImageField(default='profileIcon.png', upload_to=groupIconUID, validators=[FileExtensionValidator(['png', 'jpeg', 'jpg'])])
    name        = models.CharField(max_length=100, unique=True)
    description = models.TextField(default="An empty canvas for your group's identity—add a description to set the tone!.", blank=True, null=True) 
    admins      = models.ManyToManyField(Profile, related_name="groupAdmins")
    members     = models.ManyToManyField(Profile, related_name="groupMembers")
    request     = models.ManyToManyField(Profile, related_name="groupRequest", blank=True)
    autoJoin    = models.BooleanField(default=True)
    created     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created',)

    def __str__(self):
        return f"{self.name}"
    

class GroupMessage(models.Model):
    group     = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="groupMessage")
    sender    = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="groupSender")
    task      = models.ForeignKey(Tasks, on_delete=models.CASCADE, related_name='groupMessageTask', blank=True, null=True)
    plant     = models.ForeignKey(Plant, on_delete=models.CASCADE, related_name='groupMessagePlant', blank=True, null=True)
    deletedBy = models.ManyToManyField(Profile, blank=True, related_name="userDeletedGroupMessage")
    text      = models.CharField(max_length=1000, blank=True)
    files     = models.ManyToManyField(MessageFile, blank=True)    
    isRead    = models.ManyToManyField(Profile, blank=True, related_name="readGroupMessages") 
    created   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created',)

    def __str__(self):
        return f"{self.text[:20]}"