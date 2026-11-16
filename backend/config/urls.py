
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),

    # Authentication
    path("api/auth/", include("accounts.urls")),

    # Dashboard
    path("api/dashboard/", include("dashboard.urls")),

    # Core modules
    path("api/", include("departments.urls")),
    path("api/", include("employees.urls")),
    path("api/", include("salary.urls")),
    path("api/", include("attendance.urls")),
    path("api/", include("payroll.urls")),
    path("api/", include("payslips.urls")),

    # Leave Management
    path("api/leaves/", include("leave_management.urls")),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
