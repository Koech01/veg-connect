from django.urls import path
from .views import SharePlantView, PlantGrowthDaysView, ClickedPlantView

urlpatterns = [
    path('v1/plants/send/', SharePlantView.as_view(), name='sharePlantView'),
    path('v1/plants/<int:plantId>/detail/', ClickedPlantView.as_view(), name='clickedPlantView'),
    path('v1/plants/days/', PlantGrowthDaysView.as_view(), name='plantGrowthDaysView'),
]