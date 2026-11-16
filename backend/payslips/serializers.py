from rest_framework import serializers

from .models import Payslip


class PayslipSerializer(serializers.ModelSerializer):

    employee_name = serializers.SerializerMethodField()

    employee_code = serializers.CharField(
        source="payroll.employee.employee_code",
        read_only=True
    )

    month = serializers.IntegerField(
        source="payroll.month",
        read_only=True
    )

    year = serializers.IntegerField(
        source="payroll.year",
        read_only=True
    )

    gross_salary = serializers.DecimalField(
        source="payroll.gross_salary",
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    net_salary = serializers.DecimalField(
        source="payroll.net_salary",
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = Payslip

        fields = [
            "id",
            "payroll",
            "employee_name",
            "employee_code",
            "month",
            "year",
            "gross_salary",
            "net_salary",
            "file_url",
            "generated_at",
        ]

        read_only_fields = fields

    def get_employee_name(self, obj):
        employee = obj.payroll.employee

        return (
            f"{employee.first_name} "
            f"{employee.last_name}"
        )