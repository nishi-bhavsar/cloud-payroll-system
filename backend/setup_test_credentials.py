import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from accounts.models import UserProfile

accounts = [
    ("admin1", "admin123", "ADMIN"),
    ("manager1", "manager123", "MANAGER"),
    ("employee1", "employee123", "EMPLOYEE"),
]

for username, pwd, role in accounts:
    user, _ = User.objects.get_or_create(username=username)
    user.set_password(pwd)
    if role == "ADMIN":
        user.is_staff = True
        user.is_superuser = True
    user.save()

    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.role = role
    profile.save()
    print(f"User: {username} | Role: {role} | Password: {pwd}")
