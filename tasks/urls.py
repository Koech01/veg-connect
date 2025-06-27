from django.urls import path
from .views import ProfileTasksView, CreateTaskView, ClickedTaskView
from .views import ShareTaskView, DeleteTaskView, TaskShareUsersAndGroupsView, TaskCompleteToggleView

urlpatterns = [
    path('v1/tasks/send/', ShareTaskView.as_view(), name='shareTaskView'),
    path('v1/home/tasks/', ProfileTasksView.as_view(), name='allTasksView'),
    path('v1/tasks/create/', CreateTaskView.as_view(), name='createTaskView'),
    path('v1/tasks/<int:taskId>/detail/', ClickedTaskView.as_view(), name='clickedTaskView'),
    path('v1/tasks/<int:taskId>/delete/', DeleteTaskView.as_view(), name='deleteTaskView'),
    path('v1/tasks/users/groups/', TaskShareUsersAndGroupsView.as_view(), name="usersAndGroupsView"),
    path('v1/tasks/<int:taskId>/<str:taskCompletedVal>/complete/', TaskCompleteToggleView.as_view(), name='taskComplete')
]