from django.db import migrations
from django.contrib.auth.hashers import make_password


def hash_all_passwords(apps, schema_editor):
    PatientProfile = apps.get_model('portal', 'PatientProfile')
    for profile in PatientProfile.objects.all():
        if not profile.account_password.startswith('pbkdf2_sha256$'):
            profile.account_password = make_password(profile.account_password)
            profile.save(update_fields=['account_password'])


def revert(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [('portal', '0004_admin_audit_log')]

    operations = [migrations.RunPython(hash_all_passwords, revert)]
