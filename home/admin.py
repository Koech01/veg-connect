from django.contrib import admin
from .models import City, PlantSearchHistory, Bookmark


# Register your models here.
class CityAdmin(admin.ModelAdmin):
    list_display = ('id', 'country', 'name', 'precipitationClass')
admin.site.register(City, CityAdmin)


class PlantSearchHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'plant', 'created')
admin.site.register(PlantSearchHistory, PlantSearchHistoryAdmin)


class BookmarkAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'type', 'created')
admin.site.register(Bookmark, BookmarkAdmin)