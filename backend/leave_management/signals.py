
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from employees.models import Employee
from .models import LeaveType, LeaveBalance


@receiver(post_save, sender=Employee)
def create_employee_leave_balances(sender, instance, created, **kwargs):

    if not created or instance.status != "ACTIVE":
        return

    current_year = timezone.localdate().year

    paid_leave_types = LeaveType.objects.filter(
        is_active=True,
        is_paid=True
    )

    for leave_type in paid_leave_types:

        LeaveBalance.objects.get_or_create(
            employee=instance,
            leave_type=leave_type,
            year=current_year,
            defaults={
                "allocated_days": leave_type.annual_entitlement,
                "used_days": 0,
            }
        )
