# Project Tree

Generated from the current repository state after refactor.

Excluded for readability:
- `.git/`
- `frontend/node_modules/`
- `frontend/build/`
- `__pycache__/`

```text
clinic-appointment-system
|-- backend
|   |-- appointments
|   |   |-- migrations
|   |   |   |-- 0001_initial.py
|   |   |   |-- 0002_alter_appointment_options_alter_appointment_managers.py
|   |   |   |-- 0003_appointment_visit_type_appointmentblock_and_more.py
|   |   |   |-- 0004_alter_appointment_visit_type.py
|   |   |   `-- __init__.py
|   |   |-- __init__.py
|   |   |-- admin.py
|   |   |-- apps.py
|   |   |-- models.py
|   |   |-- serializers.py
|   |   |-- services.py
|   |   |-- tests.py
|   |   |-- urls.py
|   |   `-- views.py
|   |-- catalog
|   |   |-- management
|   |   |   `-- commands
|   |   |       |-- __init__.py
|   |   |       `-- seed_demo_data.py
|   |   |-- migrations
|   |   |   |-- 0001_initial.py
|   |   |   `-- __init__.py
|   |   |-- __init__.py
|   |   |-- admin.py
|   |   |-- apps.py
|   |   |-- models.py
|   |   |-- serializers.py
|   |   |-- tests.py
|   |   |-- urls.py
|   |   `-- views.py
|   |-- common
|   |   |-- __init__.py
|   |   |-- permissions.py
|   |   `-- responses.py
|   |-- config
|   |   |-- __init__.py
|   |   |-- asgi.py
|   |   |-- settings.py
|   |   |-- urls.py
|   |   `-- wsgi.py
|   |-- portal
|   |   |-- migrations
|   |   |   |-- 0001_initial.py
|   |   |   |-- 0002_user.py
|   |   |   `-- __init__.py
|   |   |-- __init__.py
|   |   |-- admin.py
|   |   |-- apps.py
|   |   |-- models.py
|   |   |-- services.py
|   |   |-- tests.py
|   |   |-- urls.py
|   |   `-- views.py
|   |-- .env
|   `-- manage.py
|-- docs
|   |-- backlog
|   |-- diagrams
|   `-- weekly-reports
|-- frontend
|   |-- public
|   |   |-- assets
|   |   |   `-- images
|   |   |       `-- doctors
|   |   |           |-- config.json
|   |   |           `-- landing.json
|   |   |-- favicon.ico
|   |   |-- index.html
|   |   |-- logo192.png
|   |   |-- logo512.png
|   |   |-- manifest.json
|   |   `-- robots.txt
|   |-- src
|   |   |-- assets
|   |   |   |-- fonts
|   |   |   |-- icons
|   |   |   `-- images
|   |   |-- components
|   |   |   |-- Badge
|   |   |   |   |-- Badge.css
|   |   |   |   `-- Badge.jsx
|   |   |   |-- Button
|   |   |   |   |-- Button.css
|   |   |   |   `-- Button.jsx
|   |   |   |-- Drawer
|   |   |   |   |-- Drawer.css
|   |   |   |   `-- Drawer.jsx
|   |   |   |-- EmptyState
|   |   |   |   |-- EmptyState.css
|   |   |   |   `-- EmptyState.jsx
|   |   |   |-- Input
|   |   |   |   |-- Input.css
|   |   |   |   `-- Input.jsx
|   |   |   |-- LoadingSpinner
|   |   |   |   |-- LoadingSpinner.css
|   |   |   |   `-- LoadingSpinner.jsx
|   |   |   |-- Modal
|   |   |   |   |-- Modal.css
|   |   |   |   `-- Modal.jsx
|   |   |   |-- Select
|   |   |   |   |-- Select.css
|   |   |   |   `-- Select.jsx
|   |   |   |-- Table
|   |   |   |   |-- Table.css
|   |   |   |   `-- Table.jsx
|   |   |   `-- Toast
|   |   |       |-- Toast.css
|   |   |       `-- Toast.jsx
|   |   |-- layouts
|   |   |   |-- PatientLayout
|   |   |   |   |-- PatientLayout.css
|   |   |   |   `-- PatientLayout.jsx
|   |   |   |-- PublicLayout
|   |   |   |   |-- AuthPanel.css
|   |   |   |   |-- PublicLayout.css
|   |   |   |   `-- PublicLayout.jsx
|   |   |   `-- StaffLayout
|   |   |       |-- StaffLayout.css
|   |   |       `-- StaffLayout.jsx
|   |   |-- pages
|   |   |   |-- admin
|   |   |   |   |-- AuditPage
|   |   |   |   |   |-- AuditPage.css
|   |   |   |   |   `-- AuditPage.jsx
|   |   |   |   |-- CatalogPage
|   |   |   |   |   |-- CatalogPage.css
|   |   |   |   |   `-- CatalogPage.jsx
|   |   |   |   |-- ReportsPage
|   |   |   |   |   |-- ReportsPage.css
|   |   |   |   |   `-- ReportsPage.jsx
|   |   |   |   `-- UsersPage
|   |   |   |       `-- UsersPage.jsx
|   |   |   |-- doctor
|   |   |   |   |-- QueuePage
|   |   |   |   |   |-- QueuePage.css
|   |   |   |   |   `-- QueuePage.jsx
|   |   |   |   |-- SchedulePage
|   |   |   |   |   |-- SchedulePage.css
|   |   |   |   |   `-- SchedulePage.jsx
|   |   |   |   |-- VisitPage
|   |   |   |   |   |-- VisitPage.css
|   |   |   |   |   `-- VisitPage.jsx
|   |   |   |   `-- VisitsPage
|   |   |   |       |-- VisitsPage.css
|   |   |   |       `-- VisitsPage.jsx
|   |   |   |-- patient
|   |   |   |   |-- AccountPage
|   |   |   |   |   |-- AccountPage.css
|   |   |   |   |   `-- AccountPage.jsx
|   |   |   |   |-- HealthProfilePage
|   |   |   |   |   |-- HealthProfilePage.css
|   |   |   |   |   `-- HealthProfilePage.jsx
|   |   |   |   |-- MyAppointmentsPage
|   |   |   |   |   |-- MyAppointmentsPage.css
|   |   |   |   |   `-- MyAppointmentsPage.jsx
|   |   |   |   |-- NotificationsPage
|   |   |   |   |   |-- NotificationsPage.css
|   |   |   |   |   `-- NotificationsPage.jsx
|   |   |   |   `-- RecordDetailPage
|   |   |   |       |-- RecordDetailPage.css
|   |   |   |       |-- RecordDetailPage.jsx
|   |   |   |       `-- RecordDetailPage.module.css
|   |   |   |-- public
|   |   |   |   |-- BookingSuccessPage
|   |   |   |   |   |-- BookingSuccessPage.css
|   |   |   |   |   `-- BookingSuccessPage.jsx
|   |   |   |   |-- BookingWizardPage
|   |   |   |   |   |-- BookingWizardPage.css
|   |   |   |   |   `-- BookingWizardPage.jsx
|   |   |   |   |-- ClaimProfilePage
|   |   |   |   |   |-- ClaimProfilePage.css
|   |   |   |   |   `-- ClaimProfilePage.jsx
|   |   |   |   |-- LandingPage
|   |   |   |   |   |-- LandingPage.css
|   |   |   |   |   `-- LandingPage.jsx
|   |   |   |   |-- LoginPage
|   |   |   |   |   |-- LoginPage.css
|   |   |   |   |   `-- LoginPage.jsx
|   |   |   |   |-- LookupPage
|   |   |   |   |   |-- LookupPage.css
|   |   |   |   |   `-- LookupPage.jsx
|   |   |   |   |-- NotFoundPage
|   |   |   |   |   |-- NotFoundPage.css
|   |   |   |   |   `-- NotFoundPage.jsx
|   |   |   |   |-- RegisterPage
|   |   |   |   |   |-- RegisterPage.css
|   |   |   |   |   `-- RegisterPage.jsx
|   |   |   |   `-- UIKitPage
|   |   |   |       |-- UIKitPage.css
|   |   |   |       `-- UIKitPage.jsx
|   |   |   `-- reception
|   |   |       |-- AppointmentsPage
|   |   |       |   |-- AppointmentsPage.css
|   |   |       |   `-- AppointmentsPage.jsx
|   |   |       |-- CheckinPage
|   |   |       |   |-- CheckinPage.css
|   |   |       |   `-- CheckinPage.jsx
|   |   |       `-- PatientsPage
|   |   |           |-- PatientsPage.css
|   |   |           `-- PatientsPage.jsx
|   |   |-- services
|   |   |   |-- adminApi.js
|   |   |   |-- apiClient.js
|   |   |   |-- authService.js
|   |   |   |-- bookingApi.js
|   |   |   |-- doctorApi.js
|   |   |   |-- endpoints.js
|   |   |   |-- patientApi.js
|   |   |   `-- receptionApi.js
|   |   |-- styles
|   |   |   |-- global.css
|   |   |   |-- reset.css
|   |   |   `-- variables.css
|   |   |-- utils
|   |   |   `-- text.js
|   |   |-- App.jsx
|   |   |-- index.js
|   |   |-- main.jsx
|   |   `-- router.jsx
|   |-- .env
|   |-- .gitignore
|   |-- package-lock.json
|   |-- package.json
|   |-- README.md
|   `-- refactor.js
|-- .gitignore
|-- README.md
|-- requirements.txt
`-- tree.md
```
