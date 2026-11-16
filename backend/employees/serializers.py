
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction

from rest_framework import serializers

from .models import Employee


User = get_user_model()


class EmployeeSerializer(serializers.ModelSerializer):

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    username = serializers.CharField(
        write_only=True,
        required=False
    )

    password = serializers.CharField(
        write_only=True,
        required=False,
        trim_whitespace=False
    )

    manager = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.filter(status="ACTIVE"),
        required=False,
        allow_null=True
    )

    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee

        fields = [
            "id",
            "user",
            "username",
            "password",
            "employee_code",
            "first_name",
            "last_name",
            "email",
            "phone",
            "department",
            "department_name",
            "manager",
            "manager_name",
            "designation",
            "joining_date",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "created_at",
            "updated_at",
            "department_name",
            "manager_name",
        ]

    def get_manager_name(self, obj):
        if not obj.manager:
            return None

        return (
            f"{obj.manager.employee_code} - "
            f"{obj.manager.first_name} "
            f"{obj.manager.last_name}"
        )

    def validate(self, attrs):

        if self.instance is None:

            username = attrs.get("username")
            password = attrs.get("password")

            if not username:
                raise serializers.ValidationError({
                    "username": "Username is required."
                })

            if not password:
                raise serializers.ValidationError({
                    "password": "Password is required."
                })

            if User.objects.filter(username=username).exists():
                raise serializers.ValidationError({
                    "username": "Username already exists."
                })

            temp_user = User(
                username=username,
                email=attrs.get("email", ""),
                first_name=attrs.get("first_name", ""),
                last_name=attrs.get("last_name", "")
            )

            validate_password(password, user=temp_user)

        return attrs

    def validate_manager(self, manager):

        if manager is None or self.instance is None:
            return manager

        if manager.pk == self.instance.pk:
            raise serializers.ValidationError(
                "An employee cannot be their own manager."
            )

        current = manager
        visited = set()

        while current and current.pk not in visited:

            if current.pk == self.instance.pk:
                raise serializers.ValidationError(
                    "An employee cannot report to their own subordinate."
                )

            visited.add(current.pk)
            current = current.manager

        return manager


    
    @transaction.atomic
    def create(self, validated_data):

        username = validated_data.pop("username")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            username=username,
            password=password,
            email=validated_data["email"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"]
        )

        # Automatically created UserProfile
        profile = user.profile
        profile.role = "EMPLOYEE"
        profile.save(update_fields=["role"])

        employee = Employee.objects.create(
            user=user,
            **validated_data
        )

        return employee
