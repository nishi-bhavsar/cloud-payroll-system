from django.db import models
from payroll.models import Payroll


class Payslip(models.Model):

    payroll = models.OneToOneField(
        Payroll,
        on_delete=models.CASCADE,
        related_name="payslip"
    )

    file_url = models.URLField(
        blank=True,
        null=True
    )

    generated_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Payslip - {self.payroll}"