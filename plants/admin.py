from .models import Plants
from django.contrib import admin


# Register your models here.
class PlantsAdmin(admin.ModelAdmin):
    list_display = ('id', 'plantName',  'sunRequirements', 'growingDays', 'shortDescription', 'spreadDiameter', 'rowSpacing')

    def shortDescription(self, obj):
        return obj.sowingMethod[:50] + ' ...' if len(obj.sowingMethod) > 50 else obj.sowingMethod
    shortDescription.short_description = 'Text'
admin.site.register(Plants, PlantsAdmin)