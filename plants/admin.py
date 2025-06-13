from django.contrib import admin
from .models import Plant, SoilType, LifeCycle, LightRequirement


@admin.register(SoilType)
class SoilTypeAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(LifeCycle)
class LifeCycleAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(LightRequirement)
class LightRequirementAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'commonName', 'scientificName', 'family', 'height',
        'width', 'soilpH', 'usdaHardinessZone', 'waterRequirement',
    )
    
    search_fields = ['commonName', 'scientificName', 'alternateNames']
    list_filter = ['waterRequirement', 'lifeCycles', 'soilTypes', 'lightRequirements']
    filter_horizontal = ['lifeCycles', 'soilTypes', 'lightRequirements']
    fieldsets = (
        ("Basic Info", {
            "fields": (
                "commonName", "scientificName", "family", "alternateNames", "utility"
            )
        }),
        ("Growth Conditions", {
            "fields": (
                "height", "width", "soilpH", "usdaHardinessZone", "waterRequirement",
                "lifeCycles", "soilTypes", "lightRequirements"
            )
        }),
        ("Care & Tasks", {
            "fields": ("taskRecommendations",)
        }),
    )