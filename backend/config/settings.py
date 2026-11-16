from datetime import timedelta
from pathlib import Path
import os

from dotenv import load_dotenv


# =========================================================
# BASE DIRECTORY
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# =========================================================
# ENVIRONMENT VARIABLES
# =========================================================

load_dotenv(BASE_DIR.parent / ".env")


def env_list(name, default):
    """Read a comma-separated environment variable as a list."""
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


# =========================================================
# SECURITY
# =========================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-development-key"
)

DEBUG = os.getenv("DEBUG", "True") == "True"

ALLOWED_HOSTS = env_list(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,.vercel.app,*"
)


# =========================================================
# INSTALLED APPS
# =========================================================

INSTALLED_APPS = [

    # Django default apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party apps
    "corsheaders",
    "rest_framework",

    # Project apps
    "accounts",
    "departments",
    "employees",
    "salary",
    "attendance",
    "payroll",
    "payslips",
    "dashboard",
   "leave_management",
]


# =========================================================
# MIDDLEWARE
# =========================================================

MIDDLEWARE = [

    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# =========================================================
# URL CONFIGURATION
# =========================================================

ROOT_URLCONF = "config.urls"


# =========================================================
# TEMPLATES
# =========================================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",

        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {
            "context_processors": [

                "django.template.context_processors.request",

                "django.contrib.auth.context_processors.auth",

                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# =========================================================
# WSGI
# =========================================================

WSGI_APPLICATION = "config.wsgi.application"


# =========================================================
# DATABASE
# =========================================================
# For now we are using SQLite.
# MySQL + Docker will be configured in Step 3.

# Support Vercel serverless /tmp writable fallback and external DATABASE_URL
database_url = os.getenv("DATABASE_URL")
if database_url:
    from urllib.parse import urlparse
    url = urlparse(database_url)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql" if "postgres" in url.scheme else "django.db.backends.mysql",
            "NAME": url.path[1:],
            "USER": url.username,
            "PASSWORD": url.password,
            "HOST": url.hostname,
            "PORT": url.port or (5432 if "postgres" in url.scheme else 3306),
        }
    }
elif os.getenv("VERCEL"):
    import shutil
    tmp_db = Path("/tmp") / "db.sqlite3"
    if not tmp_db.exists() and (BASE_DIR / "db.sqlite3").exists():
        shutil.copy2(BASE_DIR / "db.sqlite3", tmp_db)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": tmp_db,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# =========================================================
# PASSWORD VALIDATION
# =========================================================

AUTH_PASSWORD_VALIDATORS = [

    {
        "NAME":
        "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },

    {
        "NAME":
        "django.contrib.auth.password_validation.MinimumLengthValidator"
    },

    {
        "NAME":
        "django.contrib.auth.password_validation.CommonPasswordValidator"
    },

    {
        "NAME":
        "django.contrib.auth.password_validation.NumericPasswordValidator"
    },

]


# =========================================================
# LANGUAGE AND TIME
# =========================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True


# =========================================================
# STATIC FILES
# =========================================================

STATIC_URL = "static/"


# =========================================================
# MEDIA FILES (generated payslip PDFs)
# =========================================================

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# =========================================================
# DEFAULT PRIMARY KEY
# =========================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# =========================================================
# CORS
# =========================================================

CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173"
)

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]


# =========================================================
# DJANGO REST FRAMEWORK
# =========================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}


# =========================================================
# JWT
# =========================================================
# Default access token lasts only 5 minutes -> frequent logouts.

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
}


# =========================================================
# IMPORTANT
# =========================================================
# DO NOT add:
#
# AUTH_USER_MODEL = "accounts.User"
#
# We are using Django's built-in User model.