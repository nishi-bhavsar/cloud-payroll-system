
from django.db import models
from employees.models import Employee


class Attendance(models.Model):

    STATUS_CHOICES = (
        ("PRESENT", "Present"),
        ("ABSENT", "Absent"),
        ("LEAVE", "Leave"),
    )

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="attendance_records"
    )

    date = models.DateField()

    check_in = models.DateTimeField(
        null=True,
        blank=True
    )

    check_out = models.DateTimeField(
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES
    )

    leave_request = models.ForeignKey(
        "leave_management.LeaveRequest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendance_records"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "date"],
                name="unique_attendance_per_employee_date",
            )
        ]

    def __str__(self):
        return f"{self.employee} - {self.date} - {self.status}"
