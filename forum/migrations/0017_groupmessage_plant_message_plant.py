# Generated by Django 5.0.4 on 2025-01-08 10:12

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('forum', '0016_groupmessage_task_message_task'),
        ('plants', '0010_remove_plants_task'),
    ]

    operations = [
        migrations.AddField(
            model_name='groupmessage',
            name='plant',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='groupMessagePlant', to='plants.plants'),
        ),
        migrations.AddField(
            model_name='message',
            name='plant',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='messagePlants', to='plants.plants'),
        ),
    ]
