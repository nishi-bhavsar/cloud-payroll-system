from rest_framework import serializers
from .models import Salary


class SalarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Salary
        fields = [
            "id",
            "employee",
            "basic_salary",
            "allowance",
            "bonus",
            "deduction",
            "effective_from",
        ]