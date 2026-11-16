
from rest_framework import serializers

from .models import Attendance
from employees.models import Employee


class AttendanceSerializer(serializers.ModelSerializer):

    employee_name = serializers.SerializerMethodField()
    working_hours = serializers.SerializerMethodField()

    # Admin can select an employee while creating attendance.
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.filter(status="ACTIVE")
    )

    class Meta:
        model = Attendance

        fields = [
            "id",
            "employee",
            "employee_name",
            "date",
            "check_in",
            "check_out",
            "working_hours",
            "status",
            "created_at",
            "updated_at",
        ]

        # Only system-generated fields are read-only.
        # Employee, date and status remain writable for Admin.
        read_only_fields = [
            "id",
            "employee_name",
            "check_in",
            "check_out",
            "working_hours",
            "created_at",
            "updated_at",
        ]

    def get_employee_name(self, obj):

        return (
            f"{obj.employee.first_name} "
            f"{obj.employee.last_name}"
        )

    def get_working_hours(self, obj):

        if not obj.check_in or not obj.check_out:
            return None

        duration = obj.check_out - obj.check_in

        total_seconds = duration.total_seconds()

        if total_seconds < 0:
            return None

        return round(total_seconds / 3600, 2)
