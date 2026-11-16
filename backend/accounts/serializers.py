from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers

from .models import UserProfile


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="profile.role", read_only=True)
    employee_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email",
            "first_name", "last_name",
            "role", "employee_id",
        ]

    def get_employee_id(self, obj):
        employee = getattr(obj, "employee_profile", None)
        return employee.id if employee else None


class RegisterSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(
        choices=UserProfile.ROLE_CHOICES,
        default="EMPLOYEE",
    )

    class Meta:
        model = User
        fields = ["username", "email", "password", "role"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        role = validated_data.pop("role", "EMPLOYEE")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )

        # Profile signal se pehle hi ban chuka hai, sirf role update karo
        profile = user.profile
        profile.role = role
        profile.save(update_fields=["role"])

        return user

    def to_representation(self, instance):
        return UserSerializer(instance).data