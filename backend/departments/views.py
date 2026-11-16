from rest_framework import viewsets

from employees.permissions import AdminWriteMixin

from .models import Department
from .serializers import DepartmentSerializer


class DepartmentViewSet(AdminWriteMixin, viewsets.ModelViewSet):

    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer