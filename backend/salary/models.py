from django.db import models
from employees.models import Employee


class Salary(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="salaries"
    )
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
    effective_from = models.DateField()

    def __str__(self):
        return f"{self.employee} - {self.basic_salary}"