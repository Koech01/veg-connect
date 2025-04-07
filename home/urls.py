from django.urls import path
from .views import HomeView, SearchView
from .plantScript import CreatePlantsOnSetup


urlpatterns = [
    path('v1/home/', HomeView.as_view()),
    path('v1/home/search/', SearchView.as_view(), name="search"),
    path('v1/home/plants/', CreatePlantsOnSetup.as_view(), name="createPlants"),
]