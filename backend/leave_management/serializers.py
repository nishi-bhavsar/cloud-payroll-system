
from rest_framework import serializers

from .models import LeaveType, LeaveBalance, LeaveRequest


class LeaveTypeSerializer(serializers.ModelSerializer):

    class Meta:
        model = LeaveType

        fields = [
            "id",
            "code",
            "is_paid",
            "annual_entitlement",
            "requires_document",
            "is_active",
        ]

        read_only_fields = [
            "id",
        ]


class LeaveBalanceSerializer(serializers.ModelSerializer):

    leave_type_name = serializers.CharField(
        source="leave_type.get_code_display",
        read_only=True
    )

    available_days = serializers.IntegerField(
        read_only=True
    )

    is_paid = serializers.BooleanField(
        source="leave_type.is_paid",
        read_only=True
    )

    class Meta:
        model = LeaveBalance

        fields = [
            "id",
            "leave_type",
            "leave_type_name",
            "is_paid",
            "year",
            "allocated_days",
            "used_days",
            "available_days",
        ]

        read_only_fields = [
            "id",
            "used_days",
            "available_days",
        ]


class LeaveRequestSerializer(serializers.ModelSerializer):

    employee_name = serializers.SerializerMethodField()

    leave_type_name = serializers.CharField(
        source="leave_type.get_code_display",
        read_only=True
    )

    total_days = serializers.IntegerField(
        read_only=True
    )

    status = serializers.CharField(
        read_only=True
    )

    reviewed_by = serializers.StringRelatedField(
        read_only=True
    )

    class Meta:
        model = LeaveRequest

        fields = [
            "id",
            "employee",
            "employee_name",
            "leave_type",
            "leave_type_name",
            "start_date",
            "end_date",
            "total_days",
            "reason",
            "attachment",
            "status",
            "reviewed_by",
            "reviewed_at",
            "admin_comments",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "employee",
            "status",
            "reviewed_by",
            "reviewed_at",
            "admin_comments",
            "created_at",
        ]

    def get_employee_name(self, obj):

        employee = obj.employee

        first_name = getattr(employee, "first_name", "")
        last_name = getattr(employee, "last_name", "")

        if not first_name and not last_name:
            user = getattr(employee, "user", None)

            if user:
                return user.get_full_name() or user.username

        return f"{first_name} {last_name}".strip()

    def validate(self, attrs):

        instance = self.instance

        start_date = attrs.get(
            "start_date",
            getattr(instance, "start_date", None)
        )

        end_date = attrs.get(
            "end_date",
            getattr(instance, "end_date", None)
        )

        leave_type = attrs.get(
            "leave_type",
            getattr(instance, "leave_type", None)
        )

        attachment = attrs.get(
            "attachment",
            getattr(instance, "attachment", None)
        )

        # Validate leave dates
        if start_date and end_date:

            if end_date < start_date:
                raise serializers.ValidationError({
                    "end_date": "End date cannot be before start date."
                })

            if start_date.year != end_date.year:
                raise serializers.ValidationError({
                    "end_date": (
                        "Separate leave applications are required "
                        "for different calendar years."
                    )
                })

        # Validate leave type
        if leave_type:

            if not leave_type.is_active:
                raise serializers.ValidationError({
                    "leave_type": "This leave type is inactive."
                })

            # Supporting document validation
            if leave_type.requires_document and not attachment:
                raise serializers.ValidationError({
                    "attachment": "Supporting document is required."
                })

        return attrs
