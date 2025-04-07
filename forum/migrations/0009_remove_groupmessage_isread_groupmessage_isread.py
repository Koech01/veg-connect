# Generated by Django 5.0.4 on 2024-11-19 08:33

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('forum', '0008_alter_group_request'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveField(
            model_name='groupmessage',
            name='isRead',
        ),
        migrations.AddField(
            model_name='groupmessage',
            name='isRead',
            field=models.ManyToManyField(blank=True, related_name='readGroupMessages', to=settings.AUTH_USER_MODEL),
        ),
    ]
