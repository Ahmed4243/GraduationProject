from django.urls import path
from . import views

urlpatterns = [
    # This defines the path *within* the chart_generator app
    path('generate-chart/', views.generate_chart_view, name='generate-chart'),
] 