# Generated by Django 5.0.4 on 2024-11-30 10:14

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plants', '0010_remove_plants_task'),
        ('tasks', '0004_tasksuggestion'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tasks',
            name='plant',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='taskPlant', to='plants.plants'),
        ),
    ]
