# Generated migration for DoctorSchedule and DoctorTimeOff models.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0005_revert_specialty_protect'),
    ]

    operations = [
        migrations.CreateModel(
            name='DoctorSchedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('weekday', models.PositiveSmallIntegerField(help_text='0=Thứ Hai, 1=Thứ Ba, ..., 6=Chủ Nhật')),
                ('is_working', models.BooleanField(default=True)),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='schedules', to='catalog.doctor')),
            ],
            options={
                'ordering': ['doctor', 'weekday'],
            },
        ),
        migrations.AddConstraint(
            model_name='doctorschedule',
            constraint=models.UniqueConstraint(fields=('doctor', 'weekday'), name='uniq_schedule_per_doctor_weekday'),
        ),
        migrations.CreateModel(
            name='DoctorTimeOff',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('off_date', models.DateField(help_text='Ngày nghỉ')),
                ('reason', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='time_offs', to='catalog.doctor')),
            ],
            options={
                'ordering': ['doctor', 'off_date'],
            },
        ),
        migrations.AddConstraint(
            model_name='doctortimeoff',
            constraint=models.UniqueConstraint(fields=('doctor', 'off_date'), name='uniq_timeoff_per_doctor_date'),
        ),
    ]
