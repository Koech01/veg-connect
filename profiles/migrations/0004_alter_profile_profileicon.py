# Generated by Django 5.0.4 on 2025-01-17 05:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0003_profile_newchat'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='profileIcon',
            field=models.URLField(blank=True, null=True),
        ),
    ]
