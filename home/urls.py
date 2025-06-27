from django.urls import path
from .views import HomeView, SearchView, PlantsRecommendationView, GroupPlantsRankView, ToggleBookmarkView, BookmarkListView


urlpatterns = [
    path('v1/home/', HomeView.as_view(), name='homeView'),
    path('v1/home/search/', SearchView.as_view(), name='searchView'), 
    path('v1/home/ranks/', GroupPlantsRankView.as_view(), name='groupPlantsRankView'),
    path('v1/home/bookmark/', ToggleBookmarkView.as_view(), name='toggleBookmarkView'),
    path('v1/home/bookmark/list/', BookmarkListView.as_view(), name='bookmarkListView'),
    path('v1/home/recommendations/', PlantsRecommendationView.as_view(), name='plantsRecommendationView'),
]