from .models import Tasks
from django.contrib import admin


# Register your models here.
class TasksAdmin(admin.ModelAdmin):
    list_display = ('id', 'owner', 'title', 'scheduledTime')
admin.site.register(Tasks, TasksAdmin)