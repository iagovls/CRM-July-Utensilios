from django.urls import path

from apps.dashboard.views import DashboardOverdueView, DashboardSummaryView

urlpatterns = [
    path("summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("overdue/", DashboardOverdueView.as_view(), name="dashboard-overdue"),
]
