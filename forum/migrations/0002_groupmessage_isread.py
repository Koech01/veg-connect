# Generated by Django 5.0.4 on 2024-11-04 09:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('forum', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='groupmessage',
            name='isRead',
            field=models.BooleanField(default=False),
        ),
    ]
