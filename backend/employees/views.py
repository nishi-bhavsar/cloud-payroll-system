
from rest_framework import viewsets

from employees.permissions import OwnDataMixin

from .models import Employee
from .serializers import EmployeeSerializer


class EmployeeViewSet(OwnDataMixin, viewsets.ModelViewSet):

    queryset = Employee.objects.all().select_related(
        "department",
        "manager",
        "user"
    ).order_by("-created_at")

    serializer_class = EmployeeSerializer

    owner_field = "user"
