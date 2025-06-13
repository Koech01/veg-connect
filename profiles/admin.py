from django.contrib import admin
from . models import Profile, ProfileToken, ResetPassword


admin.site.register(ProfileToken)
admin.site.register(ResetPassword)

class ProfileAdmin(admin.ModelAdmin):
  list_display = ("username", "firstName", "lastName", "email", "created")
admin.site.register(Profile, ProfileAdmin)