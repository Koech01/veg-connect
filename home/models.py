from django.db import models 
 
# Create your models here.
class City(models.Model):
    country            = models.CharField(max_length=100)
    name               = models.CharField(max_length=100)
    precipitationClass = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.name}, {self.country} {self.precipitationClass}"

    class Meta:
        unique_together = ('country', 'name')

    def __str__(self):
        return f"{self.name}, {self.country}"
    

class PlantSearchHistory(models.Model):
    user    = models.ForeignKey('profiles.Profile', on_delete=models.CASCADE, related_name='searchHistory')
    plant   = models.ForeignKey('plants.Plant', on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']

    def __str__(self):
        return f"{self.plant.commonName}, {self.created}"
    

class Bookmark(models.Model):
    BOOKMARK_TYPE_CHOICES = (
        ('plantPair', 'Plant Pair'),
        ('task', 'Task Recommendation'),
    )

    users   = models.ManyToManyField('profiles.Profile', related_name='bookmarks')
    title   = models.CharField(max_length=255)
    context = models.TextField()
    type    = models.CharField(max_length=20, choices=BOOKMARK_TYPE_CHOICES)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']

    def __str__(self):
        return f"{self.title} ({self.type})"