
from django.contrib import admin
from .models import LeaveType, LeaveBalance, LeaveRequest


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "is_paid",
        "annual_entitlement",
        "requires_document",
        "is_active",
    )

    list_filter = ("is_paid", "is_active")

    search_fields = ("code",)


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "leave_type",
        "year",
        "allocated_days",
        "used_days",
        "available_days",
    )

    list_filter = ("year", "leave_type")

    search_fields = (
        "employee__employee_code",
        "employee__user__username",
    )


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "leave_type",
        "start_date",
        "end_date",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "leave_type",
        "start_date",
    )

    search_fields = (
        "employee__employee_code",
        "employee__user__username",
        "reason",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "reviewed_at",
    )
