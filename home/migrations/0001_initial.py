# Generated by Django 5.0.4 on 2025-06-12 17:30

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PlantSearchHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-created'],
            },
        ),
        migrations.CreateModel(
            name='Bookmark',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('context', models.TextField()),
                ('type', models.CharField(choices=[('plantPair', 'Plant Pair'), ('task', 'Task Recommendation')], max_length=20)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('users', models.ManyToManyField(related_name='bookmarks', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created'],
            },
        ),
        migrations.CreateModel(
            name='City',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('country', models.CharField(max_length=100)),
                ('name', models.CharField(max_length=100)),
                ('precipitationClass', models.CharField(max_length=50)),
            ],
            options={
                'unique_together': {('country', 'name')},
            },
        ),
    ]
