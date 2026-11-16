
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from .models import LeaveType
from .serializers import LeaveTypeSerializer


class LeaveTypeListView(ListAPIView):

    permission_classes = [IsAuthenticated]

    serializer_class = LeaveTypeSerializer

    queryset = LeaveType.objects.filter(
        is_active=True
    ).order_by("code")
