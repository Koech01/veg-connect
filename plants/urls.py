from django.urls import path
from .views import SharePlantView, ClickedPlantView


urlpatterns = [ 
    path('v1/plants/detail/', ClickedPlantView.as_view(), name='clickedPlantView'), 
    path('v1/plants/send/', SharePlantView.as_view(), name='sharePlantView'),
]