import json
import base64
from PIL import Image
from io import BytesIO
from django.db.models import Q
from django.core.files import File
from profiles.models import Profile
from asgiref.sync import sync_to_async
from django.core.files.base import ContentFile
from .models import Message, MessageFile, GroupMessage, Group
from channels.generic.websocket import AsyncWebsocketConsumer
from .serializers import MessageSerializer, GroupMessageSerializer


# @sync_to_async
# def compressMessageImage(image):
#     messageImage   = Image.open(image)
#     messageImageIO = BytesIO()
#     messageImage.save(messageImageIO, 'JPEG', quality=60)
#     newImage = File(messageImageIO, name=image.name)
#     return newImage


class ChatConsumer(AsyncWebsocketConsumer):
    connectedUsers      = set() 
    connectedUIDs       = list() 
    connectedGroupUsers = dict() 

    async def connect(self):
        self.chatType   = self.scope["url_route"]["kwargs"]["chatType"]
        self.senderId   = self.scope["url_route"]["kwargs"]["senderId"]
        self.receiverId = self.scope["url_route"]["kwargs"]["receiverId"]

        # Create room group name using sender and receiver IDs
        if self.chatType == 'user':
            self.room_group_name = f"chat_{min(self.senderId, self.receiverId)}_{max(self.senderId, self.receiverId)}"
            self.connectedUsers.add(self.senderId)

            try:
                profileUser    = await sync_to_async(Profile.objects.get)(id=self.senderId)
                receiverUser   = await sync_to_async(Profile.objects.get)(id=self.receiverId)
                connectedUsers = await sync_to_async(
                    lambda: list(Profile.objects.filter(id__in=list(self.connectedUsers)))
                )()

                sortedIds   = sorted([profileUser.id, receiverUser.id])
                sortedUsers = sorted([profileUser.username[0], receiverUser.username[0]])
                chatUID     = f"{sortedIds[0]}-{sortedUsers[0]}" + f"{sortedIds[1]}-{sortedUsers[1]}"
                self.connectedUIDs.append(chatUID)

                if profileUser and receiverUser:
                    chatUsers = [profileUser, receiverUser]
                else:
                    chatUsers = []  

                if profileUser in connectedUsers and profileUser in chatUsers and len(chatUsers) > 1: 
                    unReadProfileMessages = await sync_to_async(
                        lambda: Message.objects.filter(
                            Q(user=profileUser, sender=profileUser, receiver=receiverUser) |
                            Q(user=profileUser, sender=receiverUser, receiver=profileUser)
                        ).filter(isRead=False).exclude(deletedBy=profileUser)
                    )()

                    await sync_to_async(unReadProfileMessages.update)(isRead=True)

                    if self.connectedUIDs.count(chatUID) > 1: 
                        unReadReceiverMessages = await sync_to_async(
                            lambda: Message.objects.filter(
                                Q(user=receiverUser, sender=receiverUser, receiver=profileUser) |
                                Q(user=receiverUser, sender=profileUser, receiver=receiverUser)
                            ).filter(isRead=False).exclude(deletedBy=receiverUser)
                        )()

                        await sync_to_async(unReadReceiverMessages.update)(isRead=True)

            except Profile.DoesNotExist:
                pass

        elif self.chatType == 'group':
            self.room_group_name = f"chat_{self.receiverId}"

            try:
                profileUser = await sync_to_async(Profile.objects.get)(id=self.senderId)
                groupChat   = await sync_to_async(Group.objects.get)(id=self.receiverId)

                if groupChat.id not in self.connectedGroupUsers:
                    self.connectedGroupUsers[groupChat.id] = []

                if self.senderId not in self.connectedGroupUsers[groupChat.id]:
                    self.connectedGroupUsers[groupChat.id].append(self.senderId)

                groupMessages = await sync_to_async(list)(
                    GroupMessage.objects.filter(group=groupChat).exclude(isRead__id__in=self.connectedGroupUsers[groupChat.id])
                )

                for message in groupMessages:
                    for userId in self.connectedGroupUsers[groupChat.id]:
                        profile = await sync_to_async(Profile.objects.get)(id=userId)
                        if profile not in message.isRead.all():
                            message.isRead.add(profile)
                    await sync_to_async(message.save)()

            except (Profile.DoesNotExist, Group.DoesNotExist):
                pass
         
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        try:
            profileUser = await sync_to_async(Profile.objects.get)(id=self.senderId)
            
            if self.chatType == 'group':
                try:
                    groupChat = await sync_to_async(Group.objects.get)(id=self.receiverId)

                    # Remove the user from the group if they exist
                    if groupChat.id in self.connectedGroupUsers:
                        if self.senderId in self.connectedGroupUsers[groupChat.id]:
                            self.connectedGroupUsers[groupChat.id].remove(self.senderId)

                        # Clean up the group entry if no users are left
                        if not self.connectedGroupUsers[groupChat.id]:
                            del self.connectedGroupUsers[groupChat.id]
                except Group.DoesNotExist:
                    pass

            if self.chatType == 'user':  
                receiverUser = await sync_to_async(Profile.objects.get)(id=self.receiverId)
                sortedIds    = sorted([profileUser.id, receiverUser.id])
                sortedUsers  = sorted([profileUser.username[0], receiverUser.username[0]])
                chatUID      = f"{sortedIds[0]}-{sortedUsers[0]}" + f"{sortedIds[1]}-{sortedUsers[1]}"

                if chatUID in self.connectedUIDs:
                    self.connectedUIDs.remove(chatUID)

        except Profile.DoesNotExist:
            pass

    async def receive(self, text_data):
        textdataJson = json.loads(text_data)
        textMessage  = textdataJson['message']
        messageFiles = textdataJson.get('files', []) 

        fileObjs = []
        for fileData in messageFiles:
            fileContent    = base64.b64decode(fileData['data'].split(',')[1])  # Decode base64
            fileName       = fileData['name']
            contentFile    = ContentFile(fileContent, name=fileName)

            if fileName.lower().endswith(('png', 'jpeg', 'jpg')):
                messageFileObj = await sync_to_async(MessageFile.objects.create)(file=contentFile)
            fileObjs.append(messageFileObj)


        if self.chatType == 'user':
            # Fetch the sender and receiver profiles asynchronously
            senderProfile   = await sync_to_async(Profile.objects.get)(id=self.senderId)
            receiverProfile = await sync_to_async(Profile.objects.get)(id=self.receiverId)

            # Create message objects for both sender and receiver asynchronously
            senderMessage = await self.createSenderMessage(senderProfile, receiverProfile, textMessage, fileObjs)
            await self.createReceiverMessage(senderProfile, receiverProfile, textMessage, fileObjs)

            # Serialize the sender's message to send back to the group (ensure serialization runs in sync_to_async)
            serializerMessage = await sync_to_async(self.userMessageSerializer)(senderMessage)

            # Send the serialized message data to the group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type'      : 'userChatMessage',
                    'message'   : serializerMessage,
                    'senderId'  : self.senderId,
                    'receiverId': self.receiverId
                }
            )

            # Updating profile chat unread counter for sender profile
            unReadProfileMessages = await sync_to_async(
                lambda: Message.objects.filter(
                    Q(user=senderProfile, sender=senderProfile, receiver=receiverProfile) | 
                    Q(user=senderProfile, sender=receiverProfile, receiver=senderProfile)
                ).filter(isRead=False).exclude(deletedBy=senderProfile)
            )()

            await sync_to_async(unReadProfileMessages.update)(isRead=True)

            sortedIds   = sorted([senderProfile.id, receiverProfile.id])
            sortedUsers = sorted([senderProfile.username[0], receiverProfile.username[0]])
            chatUID     = f"{sortedIds[0]}-{sortedUsers[0]}" + f"{sortedIds[1]}-{sortedUsers[1]}"

            if self.connectedUIDs.count(chatUID) > 1: 
                unReadReceiverMessages = await sync_to_async(
                    lambda: Message.objects.filter(
                        Q(user=receiverProfile, sender=receiverProfile, receiver=senderProfile) |
                        Q(user=receiverProfile, sender=senderProfile, receiver=receiverProfile)
                    ).filter(isRead=False).exclude(deletedBy=receiverProfile)
                )()

                await sync_to_async(unReadReceiverMessages.update)(isRead=True)

            if not receiverProfile.newChat and self.connectedUIDs.count(chatUID) < 2:
                receiverProfile.newChat = True
                await sync_to_async(receiverProfile.save)()


        elif self.chatType == 'group':
            senderProfile = await sync_to_async(Profile.objects.get)(id=self.senderId)
            groupName     = await sync_to_async(Group.objects.get)(id=self.receiverId)
            groupMessage  = await self.createGroupMessage(senderProfile, groupName, textMessage, fileObjs)
            
            # Serialize the group message
            for userId in self.connectedGroupUsers[groupName.id]:
                profile = await sync_to_async(Profile.objects.get)(id=userId)
                if not await sync_to_async(lambda: profile in groupMessage.isRead.all())():
                    await sync_to_async(groupMessage.isRead.add)(profile)
 
            serializerGroupMessage = await sync_to_async(self.groupMessageSerializer)(groupMessage)

            # Send the serialized message data to the group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type'     : 'groupChatMessage',
                    'message'  : serializerGroupMessage,
                    'senderId' : self.senderId,
                    'groupId'  : self.receiverId
                }
            )

            # Update newChat attribute for group members in bulk
            await sync_to_async(groupName.members.filter(newChat=False)
            .exclude(id=self.senderId).exclude(id__in=self.connectedGroupUsers[groupName.id]).update)(newChat=True)

    async def userChatMessage(self, event):
        textMessage = event["message"]
        senderId    = event["senderId"]
        receiverId  = event["receiverId"]
        await self.send(text_data=json.dumps({"type": "userChatMessage", "message": textMessage,"senderId": senderId, "receiverId": receiverId}))


    # Group Message
    async def groupChatMessage(self, event):
        textMessage = event["message"]
        groupId     = event["groupId"]
        await self.send(text_data=json.dumps({"type": "groupChatMessage", "message": textMessage, "groupId": groupId  }))


    @sync_to_async
    def createSenderMessage(self, profile, chatUser, textMessage, messageFiles):
        messageObj = Message.objects.create(
            user     = profile,
            sender   = profile,
            receiver = chatUser,
            text     = textMessage,
            isRead   = True
        )
        messageObj.files.set(messageFiles)
        return messageObj


    @sync_to_async
    def createReceiverMessage(self, profile, chatUser, textMessage, messageFiles):
        messageObj =  Message.objects.create(
            user     = chatUser,
            sender   = profile,
            receiver = chatUser,
            text     = textMessage
        )
        messageObj.files.set(messageFiles)
        return messageObj
    

    # Group Message
    @sync_to_async
    def createGroupMessage(self, profile, groupName, textMessage, messageFiles):
        messageObj = GroupMessage.objects.create(
            group  = groupName,
            sender = profile,
            text   = textMessage
        )
        messageObj.files.set(messageFiles)
        return messageObj
    

    def userMessageSerializer(self, message):
        return MessageSerializer(message).data
    

    # Group Message Serializer
    def groupMessageSerializer(self, message):
        return GroupMessageSerializer(message).data