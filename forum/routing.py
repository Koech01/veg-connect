from . import consumers
from django.urls import re_path

websocket_urlpatterns = [
    re_path(r'v1/ws/chat/(?P<chatType>\w+)/(?P<senderId>\d+)/(?P<receiverId>\d+)/$', consumers.ChatConsumer.as_asgi()),
]