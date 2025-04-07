from django.contrib import admin
from .models import Tasks, TaskSuggestion

# Register your models here.
class TasksAdmin(admin.ModelAdmin):
    list_display = ('id', 'owner', 'title', 'scheduledTime')
admin.site.register(Tasks, TasksAdmin)


class TaskSuggestionsAdmin(admin.ModelAdmin):
    list_display = ('id', 'plantName', 'taskType', 'shortDescription')

    def plantName(self, obj):
        return obj.plant.plantName if obj.plant else 'No plant'
    plantName.short_description = 'Plant Name'

    def shortDescription(self, obj):
        return obj.description[:50] + ' ...' if len(obj.description) > 50 else obj.description
    shortDescription.short_description = 'Text'
admin.site.register(TaskSuggestion, TaskSuggestionsAdmin)