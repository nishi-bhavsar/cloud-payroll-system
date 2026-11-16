
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from leave_management.views import is_admin
from leave_management.models import LeaveRequest


class AdminLeaveRequestsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if not is_admin(request.user):
            return Response(
                {"error": "Only Admin can view all leave requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        leaves = LeaveRequest.objects.select_related(
            "employee",
            "employee__manager",
            "leave_type",
            "reviewed_by"
        ).order_by("-created_at")

        # Optional status filter.
        requested_status = request.query_params.get("status")

        allowed_statuses = [
            "PENDING",
            "APPROVED",
            "REJECTED",
            "CANCELLED"
        ]

        if requested_status:

            requested_status = requested_status.upper()

            if requested_status not in allowed_statuses:
                return Response(
                    {
                        "error": (
                            "Invalid status. Use PENDING, APPROVED, "
                            "REJECTED or CANCELLED."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            leaves = leaves.filter(status=requested_status)

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
                "manager": (
                    leave.employee.manager.employee_code
                    if leave.employee.manager else None
                ),
                "leave_type_id": leave.leave_type.id,
                "leave_type": leave.leave_type.get_code_display(),
                "is_paid": leave.leave_type.is_paid,
                "start_date": leave.start_date.isoformat(),
                "end_date": leave.end_date.isoformat(),
                "total_days": leave.total_days,
                "reason": leave.reason,
                "attachment": (
                    request.build_absolute_uri(leave.attachment.url)
                    if leave.attachment else None
                ),
                "status": leave.status,
                "reviewed_by": (
                    leave.reviewed_by.username
                    if leave.reviewed_by else None
                ),
                "reviewed_at": (
                    leave.reviewed_at.isoformat()
                    if leave.reviewed_at else None
                ),
                "admin_comments": leave.admin_comments,
                "created_at": leave.created_at.isoformat()
            })

        return Response(
            {
                "count": len(data),
                "results": data
            },
            status=status.HTTP_200_OK
        )
