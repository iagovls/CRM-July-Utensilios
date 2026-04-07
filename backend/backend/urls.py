from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/clients/", include("apps.clients.urls")),
    path("api/", include("apps.inventory.urls")),
    path("api/sales/", include("apps.sales.urls")),
    path("api/dashboard/", include("apps.dashboard.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
