
from rest_framework.permissions import BasePermission, IsAuthenticated


def get_role(user):
    """Return the authenticated user's role."""
    if not user or not user.is_authenticated:
        return None

    profile = getattr(user, "profile", None)
    return profile.role if profile else None


def is_admin(user):
    return get_role(user) == "ADMIN"


def is_manager(user):
    return get_role(user) == "MANAGER"


def is_hr(user):
    return get_role(user) == "HR"


def is_manager_for_employee(user, employee):
    """Check whether this manager supervises the given employee."""
    if not is_manager(user):
        return False

    return (
        employee.manager_id is not None
        and employee.manager.user_id == user.pk
    )


class IsAdminUserRole(BasePermission):

    message = "Only Admin users can perform this action."

    def has_permission(self, request, view):
        return is_admin(request.user)


class IsManagerUserRole(BasePermission):

    message = "Only Manager users can perform this action."

    def has_permission(self, request, view):
        return is_manager(request.user)


class IsHRUserRole(BasePermission):

    message = "Only HR users can perform this action."

    def has_permission(self, request, view):
        return is_hr(request.user)


class AdminWriteMixin:
    """
    Anyone authenticated can read.
    Only Admin can create, update or delete.
    """

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]

        return [IsAdminUserRole()]


class OwnDataMixin(AdminWriteMixin):
    """
    Employees can only see their own records.
    Admin can see all records.
    """

    owner_field = None

    def get_queryset(self):
        queryset = super().get_queryset()

        if is_admin(self.request.user):
            return queryset

        return queryset.filter(
            **{self.owner_field: self.request.user}
        )
