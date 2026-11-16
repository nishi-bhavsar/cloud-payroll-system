
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from employees.models import Employee
from leave_management.models import LeaveType, LeaveBalance


class Command(BaseCommand):

    help = "Initialize annual paid leave balances for active employees."

    def add_arguments(self, parser):
        parser.add_argument(
            "--year",
            type=int,
            default=timezone.localdate().year,
            help="Calendar year for leave balance initialization."
        )

    def handle(self, *args, **options):

        year = options["year"]

        if not 2000 <= year <= 2100:
            raise CommandError("Enter a valid year between 2000 and 2100.")

        employees = Employee.objects.filter(
            status="ACTIVE"
        )

        leave_types = LeaveType.objects.filter(
            is_active=True,
            is_paid=True
        )

        created_count = 0
        existing_count = 0

        with transaction.atomic():

            for employee in employees:

                for leave_type in leave_types:

                    balance, created = LeaveBalance.objects.get_or_create(
                        employee=employee,
                        leave_type=leave_type,
                        year=year,
                        defaults={
                            "allocated_days": leave_type.annual_entitlement,
                            "used_days": 0,
                        }
                    )

                    if created:
                        created_count += 1
                    else:
                        existing_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Leave balance initialization completed for {year}."
            )
        )

        self.stdout.write(f"New balances created: {created_count}")
        self.stdout.write(f"Existing balances preserved: {existing_count}")
