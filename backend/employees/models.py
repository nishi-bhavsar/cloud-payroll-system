
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from departments.models import Department


class Employee(models.Model):

    EMPLOYEE_STATUS = (
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="employee_profile",
        null=True,
        blank=True
    )

    manager = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="direct_reports"
    )

    employee_code = models.CharField(
        max_length=20,
        unique=True
    )

    first_name = models.CharField(
        max_length=100
    )

    last_name = models.CharField(
        max_length=100
    )

    email = models.EmailField(
        unique=True
    )

    phone = models.CharField(
        max_length=15
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees"
    )

    designation = models.CharField(
        max_length=100
    )

    joining_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=EMPLOYEE_STATUS,
        default="ACTIVE"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def clean(self):
        super().clean()

        if self.manager_id and self.pk == self.manager_id:
            raise ValidationError({
                "manager": "An employee cannot be their own manager."
            })

    def __str__(self):
        return (
            f"{self.employee_code} - "
            f"{self.first_name} "
            f"{self.last_name}"
        )
