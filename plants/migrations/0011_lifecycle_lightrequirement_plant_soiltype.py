# Generated by Django 5.0.4 on 2025-06-12 17:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plants', '0010_remove_plants_task'),
    ]

    operations = [
        migrations.CreateModel(
            name='LifeCycle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='LightRequirement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Plant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('commonName', models.CharField(max_length=255)),
                ('scientificName', models.CharField(max_length=255)),
                ('family', models.CharField(max_length=255)),
                ('width', models.FloatField(help_text='Width in meters')),
                ('soilpH', models.CharField(help_text="Example: '6.2 - 6.8'", max_length=50)),
                ('height', models.FloatField(help_text='Height in meters')),
                ('usdaHardinessZone', models.CharField(max_length=50)),
                ('waterRequirement', models.CharField(choices=[('Dry', 'Dry'), ('Moist', 'Moist'), ('Wet', 'Wet'), ('Dry, Moist', 'Dry, Moist'), ('Moist, Wet', 'Moist, Wet'), ('Dry, Moist, Wet', 'Dry, Moist, Wet'), ('Moist, Wet, Water', 'Moist, Wet, Water'), ('Wet, Water', 'Wet, Water')], max_length=50)),
                ('utility', models.TextField(help_text='Comma-separated values')),
                ('alternateNames', models.TextField(help_text='Comma-separated alternative names')),
                ('taskRecommendations', models.TextField(help_text='Full-text recommendations')),
            ],
            options={
                'verbose_name': 'Plant',
                'verbose_name_plural': 'Plants',
                'ordering': ['commonName'],
            },
        ),
        migrations.CreateModel(
            name='SoilType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
            ],
        ),
    ]
