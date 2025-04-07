from django.contrib import admin
from .models import Message, Group, MessageFile, GroupMessage


# Register your models here.
class MessageAdmin(admin.ModelAdmin):
    list_display      = ('id', 'user', 'sender', 'receiver', 'textDescription')
    filter_horizontal = ('files',) 

    def textDescription(self, obj):
        return obj.text[:50] + ' ...' if len(obj.text) > 50 else obj.text
    textDescription.short_description = 'Text'
admin.site.register(Message, MessageAdmin)


class MessageFileAdmin(admin.ModelAdmin):
    list_display = ('id', 'file', 'created')
admin.site.register(MessageFile, MessageFileAdmin)


class GroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created')
admin.site.register(Group, GroupAdmin)


class GroupMessageAdmin(admin.ModelAdmin):
    list_display      = ('id', 'group', 'sender', 'textDescription')
    filter_horizontal = ('files',) 

    def textDescription(self, obj):
        return obj.text[:50] + ' ...' if len(obj.text) > 50 else obj.text
    textDescription.short_description = 'Text'
admin.site.register(GroupMessage, GroupMessageAdmin)