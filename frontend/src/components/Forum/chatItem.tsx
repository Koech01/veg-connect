import moment from 'moment';
import css from '../Forum/index.module.css';
import { type MessageProps, type ProfileProps, type GroupProps, getMessageFileFormat } from '../types/index';


interface ChatItemProps {
  chat               : MessageProps;
  profile            : ProfileProps;
  chatDetails        : ProfileProps | GroupProps | null;
  onClick            : (chatType : 'user' | 'group', chatId: number | string, chatItemName: string) => void;
  isGroupInfoView    : boolean;
  setgGroupInfoView  : (view: boolean) => void;
}


const ChatItem: React.FC<ChatItemProps> = ({
  chat, profile, chatDetails, onClick, isGroupInfoView, setgGroupInfoView
}) => {
  const receiverId    = chat.sender.id === profile.profile.id ? chat.receiver?.id : chat.sender.id;
  const groupId       = chat.group?.id;
  const chatGroupName = chat.group?.name;
  const chatUsername  = chat.sender.username === profile.profile.username ? chat.receiver?.username : chat.sender.username;
  const chatType      : 'user' | 'group' = groupId ? 'group' : 'user';
  const chatId        = groupId || receiverId;
  const chatItemName  = chatType === 'group' ? chatGroupName ?? 'Unknown Group' : chatUsername ?? 'Unknown User';

  const handleChatClick = () => {
    if (!chatId) {
      console.error("Receiver ID or group ID is undefined");
      return;
    }
    onClick(chatType, chatId, chatItemName);
    if (isGroupInfoView) setgGroupInfoView(false);
  };
  

  function isProfileProps(details: ProfileProps | GroupProps | null): details is ProfileProps {
    return (details as ProfileProps)?.profile !== undefined;
  }


  return (
    <div
      key = { chatDetails && (isProfileProps(chatDetails) ? chatDetails.profile.id : chatDetails.id ) }
      className={`
        ${css.forumChatItemDiv} 
        ${
          chatDetails &&
          (
            (isProfileProps(chatDetails) && chatDetails.profile.username === chatItemName ) 
            ||
            (!isProfileProps(chatDetails) && chatDetails.name === chatItemName)
          )
            ? css.forumSelectedChat : ''
            
        }
      `}
      onClick = {handleChatClick}
    >
      <img
        alt       = "forum-chat-user-icon"
        className = {css.forumChatUserIcon}
        src       =  {chat.group ? chat.group.groupIcon : (chat.sender.id === profile.profile.id ? chat.receiver?.profileIcon : chat.sender.profileIcon)}
      />
      <div className={css.forumChatInfoDiv}>
        <div className={css.forumChatInfoChildDiv}>
          <p className={css.forumChatUsername}>
            {chat.group ? chat.group.name : (chat.sender.id === profile.profile.id ? chat.receiver?.username : chat.sender.username)}
          </p>
          <p className={css.forumChatTimestamp}>
            {moment.utc(chat.created).local().startOf('seconds').fromNow()}.
          </p>
        </div>
 
        <div className={css.forumChatLastMsgBadgeDiv}> 
            {/* Text only */}
            {chat.text && chat.files.length === 0 && !chat.plant && !chat.task && (
              <p className={css.forumChatMessage}>{chat.text}</p>
            )}

            {/* Plant only */}
            {chat.plant && (chat.files.length === 0 && !chat.task) && (
              <p className={css.forumChatMessage}>plant ~ {chat.plant.commonName}</p>
            )}

            {/* Task */}
            {chat.task && (chat.files.length === 0 && !chat.plant) && (
              <p className={css.forumChatMessage}>{chat.task.title}</p>
            )}

            {/* File */}
            {chat.files.length > 0 && !chat.plant && !chat.task && (
              <p className={css.forumChatMessage}>
              {
                chat.files.filter(file => getMessageFileFormat(file.file) === 'image').length > 0 &&
                (
                chat.files.filter(file => getMessageFileFormat(file.file) === 'image').length === 1
                  ? '1 Image'
                  : `${chat.files.filter(file => getMessageFileFormat(file.file) === 'image').length} Images`
                )
              }
              {
                chat.files.filter(file => getMessageFileFormat(file.file) === 'image').length > 0 && 
                chat.files.filter(file => getMessageFileFormat(file.file) === 'video').length > 0 && ' . '
              }
              {
                chat.files.filter(file => getMessageFileFormat(file.file) === 'video').length > 0 &&
                (
                chat.files.filter(file => getMessageFileFormat(file.file) === 'video').length === 1
                  ? '1 Video'
                  : `${chat.files.filter(file => getMessageFileFormat(file.file) === 'video').length} Videos`
                )
              }
              </p>
            )}

            {
              (chat.unreadCount > 0) &&
              (
                (isProfileProps(chatDetails) 
                  ? chatDetails.profile.username !== 
                    (chat.group ? chat.group.name : (chat.sender.id === profile.profile.id ? chat.receiver?.username : chat.sender.username)) 
                  : chatDetails?.name !== 
                    (chat.group ? chat.group.name : (chat.sender.id === profile.profile.id ? chat.receiver?.username : chat.sender.username))
                ) && (
                  <p className={css.forumChatUnreadBadge}>
                    {chat.unreadCount > 99 ? '99' : chat.unreadCount}
                  </p>
                )
              )
            }
        </div>
      </div>
    </div>
  );
};

export default ChatItem;