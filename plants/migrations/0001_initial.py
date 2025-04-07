# Generated by Django 5.0.4 on 2024-10-23 11:48

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Plants',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('binomialName', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('sunRequirements', models.CharField(max_length=100)),
                ('growingDays', models.CharField(blank=True, max_length=50, null=True)),
                ('sowingMethod', models.TextField()),
                ('spreadDiameter', models.CharField(blank=True, max_length=50, null=True)),
                ('rowSpacing', models.CharField(blank=True, max_length=50, null=True)),
                ('height', models.CharField(blank=True, max_length=50, null=True)),
            ],
            options={
                'db_table': 'Plants',
            },
        ),
    ]
