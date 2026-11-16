from django.contrib.auth import get_user_model

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from employees.permissions import IsAdminUserRole

from .serializers import RegisterSerializer
from .serializers import UserSerializer


User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Only an Admin can create new login accounts."""

    queryset = User.objects.all()

    serializer_class = RegisterSerializer

    permission_classes = [
        IsAdminUserRole
    ]


class CurrentUserView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        serializer = UserSerializer(
            request.user
        )

        return Response(
            serializer.data
        )