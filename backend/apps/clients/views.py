from rest_framework import viewsets

from apps.accounts.permissions import CanDeleteAsAdminOnly
from apps.clients.models import Client
from apps.clients.serializers import ClientSerializer
from apps.core.utils import create_audit_log


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.filter(is_active=True)
    serializer_class = ClientSerializer
    permission_classes = [CanDeleteAsAdminOnly]

    def perform_create(self, serializer):
        client = serializer.save()
        create_audit_log(self.request.user, "create", "client", client.id, f"Cliente {client} criado")

    def perform_update(self, serializer):
        client = serializer.save()
        create_audit_log(self.request.user, "update", "client", client.id, f"Cliente {client} atualizado")

    def perform_destroy(self, instance):
        instance.soft_delete()
        create_audit_log(self.request.user, "soft_delete", "client", instance.id, f"Cliente {instance} inativado")
