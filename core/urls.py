from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.urls import path, include, re_path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('home.urls')),
    path('api/', include('tasks.urls')),
    path('api/', include('forum.urls')),
    path('api/', include('plants.urls')),
    path('api/', include('profiles.urls')),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += [ re_path(r'.*', TemplateView.as_view(template_name='index.html')) ]