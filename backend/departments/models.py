from django.conf import settings
from django.db import models


class Department(models.Model):

    DEPARTMENT_STATUS = (
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
    )

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Name of the department (e.g., Human Resources, Engineering)"
    )

    code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique department code (e.g., HR, ENG, FIN)"
    )

    description = models.TextField(
        blank=True,
        null=True,
        help_text="Brief description of department responsibilities"
    )

    # String reference 'employees.Employee' prevents circular import conflicts
    manager = models.ForeignKey(
        "employees.Employee",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_departments",
        help_text="Head or manager of this department"
    )

    status = models.CharField(
        max_length=20,
        choices=DEPARTMENT_STATUS,
        default="ACTIVE"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "Department"
        verbose_name_plural = "Departments"

    def __str__(self):
        return f"{self.code} - {self.name}"