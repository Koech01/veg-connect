from django.urls import path
from .views import SignUpView, LoginView, ProfileToggleView, ProfileUpdateView, ProfileClimateView, OnboardingPlantListView
from .views import LogoutView, RefreshApiView, ForgotPasswordView, ResetPasswordView, ProfileUpdatePlantInterestsView

urlpatterns = [
    path('v1/refresh/'  , RefreshApiView.as_view(), name='refreshView'),
    path('v1/signup/', SignUpView.as_view(), name='signupView'),
    path('v1/login/' , LoginView.as_view(), name='loginView'),
    path('v1/logout/', LogoutView.as_view(), name='logoutView'),
    path('v1/forgot/', ForgotPasswordView.as_view(), name='forgot'),
    path('v1/reset/', ResetPasswordView.as_view(), name='reset'),
    path('v1/profiles/', ProfileUpdateView.as_view(), name='profileUpdateView'), 
    path('v1/profiles/climate/', ProfileClimateView.as_view(), name='userClimateView'),
    path('v1/profiles/plants/interests/', OnboardingPlantListView.as_view(), name='userPlantListView'),
    path('v1/profiles/plants/choice/', ProfileUpdatePlantInterestsView.as_view(), name='userPlantChoicesView'), 
    path('v1/profiles/<str:toggleType>/<str:toggleVal>/preference/', ProfileToggleView.as_view(), name='ProfileToggleView')
]