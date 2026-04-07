from django.db import models

from apps.core.models import SoftDeleteModel


class Client(SoftDeleteModel):
    name = models.CharField(max_length=255, null=True, blank=True)
    document = models.CharField(max_length=18, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ["name", "id"]

    def __str__(self):
        return self.name or f"Cliente {self.pk}"
