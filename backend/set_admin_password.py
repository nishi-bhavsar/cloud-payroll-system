import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from accounts.models import UserProfile

username = "admin1"
password = "admin123"

user, created = User.objects.get_or_create(username=username)
user.set_password(password)
user.is_staff = True
user.is_superuser = True
user.save()

profile, _ = UserProfile.objects.get_or_create(user=user)
profile.role = "ADMIN"
profile.save()

print(f"Successfully configured '{username}' with role '{profile.role}' and password '{password}'.")
