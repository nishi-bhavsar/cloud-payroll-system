from rest_framework import viewsets

from employees.permissions import OwnDataMixin

from .models import Salary
from .serializers import SalarySerializer


class SalaryViewSet(OwnDataMixin, viewsets.ModelViewSet):

    queryset = Salary.objects.all().select_related("employee")

    serializer_class = SalarySerializer

    owner_field = "employee__user"