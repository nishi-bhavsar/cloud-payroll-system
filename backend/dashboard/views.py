from datetime import date

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from departments.models import Department
from employees.models import Employee
from employees.permissions import IsAdminUserRole
from payroll.models import Payroll
from payslips.models import Payslip


class DashboardStatsView(APIView):
    """Admin-only summary numbers for the admin dashboard."""

    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        today = date.today()

        data = {
            "total_employees": Employee.objects.count(),
            "total_departments": Department.objects.count(),
            "payroll_this_month": Payroll.objects.filter(
                month=today.month,
                year=today.year,
            ).count(),
            "payslips_generated": Payslip.objects.count(),
        }

        return Response(data)