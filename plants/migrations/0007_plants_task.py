# Generated by Django 5.0.4 on 2024-11-08 16:24

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plants', '0006_rename_plantname_plants_plantname'),
        ('tasks', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='plants',
            name='task',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='plantTask', to='tasks.tasks'),
            preserve_default=False,
        ),
    ]
