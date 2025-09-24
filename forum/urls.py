from django.urls import path
from .views import UserChatsView, GroupSuggestionView ,UserMessagesView, GroupUpdateView
from .views import CreateGroupView, JoinGroupView, GroupUpdateAutoJoinView, GroupRequestView, ClearChatView

urlpatterns = [
    path('v1/chats/', UserChatsView.as_view(), name='userChatsView'),
    path('v1/groups/create/', CreateGroupView.as_view(), name='createGroupView'),
    path('v1/groups/<int:groupId>/join/', JoinGroupView.as_view(), name='joinGroupView'),
    path('v1/groups/<int:groupId>/update/', GroupUpdateView.as_view(), name='groupUpdateView'),
    path('v1/groups/suggest/', GroupSuggestionView.as_view(), name='groupSuggestionView'),
    path('v1/messages/<str:chatType>/<int:chatId>/', UserMessagesView.as_view(), name='userMessagesView'),
    path('v1/messages/<str:chatType>/<int:chatId>/delete/', ClearChatView.as_view(), name='clearChatMessagesView'),
    path('v1/groups/<int:groupId>/<str:autoJoinVal>/auto/join/', GroupUpdateAutoJoinView.as_view(), name='groupUpdateAutoJoinView'),
    path('v1/groups/<str:requestType>/<int:groupId>/<int:profileId>/request/', GroupRequestView.as_view(), name='groupRequestView')
]