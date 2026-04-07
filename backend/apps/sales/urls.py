from rest_framework.routers import DefaultRouter

from apps.sales.views import InstallmentViewSet, SaleViewSet

router = DefaultRouter()
router.register("installments", InstallmentViewSet, basename="installments")
router.register("", SaleViewSet, basename="sales")

urlpatterns = router.urls
