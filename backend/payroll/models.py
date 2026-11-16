
from calendar import monthrange
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from django.db import models

from employees.models import Employee


class Payroll(models.Model):

    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("PROCESSED", "Processed"),
    )

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="payroll_records"
    )

    month = models.PositiveIntegerField()

    year = models.PositiveIntegerField()

    basic_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    allowance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    bonus = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    deduction = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    unpaid_leave_days = models.PositiveIntegerField(default=0)

    unpaid_leave_deduction = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    gross_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    net_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-year", "-month", "employee_id"]

        constraints = [
            models.UniqueConstraint(
                fields=["employee", "month", "year"],
                name="unique_payroll_per_employee_month"
            )
        ]

    def calculate_unpaid_leave(self):

        if not self.employee_id or not self.month or not self.year:
            return 0, Decimal("0.00")

        from leave_management.models import LeaveRequest

        days_in_month = monthrange(self.year, self.month)[1]

        period_start = date(self.year, self.month, 1)

        period_end = date(
            self.year,
            self.month,
            days_in_month
        )

        approved_leaves = LeaveRequest.objects.filter(
            employee_id=self.employee_id,
            status="APPROVED",
            leave_type__is_paid=False,
            start_date__lte=period_end,
            end_date__gte=period_start
        )

        unpaid_days = 0

        for leave in approved_leaves:

            overlap_start = max(
                leave.start_date,
                period_start
            )

            overlap_end = min(
                leave.end_date,
                period_end
            )

            unpaid_days += (
                overlap_end - overlap_start
            ).days + 1

        if unpaid_days == 0:
            return 0, Decimal("0.00")

        daily_salary = (
            self.gross_salary / Decimal(days_in_month)
        )

        unpaid_deduction = (
            daily_salary * Decimal(unpaid_days)
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )

        return unpaid_days, unpaid_deduction

    def calculate_totals(self):

        self.gross_salary = (
            (self.basic_salary or Decimal("0.00"))
            + (self.allowance or Decimal("0.00"))
            + (self.bonus or Decimal("0.00"))
        )

        (
            self.unpaid_leave_days,
            self.unpaid_leave_deduction
        ) = self.calculate_unpaid_leave()

        self.net_salary = (
            self.gross_salary
            - (self.deduction or Decimal("0.00"))
            - self.unpaid_leave_deduction
        )

    def save(self, *args, **kwargs):

        self.calculate_totals()

        update_fields = kwargs.get("update_fields")

        if update_fields is not None:

            kwargs["update_fields"] = set(update_fields) | {
                "gross_salary",
                "net_salary",
                "unpaid_leave_days",
                "unpaid_leave_deduction",
            }

        super().save(*args, **kwargs)

    def __str__(self):

        return (
            f"{self.employee} - "
            f"{self.month}/{self.year}"
        )
