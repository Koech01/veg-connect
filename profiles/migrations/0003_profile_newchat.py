# Generated by Django 5.0.4 on 2024-12-02 07:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0002_remove_profile_location'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='newChat',
            field=models.BooleanField(default=False),
        ),
    ]
