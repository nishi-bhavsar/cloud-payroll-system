
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, serializers

from employees.models import Employee
from employees.permissions import is_manager_for_employee

from .models import LeaveType, LeaveBalance, LeaveRequest

from .attendance_sync import (
    create_leave_attendance,
    remove_leave_attendance,
    AttendanceConflictError,
)

from payroll.services import (
    PayrollAlreadyProcessedError,
    recalculate_payrolls_for_leave,
)


# --------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------

def get_employee(user):
    return Employee.objects.filter(
        user=user,
        status="ACTIVE"
    ).first()


def is_admin(user):

    if user.is_staff or user.is_superuser:
        return True

    profile = getattr(user, "profile", None)

    return (
        profile is not None
        and profile.role == "ADMIN"
    )


def can_manage_leave(user, employee):

    return (
        is_admin(user)
        or is_manager_for_employee(user, employee)
    )


# --------------------------------------------------
# APPLY FOR LEAVE - EMPLOYEE
# --------------------------------------------------

class ApplyLeaveView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        employee = get_employee(request.user)

        if not employee:
            return Response(
                {"error": "Active employee profile not found."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            leave_type_id = serializers.IntegerField(
                min_value=1
            ).run_validation(
                request.data.get("leave_type")
            )

            start_date = serializers.DateField().run_validation(
                request.data.get("start_date")
            )

            end_date = serializers.DateField().run_validation(
                request.data.get("end_date")
            )

        except serializers.ValidationError:
            return Response(
                {
                    "error": (
                        "Provide valid leave type, "
                        "start date and end date."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get("reason", "")

        if not isinstance(reason, str) or not reason.strip():
            return Response(
                {"error": "Leave reason is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if end_date < start_date:
            return Response(
                {"error": "End date cannot be before start date."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if start_date < timezone.localdate():
            return Response(
                {"error": "Leave cannot be applied for past dates."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if start_date.year != end_date.year:
            return Response(
                {
                    "error": (
                        "Submit separate leave requests "
                        "for different calendar years."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        leave_type = LeaveType.objects.filter(
            id=leave_type_id,
            is_active=True
        ).first()

        if not leave_type:
            return Response(
                {"error": "Invalid or inactive leave type."},
                status=status.HTTP_400_BAD_REQUEST
            )

        attachment = request.FILES.get("attachment")

        if leave_type.requires_document and not attachment:
            return Response(
                {"error": "A supporting document is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if attachment and attachment.size > 5 * 1024 * 1024:
            return Response(
                {"error": "Attachment must not exceed 5 MB."},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_days = (end_date - start_date).days + 1

        try:
            with transaction.atomic():

                # Lock employee to serialize new applications.
                Employee.objects.select_for_update().get(
                    pk=employee.pk
                )

                # Prevent overlapping applications.
                overlapping = LeaveRequest.objects.filter(
                    employee=employee,
                    start_date__lte=end_date,
                    end_date__gte=start_date
                ).exclude(
                    status__in=["REJECTED", "CANCELLED"]
                ).exists()

                if overlapping:
                    return Response(
                        {
                            "error": (
                                "You already have a leave request "
                                "for these dates."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Check paid leave balance.
                if leave_type.is_paid:

                    balance = LeaveBalance.objects.select_for_update().filter(
                        employee=employee,
                        leave_type=leave_type,
                        year=start_date.year
                    ).first()

                    if not balance:
                        return Response(
                            {
                                "error": (
                                    "Leave balance is not configured "
                                    "for this year."
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Include all pending requests.
                    pending_days = sum(
                        item.total_days
                        for item in LeaveRequest.objects.filter(
                            employee=employee,
                            leave_type=leave_type,
                            status="PENDING",
                            start_date__year=start_date.year
                        )
                    )

                    if (
                        total_days + pending_days
                        > balance.available_days
                    ):
                        return Response(
                            {"error": "Insufficient leave balance."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                leave_request = LeaveRequest(
                    employee=employee,
                    leave_type=leave_type,
                    start_date=start_date,
                    end_date=end_date,
                    reason=reason.strip(),
                    attachment=attachment
                )

                leave_request.full_clean()
                leave_request.save()

        except ValidationError as error:

            return Response(
                {
                    "error": (
                        error.message_dict
                        if hasattr(error, "message_dict")
                        else error.messages
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "message": "Leave application submitted successfully.",
                "leave_id": leave_request.id,
                "status": leave_request.status,
                "total_days": leave_request.total_days
            },
            status=status.HTTP_201_CREATED
        )


# --------------------------------------------------
# EMPLOYEE LEAVE HISTORY
# --------------------------------------------------

class LeaveHistoryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        employee = get_employee(request.user)

        if not employee:
            return Response(
                {"error": "Employee profile not found."},
                status=status.HTTP_403_FORBIDDEN
            )

        leaves = LeaveRequest.objects.filter(
            employee=employee
        ).select_related(
            "leave_type",
            "reviewed_by"
        )

        data = []

        for leave in leaves:

            data.append({
                "id": leave.id,

                "leave_type": (
                    leave.leave_type.get_code_display()
                ),

                "start_date": leave.start_date,
                "end_date": leave.end_date,

                "total_days": leave.total_days,

                "reason": leave.reason,

                "attachment": (
                    request.build_absolute_uri(
                        leave.attachment.url
                    )
                    if leave.attachment else None
                ),

                "status": leave.status,

                "reviewed_by": (
                    leave.reviewed_by.username
                    if leave.reviewed_by else None
                ),

                "admin_comments": leave.admin_comments,

                "created_at": leave.created_at
            })

        return Response(
            data,
            status=status.HTTP_200_OK
        )


# --------------------------------------------------
# EMPLOYEE LEAVE BALANCE
# --------------------------------------------------

class LeaveBalanceView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        employee = get_employee(request.user)

        if not employee:
            return Response(
                {"error": "Employee profile not found."},
                status=status.HTTP_403_FORBIDDEN
            )

        year = timezone.localdate().year

        balances = LeaveBalance.objects.filter(
            employee=employee,
            year=year
        ).select_related(
            "leave_type"
        )

        data = []

        for balance in balances:

            data.append({
                "leave_type": (
                    balance.leave_type.get_code_display()
                ),

                "is_paid": balance.leave_type.is_paid,

                "allocated_days": balance.allocated_days,

                "used_days": balance.used_days,

                "available_days": balance.available_days
            })

        return Response(
            {
                "year": year,
                "balances": data
            },
            status=status.HTTP_200_OK
        )


# --------------------------------------------------
# ADMIN / MANAGER APPROVE OR REJECT LEAVE
# --------------------------------------------------


class ManageLeaveView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        action = request.data.get("action")
        comments = request.data.get("comments", "")

        if action not in ["APPROVED", "REJECTED"]:
            return Response(
                {"error": "Action must be APPROVED or REJECTED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():

                leave = LeaveRequest.objects.select_for_update().select_related(
                    "employee__manager__user",
                    "leave_type"
                ).filter(pk=pk).first()

                if not leave:
                    return Response(
                        {"error": "Leave request not found."},
                        status=status.HTTP_404_NOT_FOUND
                    )

                authorized = (
                    is_admin(request.user)
                    or is_manager_for_employee(request.user, leave.employee)
                )

                if not authorized:
                    return Response(
                        {
                            "error": (
                                "Only Admin or the employee's assigned "
                                "Manager can review this leave request."
                            )
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )

                if leave.status != "PENDING":
                    return Response(
                        {
                            "error": (
                                "Only pending leave requests "
                                "can be reviewed."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Check attendance conflicts before approving.
                if action == "APPROVED":
                    create_leave_attendance(leave)

                # Deduct paid leave balance upon approval.
                if action == "APPROVED" and leave.leave_type.is_paid:

                    balance = LeaveBalance.objects.select_for_update().filter(
                        employee=leave.employee,
                        leave_type=leave.leave_type,
                        year=leave.start_date.year
                    ).first()

                    if not balance:
                        return Response(
                            {"error": "Leave balance not configured."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    if leave.total_days > balance.available_days:
                        return Response(
                            {"error": "Insufficient leave balance."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    balance.used_days += leave.total_days

                    balance.save(
                        update_fields=["used_days", "updated_at"]
                    )

                leave.status = action
                leave.reviewed_by = request.user
                leave.reviewed_at = timezone.now()
                leave.admin_comments = comments

                leave.save()

                # Recalculate existing payroll for approved unpaid leave.
                if action == "APPROVED" and not leave.leave_type.is_paid:

                    recalculate_payrolls_for_leave(
                        employee=leave.employee,
                        start_date=leave.start_date,
                        end_date=leave.end_date
                    )

        except AttendanceConflictError as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )

        except PayrollAlreadyProcessedError as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            "message": f"Leave {action.lower()} successfully.",
            "leave_id": leave.id,
            "status": leave.status,
            "reviewed_by": request.user.username
        }, status=status.HTTP_200_OK)

# --------------------------------------------------
# EMPLOYEE CANCEL LEAVE
# --------------------------------------------------


class CancelLeaveView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        employee = get_employee(request.user)

        if not employee:
            return Response(
                {"error": "Employee profile not found."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            with transaction.atomic():

                leave = LeaveRequest.objects.select_for_update().select_related(
                    "leave_type"
                ).filter(
                    pk=pk,
                    employee=employee
                ).first()

                if not leave:
                    return Response(
                        {"error": "Leave request not found."},
                        status=status.HTTP_404_NOT_FOUND
                    )

                if leave.status not in ["PENDING", "APPROVED"]:
                    return Response(
                        {
                            "error": (
                                "Only pending or approved leave "
                                "requests can be cancelled."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                today = timezone.localdate()

                if (
                    leave.status == "APPROVED"
                    and leave.start_date <= today
                ):
                    return Response(
                        {
                            "error": (
                                "Approved leave can only be cancelled "
                                "before its start date."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                was_approved = leave.status == "APPROVED"

                # Restore paid leave balance.
                if was_approved and leave.leave_type.is_paid:

                    balance = LeaveBalance.objects.select_for_update().filter(
                        employee=employee,
                        leave_type=leave.leave_type,
                        year=leave.start_date.year
                    ).first()

                    if not balance:
                        return Response(
                            {"error": "Leave balance record not found."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    if balance.used_days < leave.total_days:
                        return Response(
                            {
                                "error": (
                                    "Insufficient used balance to restore "
                                    "this leave request."
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    balance.used_days -= leave.total_days

                    balance.save(
                        update_fields=["used_days", "updated_at"]
                    )

                # Remove only automatically generated leave attendance.
                if was_approved:
                    remove_leave_attendance(leave)

                leave.status = "CANCELLED"

                leave.save(
                    update_fields=["status", "updated_at"]
                )

                # Recalculate payroll after approved unpaid leave cancellation.
                if was_approved and not leave.leave_type.is_paid:

                    recalculate_payrolls_for_leave(
                        employee=employee,
                        start_date=leave.start_date,
                        end_date=leave.end_date
                    )

        except PayrollAlreadyProcessedError as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            "message": "Leave request cancelled successfully.",
            "leave_id": leave.id,
            "status": leave.status,
            "balance_restored": (
                was_approved and leave.leave_type.is_paid
            ),
            "payroll_recalculated": (
                was_approved and not leave.leave_type.is_paid
            )
        }, status=status.HTTP_200_OK)
