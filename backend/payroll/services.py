
from datetime import date

from .models import Payroll


class PayrollAlreadyProcessedError(Exception):
    """Raised when an affected payroll period is already processed."""


def recalculate_payrolls_for_leave(employee, start_date, end_date):
    """
    Recalculate existing pending payroll records affected
    by an approved or cancelled leave request.

    Must be called inside transaction.atomic().
    """

    affected_payrolls = []

    year = start_date.year
    month = start_date.month

    while (year, month) <= (end_date.year, end_date.month):

        payroll = Payroll.objects.select_for_update().filter(
            employee=employee,
            year=year,
            month=month
        ).first()

        if payroll:
            affected_payrolls.append(payroll)

        if month == 12:
            year += 1
            month = 1
        else:
            month += 1

    # Never silently modify an already processed payroll.
    processed = [
        payroll
        for payroll in affected_payrolls
        if payroll.status == "PROCESSED"
    ]

    if processed:
        periods = ", ".join(
            f"{p.month}/{p.year}" for p in processed
        )

        raise PayrollAlreadyProcessedError(
            f"Payroll already processed for: {periods}. "
            "A separate payroll adjustment is required."
        )

    # Payroll.save() recalculates unpaid leave automatically.
    for payroll in affected_payrolls:
        payroll.save()

    return len(affected_payrolls)
