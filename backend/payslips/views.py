from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Payslip
from .serializers import PayslipSerializer
from .pdf_generator import generate_payslip_pdf
from payroll.models import Payroll
from employees.permissions import IsAdminUserRole


def get_role(user):
    """Return 'ADMIN', 'EMPLOYEE' or None (safe if profile is missing)."""
    profile = getattr(user, "profile", None)
    return profile.role if profile else None


class PayslipViewSet(viewsets.ModelViewSet):

    serializer_class = PayslipSerializer

    # No editing of payslips: only list, view, generate (POST), delete
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_permissions(self):
        # Anyone logged in can list/view (the queryset limits what they see)
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        # Generate / delete = admin only
        return [IsAdminUserRole()]

    def get_queryset(self):
        queryset = Payslip.objects.all().select_related(
            "payroll",
            "payroll__employee"
        ).order_by("-generated_at")

        user = self.request.user

        if get_role(user) == "ADMIN":
            return queryset

        # Employee: only their own payslips
        return queryset.filter(payroll__employee__user=user)

    def create(self, request, *args, **kwargs):

        payroll_id = request.data.get("payroll")

        if not payroll_id:
            return Response(
                {"payroll": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payroll = Payroll.objects.get(id=payroll_id)
        except Payroll.DoesNotExist:
            return Response(
                {"detail": "Payroll not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if Payslip.objects.filter(payroll=payroll).exists():
            return Response(
                {"detail": "Payslip already exists for this payroll."},
                status=status.HTTP_400_BAD_REQUEST
            )

        pdf_buffer = generate_payslip_pdf(payroll)

        filename = (
            f"payslip_"
            f"{payroll.employee.employee_code}_"
            f"{payroll.month}_"
            f"{payroll.year}.pdf"
        )

        file_path = default_storage.save(
            f"payslips/{filename}",
            ContentFile(pdf_buffer.read())
        )

        file_url = default_storage.url(file_path)

        payslip = Payslip.objects.create(
            payroll=payroll,
            file_url=file_url
        )

        serializer = self.get_serializer(payslip)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )