"""
Django settings for config project.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / '.env'

if ENV_FILE.exists():
    for raw_line in ENV_FILE.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        os.environ.setdefault(key.strip(), value.strip())

_raw_debug = os.getenv('DJANGO_DEBUG', '').lower()
# Default True (development). Must explicitly set DJANGO_DEBUG=false for production.
DEBUG = _raw_debug not in ('false', '0', 'no')

_secret = os.getenv('DJANGO_SECRET_KEY', '')
# Enforce secure SECRET_KEY when running in production mode
if not DEBUG:
    if not _secret:
        raise ValueError(
            "DJANGO_SECRET_KEY must be set when DEBUG=False. "
            "Generate one with: python -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\""
        )
    if _secret.startswith('django-insecure-'):
        raise ValueError(
            "DJANGO_SECRET_KEY must not be an insecure default in production. "
            "Generate a secure key at: python -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\""
        )
SECRET_KEY = _secret or 'django-insecure-dev-only'

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_TOKEN_LIFETIME_MINUTES = int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', '60'))
JWT_REFRESH_TOKEN_LIFETIME_DAYS = int(os.getenv('JWT_REFRESH_TOKEN_LIFETIME_DAYS', '7'))
JWT_ACCESS_TOKEN_COOKIE_NAME = 'access_token'
JWT_REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'

ALLOWED_HOSTS = [h.strip() for h in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver').split(',')]
DEFAULT_CHARSET = 'utf-8'

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'catalog',
    'appointments',
    'portal',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DB_ENGINE = os.getenv('DB_ENGINE', 'postgresql').lower()
if DB_ENGINE in {'postgres', 'postgresql', 'psql'}:
    _db_options = {}
    _sslmode = os.getenv('DB_SSLMODE', '')
    if _sslmode:
        _db_options['sslmode'] = _sslmode
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'clinic_appointment_system'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', os.getenv('PGPASSWORD', '12345')),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
            'OPTIONS': _db_options,
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Ho_Chi_Minh'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'mediafiles'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'common.auth.JWTAuthentication',      # JWT first (stateless)
        'common.auth.SessionUserAuthentication', # Session fallback (backwards compat)
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'common.auth.LoginThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'login': '15/minute',        # Login attempts
        'otp': '10/minute',          # OTP requests
        'forgot_password': '10/minute', # Forgot password requests
        'anon': '100/minute',         # Anonymous users
    },
    'EXCEPTION_HANDLER': 'common.auth.custom_exception_handler',
}

_cors_raw = os.getenv('CORS_ALLOWED_ORIGINS', '')
if _cors_raw:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_raw.split(',') if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = DEBUG

_csrf_raw = os.getenv('CSRF_TRUSTED_ORIGINS', '')
if _csrf_raw:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_raw.split(',') if o.strip()]
else:
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

# ── Cookie Security (production-ready) ─────────────────────────────────────────
# In production, set:
#   SESSION_COOKIE_SECURE = True
#   SESSION_COOKIE_HTTPONLY = True
#   SESSION_COOKIE_SAMESITE = 'Lax'
#   CSRF_COOKIE_SECURE = True
#   CSRF_COOKIE_HTTPONLY = True
# Currently relaxed for localhost development:
SESSION_COOKIE_SAMESITE = 'Lax' if not DEBUG else None
SESSION_COOKIE_DOMAIN = None
SESSION_COOKIE_HTTPONLY = True  # JavaScript cannot read session cookie
SESSION_COOKIE_SECURE = not DEBUG  # HTTPS only in production
CSRF_COOKIE_SAMESITE = 'Lax' if not DEBUG else None
CSRF_COOKIE_HTTPONLY = False  # Must be False for Django CSRF to work
CSRF_COOKIE_SECURE = not DEBUG
