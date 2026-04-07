from datetime import datetime
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminRole
from apps.sales.models import Installment, Sale


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        start_date_param = request.query_params.get("start_date")
        end_date_param = request.query_params.get("end_date")
        sales = Sale.objects.exclude(status=Sale.Status.CANCELED)
        if start_date_param:
            sales = sales.filter(created_at__date__gte=datetime.fromisoformat(start_date_param).date())
        if end_date_param:
            sales = sales.filter(created_at__date__lte=datetime.fromisoformat(end_date_param).date())
        total_revenue = sales.aggregate(total=Sum("total_amount"))["total"] or Decimal("0")
        total_cost = sales.aggregate(total=Sum("total_cost"))["total"] or Decimal("0")
        monthly = []
        monthly_groups = {}
        for sale in sales:
            key = sale.created_at.strftime("%Y-%m")
            monthly_groups.setdefault(key, {"month": key, "revenue": Decimal("0"), "profit": Decimal("0")})
            monthly_groups[key]["revenue"] += sale.total_amount
            monthly_groups[key]["profit"] += sale.total_amount - sale.total_cost
        monthly = list(monthly_groups.values())
        overdue_count = Installment.objects.filter(
            status=Installment.Status.PENDING,
            due_date__lt=timezone.localdate(),
            sale__status__in=[Sale.Status.PENDING, Sale.Status.PAID],
        ).count()
        return Response(
            {
                "total_revenue": total_revenue,
                "total_cost": total_cost,
                "real_profit": total_revenue - total_cost,
                "monthly": monthly,
                "overdue_count": overdue_count,
            }
        )


class DashboardOverdueView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        installments = Installment.objects.select_related("sale", "sale__customer").filter(
            status=Installment.Status.PENDING,
            due_date__lt=timezone.localdate(),
            sale__status__in=[Sale.Status.PENDING, Sale.Status.PAID],
        )
        data = [
            {
                "id": installment.id,
                "sale_id": installment.sale_id,
                "customer": installment.sale.customer.name if installment.sale.customer else "Sem cliente",
                "amount": installment.amount,
                "due_date": installment.due_date,
                "days_overdue": (timezone.localdate() - installment.due_date).days,
            }
            for installment in installments
        ]
        return Response(data)
