
from decimal import Decimal

from rest_framework import serializers

from .models import Payroll


class PayrollSerializer(serializers.ModelSerializer):

    employee_name = serializers.SerializerMethodField()

    employee_code = serializers.CharField(
        source="employee.employee_code",
        read_only=True
    )

    class Meta:
        model = Payroll

        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_code",
            "month",
            "year",
            "basic_salary",
            "allowance",
            "bonus",
            "deduction",
            "unpaid_leave_days",
            "unpaid_leave_deduction",
            "gross_salary",
            "net_salary",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "employee_name",
            "employee_code",
            "unpaid_leave_days",
            "unpaid_leave_deduction",
            "gross_salary",
            "net_salary",
            "created_at",
            "updated_at",
        ]

    def get_employee_name(self, obj):
        return (
            f"{obj.employee.first_name} "
            f"{obj.employee.last_name}"
        )

    def validate_month(self, value):
        if not 1 <= value <= 12:
            raise serializers.ValidationError(
                "Month must be between 1 and 12."
            )
        return value

    def validate_year(self, value):
        if not 2000 <= value <= 2100:
            raise serializers.ValidationError(
                "Enter a valid year."
            )
        return value

    def validate(self, attrs):

        def pick(field):
            value = attrs.get(
                field,
                getattr(self.instance, field, Decimal("0.00"))
                if self.instance else Decimal("0.00")
            )
            return value if value is not None else Decimal("0.00")

        employee = attrs.get(
            "employee",
            self.instance.employee if self.instance else None
        )

        month = attrs.get(
            "month",
            self.instance.month if self.instance else None
        )

        year = attrs.get(
            "year",
            self.instance.year if self.instance else None
        )

        basic = pick("basic_salary")
        allowance = pick("allowance")
        bonus = pick("bonus")
        deduction = pick("deduction")

        gross = basic + allowance + bonus

        if deduction > gross:
            raise serializers.ValidationError({
                "deduction": "Deduction cannot exceed gross salary."
            })

        if employee and month and year:

            candidate = Payroll(
                employee=employee,
                month=month,
                year=year,
                basic_salary=basic,
                allowance=allowance,
                bonus=bonus,
                deduction=deduction,
            )

            candidate.gross_salary = gross
            candidate.calculate_totals()

            if candidate.net_salary < 0:
                raise serializers.ValidationError({
                    "deduction": (
                        "Combined deductions, including unpaid leave, "
                        "cannot exceed gross salary."
                    )
                })

        return attrs
