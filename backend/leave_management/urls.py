
from django.urls import path

from .views import (
    ApplyLeaveView,
    LeaveHistoryView,
    LeaveBalanceView,
    ManageLeaveView,
    CancelLeaveView,
)

from .manager_views import ManagerLeaveRequestsView
from .admin_views import AdminLeaveRequestsView
from .type_views import LeaveTypeListView


urlpatterns = [

    path(
        "types/",
        LeaveTypeListView.as_view(),
        name="leave-types"
    ),

    path(
        "apply/",
        ApplyLeaveView.as_view(),
        name="apply-leave"
    ),

    path(
        "history/",
        LeaveHistoryView.as_view(),
        name="leave-history"
    ),

    path(
        "balance/",
        LeaveBalanceView.as_view(),
        name="leave-balance"
    ),

    path(
        "manage/<int:pk>/",
        ManageLeaveView.as_view(),
        name="manage-leave"
    ),

    path(
        "cancel/<int:pk>/",
        CancelLeaveView.as_view(),
        name="cancel-leave"
    ),

    path(
        "manager-requests/",
        ManagerLeaveRequestsView.as_view(),
        name="manager-leave-requests"
    ),

    path(
        "admin-requests/",
        AdminLeaveRequestsView.as_view(),
        name="admin-leave-requests"
    ),
]
