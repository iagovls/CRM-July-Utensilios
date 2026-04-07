from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Roles(models.TextChoices):
        ADMIN = "admin", "Admin"
        USER = "user", "User"

    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.USER)

    @property
    def is_admin_role(self):
        return self.role == self.Roles.ADMIN or self.is_superuser
