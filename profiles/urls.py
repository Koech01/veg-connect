from django.urls import path
from .views import SignUpView, LoginView, ProfileToggleView, ProfileUpdateView
from .views import LogoutView, RefreshApiView, ForgotPasswordView, ResetPasswordView

urlpatterns = [
    path('refresh/'  , RefreshApiView.as_view(), name='refresh'),
    path('v1/signup/', SignUpView.as_view(), name='signup'),
    path('v1/login/' , LoginView.as_view(), name='login'),
    path('v1/logout/', LogoutView.as_view(), name='logout'),
    path('v1/forgot/', ForgotPasswordView.as_view(), name='forgot'),
    path('v1/reset/', ResetPasswordView.as_view(), name='reset'),
    path('v1/profiles/', ProfileUpdateView.as_view(), name='profileUpdate'),
    path('v1/profiles/<str:toggleType>/<str:toggleVal>/preference/', ProfileToggleView.as_view(), name='ProfileToggle')
]