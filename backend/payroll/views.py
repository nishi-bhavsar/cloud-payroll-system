
import calendar
from datetime import date

from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from employees.permissions import OwnDataMixin, is_admin
from employees.models import Employee
from salary.models import Salary

from .models import Payroll
from .serializers import PayrollSerializer


class PayrollViewSet(OwnDataMixin, viewsets.ModelViewSet):

    queryset = Payroll.objects.all().select_related(
        "employee",
        "employee__user"
    )

    serializer_class = PayrollSerializer

    owner_field = "employee__user"

    def get_queryset(self):
        user = self.request.user

        queryset = Payroll.objects.select_related(
            "employee",
            "employee__user",
            "employee__department"
        ).order_by("-year", "-month")

        # Admin can see all payroll records
        if is_admin(user):
            return queryset

        # Employee can see only their own payroll
        employee_filter = Q(employee__user=user)

        # Fallback: match employee email if user relation is missing
        if user.email:
            employee_filter |= Q(
                employee__email__iexact=user.email
            )

        return queryset.filter(
            employee_filter
        ).distinct()

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):

        try:
            month = int(request.data.get("month"))
            year = int(request.data.get("year"))

        except (TypeError, ValueError):
            raise ValidationError({
                "detail": "Valid month and year are required."
            })

        if not 1 <= month <= 12:
            raise ValidationError({
                "month": "Month must be between 1 and 12."
            })

        if not 2000 <= year <= 2100:
            raise ValidationError({
                "year": "Enter a valid year."
            })

        last_day = calendar.monthrange(year, month)[1]
        period_end = date(year, month, last_day)

        created = 0
        skipped_existing = []
        skipped_no_salary = []

        active_employees = Employee.objects.filter(
            status="ACTIVE"
        )

        for employee in active_employees:

            existing = Payroll.objects.filter(
                employee=employee,
                month=month,
                year=year
            ).exists()

            if existing:
                skipped_existing.append(
                    employee.employee_code
                )
                continue

            salary = Salary.objects.filter(
                employee=employee,
                effective_from__lte=period_end
            ).order_by(
                "-effective_from",
                "-id"
            ).first()

            if salary is None:
                skipped_no_salary.append(
                    employee.employee_code
                )
                continue

            payroll, was_created = Payroll.objects.get_or_create(
                employee=employee,
                month=month,
                year=year,
                defaults={
                    "basic_salary": salary.basic_salary,
                    "allowance": salary.allowance,
                    "bonus": salary.bonus,
                    "deduction": salary.deduction,
                    "gross_salary": 0,
                    "net_salary": 0,
                    "status": "PENDING",
                }
            )

            if was_created:
                created += 1
            else:
                skipped_existing.append(
                    employee.employee_code
                )

        return Response(
            {
                "message": "Payroll generation completed.",
                "month": month,
                "year": year,
                "created": created,
                "skipped_existing": skipped_existing,
                "skipped_no_salary": skipped_no_salary,
            },
            status=status.HTTP_200_OK
        )
