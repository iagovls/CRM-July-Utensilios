from rest_framework.routers import DefaultRouter

from apps.inventory.views import CategoryViewSet, ProductViewSet

router = DefaultRouter()
router.register("products", ProductViewSet, basename="products")
router.register("categories", CategoryViewSet, basename="categories")

urlpatterns = router.urls
