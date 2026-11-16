
from django.db import transaction
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from employees.models import Employee
from employees.permissions import OwnDataMixin

from .models import Attendance
from .serializers import AttendanceSerializer


class AttendanceViewSet(OwnDataMixin, viewsets.ModelViewSet):

    queryset = Attendance.objects.all().select_related("employee")

    serializer_class = AttendanceSerializer

    owner_field = "employee__user"

    def get_permissions(self):

        # Employees must be authenticated to punch in/out.
        if self.action in ("punch_in", "punch_out"):
            return [IsAuthenticated()]

        # Existing OwnDataMixin:
        # Admin can manage all records.
        # Employees can access their own records.
        return super().get_permissions()

    def get_employee(self, user):

        return Employee.objects.filter(
            user=user,
            status="ACTIVE"
        ).first()

    # ==========================================
    # EMPLOYEE PUNCH IN
    # ==========================================

    @action(
        detail=False,
        methods=["post"],
        url_path="punch-in"
    )
    def punch_in(self, request):

        employee = self.get_employee(request.user)

        if not employee:

            return Response(
                {
                    "error": "Active employee profile not found."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        today = timezone.localdate()

        current_time = timezone.now()

        with transaction.atomic():

            # Lock employee to prevent simultaneous duplicate punch-ins.
            employee = Employee.objects.select_for_update().get(
                pk=employee.pk
            )

            attendance = Attendance.objects.filter(
                employee=employee,
                date=today
            ).first()

            if attendance:

                if attendance.status == "LEAVE":

                    return Response(
                        {
                            "error": "You are marked on leave today."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if attendance.check_in:

                    return Response(
                        {
                            "error": "You have already punched in today."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                attendance.check_in = current_time

                attendance.status = "PRESENT"

                attendance.save(
                    update_fields=[
                        "check_in",
                        "status",
                        "updated_at"
                    ]
                )

            else:

                attendance = Attendance.objects.create(
                    employee=employee,
                    date=today,
                    check_in=current_time,
                    status="PRESENT"
                )

        return Response(
            {
                "message": "Punch in successful.",
                "date": str(today),
                "check_in": attendance.check_in,
                "status": attendance.status
            },
            status=status.HTTP_201_CREATED
        )

    # ==========================================
    # EMPLOYEE PUNCH OUT
    # ==========================================

    @action(
        detail=False,
        methods=["post"],
        url_path="punch-out"
    )
    def punch_out(self, request):

        employee = self.get_employee(request.user)

        if not employee:

            return Response(
                {
                    "error": "Active employee profile not found."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        today = timezone.localdate()

        with transaction.atomic():

            attendance = Attendance.objects.select_for_update().filter(
                employee=employee,
                date=today
            ).first()

            if not attendance:

                return Response(
                    {
                        "error": "You have not punched in today."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not attendance.check_in:

                return Response(
                    {
                        "error": "Please punch in before punching out."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if attendance.check_out:

                return Response(
                    {
                        "error": "You have already punched out today."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            check_out_time = timezone.now()

            if check_out_time < attendance.check_in:

                return Response(
                    {
                        "error": "Punch out time cannot be before punch in."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            attendance.check_out = check_out_time

            attendance.save(
                update_fields=[
                    "check_out",
                    "updated_at"
                ]
            )

            duration = (
                attendance.check_out - attendance.check_in
            )

            total_seconds = int(duration.total_seconds())

            hours = total_seconds // 3600

            minutes = (total_seconds % 3600) // 60

            seconds = total_seconds % 60

            working_time = (
                f"{hours:02d}:{minutes:02d}:{seconds:02d}"
            )

            working_hours = round(
                total_seconds / 3600,
                2
            )

        return Response(
            {
                "message": "Punch out successful.",
                "date": str(today),
                "check_in": attendance.check_in,
                "check_out": attendance.check_out,
                "working_time": working_time,
                "working_hours": working_hours,
                "status": attendance.status
            },
            status=status.HTTP_200_OK
        )
