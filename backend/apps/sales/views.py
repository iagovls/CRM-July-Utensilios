from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.accounts.permissions import CanDeleteAsAdminOnly
from apps.sales.models import Installment, Sale
from apps.sales.serializers import InstallmentPaymentSerializer, InstallmentSerializer, SaleSerializer
from apps.sales.services import cancel_sale, pay_installment


class SaleViewSet(viewsets.ModelViewSet):
    queryset = (
        Sale.objects.select_related("customer", "created_by")
        .prefetch_related("items__product", "installments")
        .all()
    )
    serializer_class = SaleSerializer
    permission_classes = [CanDeleteAsAdminOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["today"] = timezone.localdate()
        return context

    def destroy(self, request, *args, **kwargs):
        sale = self.get_object()
        cancel_sale(sale, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        if not request.user.is_admin_role:
            raise PermissionDenied("Apenas administradores podem cancelar vendas.")
        sale = self.get_object()
        cancel_sale(sale, request.user)
        return Response(self.get_serializer(sale).data)


class InstallmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Installment.objects.select_related("sale", "sale__customer").all()
    serializer_class = InstallmentSerializer
    permission_classes = [CanDeleteAsAdminOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["today"] = timezone.localdate()
        return context

    @action(detail=True, methods=["post"], url_path="pay")
    def pay(self, request, pk=None):
        installment = self.get_object()
        serializer = InstallmentPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pay_installment(installment, serializer.validated_data["payment_method"], request.user)
        return Response({"detail": "Parcela quitada com sucesso."})
