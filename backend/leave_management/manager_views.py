
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from employees.models import Employee
from leave_management.models import LeaveRequest


class ManagerLeaveRequestsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        profile = getattr(request.user, "profile", None)

        role = profile.role if profile else None

        # Admin can see all pending leave requests.
        if (
            request.user.is_staff
            or request.user.is_superuser
            or role == "ADMIN"
        ):
            leaves = LeaveRequest.objects.filter(
                status="PENDING"
            )

        # Manager can see only direct reports' requests.
        elif role == "MANAGER":

            manager = Employee.objects.filter(
                user=request.user,
                status="ACTIVE"
            ).first()

            if not manager:
                return Response(
                    {"error": "Manager employee profile not found."},
                    status=status.HTTP_403_FORBIDDEN
                )

            leaves = LeaveRequest.objects.filter(
                employee__manager=manager,
                status="PENDING"
            )

        else:
            return Response(
                {"error": "Only Admin or Manager can view pending leave requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        leaves = leaves.select_related(
            "employee",
            "leave_type",
            "reviewed_by"
        ).order_by("-created_at")

        data = []

        for leave in leaves:

            data.append({
                "id": leave.id,
                "employee_id": leave.employee.id,
                "employee_code": leave.employee.employee_code,
                "employee_name": (
                    f"{leave.employee.first_name} "
                    f"{leave.employee.last_name}"
                ),
                "leave_type": leave.leave_type.get_code_display(),
                "is_paid": leave.leave_type.is_paid,
                "start_date": leave.start_date,
                "end_date": leave.end_date,
                "total_days": leave.total_days,
                "reason": leave.reason,
                "attachment": (
                    request.build_absolute_uri(leave.attachment.url)
                    if leave.attachment else None
                ),
                "status": leave.status,
                "created_at": leave.created_at
            })

        return Response(
            {
                "count": len(data),
                "results": data
            },
            status=status.HTTP_200_OK
        )
