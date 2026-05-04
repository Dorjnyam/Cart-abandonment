"""
URL configuration for main_service project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from importlib.util import find_spec

from apps.diagnosis.observer_views import TrackEventView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.accounts.urls')),
    path('api/', include('apps.tenants.urls')),
    path('api/', include('apps.analytics.urls')),
    path('track', TrackEventView.as_view(), name='observer-track'),
    path('track/', TrackEventView.as_view(), name='observer-track-slash'),
]

if find_spec('django_prometheus'):
    urlpatterns.insert(0, path('', include('django_prometheus.urls')))
