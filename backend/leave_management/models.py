
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q, F

from employees.models import Employee


class LeaveType(models.Model):

    LEAVE_TYPE_CHOICES = (
        ("CASUAL", "Casual Leave"),
        ("SICK", "Sick Leave"),
        ("EARNED", "Earned Leave"),
        ("UNPAID", "Unpaid Leave"),
    )

    code = models.CharField(
        max_length=20,
        choices=LEAVE_TYPE_CHOICES,
        unique=True
    )

    is_paid = models.BooleanField(default=True)

    annual_entitlement = models.PositiveIntegerField(default=0)

    requires_document = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return self.get_code_display()


class LeaveBalance(models.Model):

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="leave_balances"
    )

    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.PROTECT,
        related_name="balances"
    )

    year = models.PositiveIntegerField()

    allocated_days = models.PositiveIntegerField(default=0)

    used_days = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-year", "employee"]

        constraints = [
            models.UniqueConstraint(
                fields=["employee", "leave_type", "year"],
                name="unique_employee_leave_balance"
            ),
        ]

    @property
    def available_days(self):
        return max(
            0,
            self.allocated_days - self.used_days
        )

    def clean(self):

        super().clean()

        if self.used_days > self.allocated_days:
            raise ValidationError({
                "used_days": (
                    "Used leave days cannot exceed allocated days."
                )
            })

    def __str__(self):
        return (
            f"{self.employee.employee_code} - "
            f"{self.leave_type.code} - {self.year}"
        )


class LeaveRequest(models.Model):

    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("CANCELLED", "Cancelled"),
    )

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="leave_requests"
    )

    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.PROTECT,
        related_name="leave_requests"
    )

    start_date = models.DateField()

    end_date = models.DateField()

    reason = models.TextField()

    attachment = models.FileField(
        upload_to="leave_documents/",
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_leave_requests"
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    admin_comments = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.CheckConstraint(
                condition=Q(start_date__lte=F("end_date")),
                name="valid_leave_date_range"
            ),
        ]

    @property
    def total_days(self):
        return (
            self.end_date - self.start_date
        ).days + 1

    def clean(self):

        super().clean()

        if not self.start_date or not self.end_date:
            return

        # Validate leave dates
        if self.end_date < self.start_date:
            raise ValidationError({
                "end_date": "End date cannot be before start date."
            })

        # Prevent cross-year leave applications
        if self.start_date.year != self.end_date.year:
            raise ValidationError({
                "end_date": (
                    "Separate leave applications are required "
                    "for different calendar years."
                )
            })

        # Prevent overlapping leave requests
        if self.employee_id:

            overlapping_leaves = LeaveRequest.objects.filter(
                employee_id=self.employee_id,
                start_date__lte=self.end_date,
                end_date__gte=self.start_date,
            ).exclude(
                status__in=["REJECTED", "CANCELLED"]
            )

            if self.pk:
                overlapping_leaves = overlapping_leaves.exclude(
                    pk=self.pk
                )

            if overlapping_leaves.exists():
                raise ValidationError(
                    "You already have a leave request "
                    "for these dates."
                )

        # Validate leave type
        if self.leave_type_id:

            if not self.leave_type.is_active and not self.pk:
                raise ValidationError({
                    "leave_type": "This leave type is inactive."
                })

            # Validate supporting document
            if (
                self.leave_type.requires_document
                and not self.attachment
            ):
                raise ValidationError({
                    "attachment": (
                        "A supporting document is required."
                    )
                })

    def __str__(self):

        return (
            f"{self.employee.employee_code} - "
            f"{self.leave_type.code} - "
            f"{self.status}"
        )
