from decimal import Decimal

from django.db import migrations, models


def migrate_paid_installments(apps, schema_editor):
    Installment = apps.get_model("sales", "Installment")
    Installment.objects.filter(status="paid", paid_amount=Decimal("0.00")).update(
        paid_amount=models.F("amount"),
        amount=Decimal("0.00"),
    )


def revert_paid_installments(apps, schema_editor):
    Installment = apps.get_model("sales", "Installment")
    Installment.objects.filter(status="paid", amount=Decimal("0.00")).update(
        amount=models.F("paid_amount"),
        paid_amount=Decimal("0.00"),
    )


class Migration(migrations.Migration):
    dependencies = [
        ("sales", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="installment",
            name="paid_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.RunPython(migrate_paid_installments, revert_paid_installments),
    ]
