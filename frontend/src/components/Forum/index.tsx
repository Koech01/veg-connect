import moment from 'moment';
import EmojiComponent from '../Emoji';
import ChatItem from '../Forum/chatItem';
import css from '../Forum/index.module.css';
import EmojiModal from '../Modal/emojiModal';
import { useAuth } from '../Auth/authContext';
import CreateForum from '../Forum/createForum';
import mediaDarkIcon from '../assets/mediaDark.svg';
import emojiDarkIcon from '../assets/emojiDark.svg';
import { useEffect, useRef, useState } from 'react';
import UploadMediaModal from '../MediaModal/upload'; 
import ViewMediaModal from '../MediaModal/viewMedia';
import emojiLightIcon from '../assets/emojiLight.svg'; 
import mediaLightIcon from '../assets/mediaLight.svg';  
import settingDarkIcon from '../assets/settingDark.svg';
import ChatInboxMessage from '../Forum/chatInboxMessage'; 
import settingLightIcon from '../assets/settingLight.svg';
import ChatListPlaceholder from '../Forum/chatPlaceholder';  
import arrowLeftDarkSvg from '../assets/arrowLeftDark.svg';  
import arrowLeftLightSvg from '../assets/arrowLeftLight.svg';
import infoCircledDarkIcon from '../assets/infoCircledDark.svg'; 
import infoCircledLightIcon from '../assets/infoCircledLight.svg'; 
import dotsVerticalDarkIcon from '../assets/dotsVerticalDark.svg';
import forumSendMsgDarkIcon from '../assets/forumSendMsgDark.svg';
import forumGroupAdminDarkIcon from '../assets/groupAdminDark.svg'; 
import forumSendMsgLightIcon from '../assets/forumSendMsgLight.svg';
import dotsVerticalLightIcon from '../assets/dotsVerticalLight.svg'; 
import forumGroupAdminLightIcon from '../assets/groupAdminLight.svg';
import type { MessageProps, ProfileProps, GroupProps } from '../types/index';


const Forum: React.FC<ProfileProps> = ({ profile, updateProfile }) => {

  const { accessToken }                           = useAuth();
  const [newGroupName, setNewGroupName]           = useState('');
  const [newGroupError, setNewGroupError]         = useState('');
  const [groupEditError, setGroupEditError]       = useState('');
  const [newTextMessage, setNewTextMessage]       = useState<string>('');
  const [searchInput, setSearchInput]             = useState<string>('');
  const [isChatLoading, setChatLoading]           = useState(true);
  const [isMesssageLoading, setMessageLoading]    = useState(true);
  const [isMobileInbox, setMobileInbox]           = useState<boolean>(false);
  const [isChatModalOpen, setChatModalOpen]       = useState<boolean>(false);
  const [isGroupInfoView, setgGroupInfoView]      = useState<boolean>(false);
  const [isUploadModalOpen, setUploadModalOpen]   = useState<boolean>(false);
  const [isViewModalOpen, setViewModalOpen]       = useState<boolean>(false);
  const [isEmojiModalOpen, setEmojiModalOpen]     = useState<boolean>(false);
  const [chats, setChats]                         = useState<MessageProps[]>([]);
  const [chatSearchUsers, setChatSearchUsers]     = useState<ProfileProps[]>([]);
  const [filterSearchUsers, setFilterSearchUsers] = useState<ProfileProps[]>([]);
  const [chatNewGroup, setChatNewGroup]           = useState<GroupProps[]>([]);
  const [filteredNewGroups, setFilteredNewGroups] = useState<GroupProps[]>([]);
  const [messages, setMessages]                   = useState<MessageProps[]>([]);
  const [filteredChats, setFilteredChats]         = useState<MessageProps[]>([]);
  const [selectedChatId, setSelectedChatId]       = useState<number | null>(null);
  const webSocketRef                              = useRef<WebSocket | null>(null);
  const chatEndRef                                = useRef<HTMLDivElement | null>(null);
  const [chatDetails, setChatDetails]             = useState<ProfileProps | GroupProps | null>(null);
  const [groupEditMode, setGroupEditMode]         = useState(false);
  const [selectedGroupIcon, setSelectedGroupIcon] = useState<File | null>(null);
  const [groupAutoJoin, setGroupAutoJoin]         = useState<boolean>(false);
  const [clickedMedia, setClickedMedia]           = useState({ fileUrl: '', fileType: 'image' });


  const handleMediaClick = (fileUrl: string, fileType: 'image' | 'video') => {
    setClickedMedia({ fileUrl, fileType });
    setViewModalOpen(true);
  };


  const toggleGroupEditingMode = () => { setGroupEditMode(!groupEditMode); };


  const handleGroupIconChange = () => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleGroupUpdate = async (groupId: number) => {
    const formData         = new FormData();
    const groupName        = !isProfileProps(chatDetails) && chatDetails?.name ? chatDetails.name : '';
    const groupDescription = !isProfileProps(chatDetails) && chatDetails?.description ? chatDetails.description : '';

    formData.append('groupName', groupName);
    formData.append('groupDescription', groupDescription);

    if (selectedGroupIcon) {
      formData.append('groupIcon', selectedGroupIcon);
    }
    
    try { 
      const response = await fetch(`/api/v1/groups/${groupId}/update/`, {
        method      : 'PATCH',
        headers : { Authorization: `Bearer ${accessToken}` },
        credentials : 'include',
        body        : formData,
      });

      if (response.ok) { 
        const data = await response.json();
        setChatDetails({
          id          : data.id, 
          groupIcon   : data.groupIcon, 
          name        : data.name, 
          description : data.description, 
          admins      : data.admins,
          members     : data.members, 
          request     : data.request,
          autoJoin    : data.autoJoin,
          created     : data.created
        });
        setGroupEditMode(false);
      }

      else {
        const data = await response.json();
        setGroupEditError(data.error); 
        setTimeout(() => { setGroupEditError(''); }, 4000); 
      }

    }

    catch (error) { console.error('An error occurred. Please try again later: ', error); }
  } 


  const fetchChats = async () => {
    try { 
      const response = await fetch('/api/v1/chats/', {
        method      : 'GET',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials : 'include',
      });
  
      if (response.ok) {
        const data                              = await response.json();
        const chatListMessages : MessageProps[] = data.chatMessages;
        const chatListNewGroup : GroupProps[]   = data.chatGroups;
        const chatListSearchUsers = data.chatProfiles.map((user: any) => ({
          profile: {
            id           : user.id,
            username     : user.username,
            profileIcon  : user.profileIcon,
            newChat      : user.newChat,
            visibility   : user.visibility,
          }
        }));
        setChats(chatListMessages);      
        setChatSearchUsers(chatListSearchUsers);
        setChatNewGroup(chatListNewGroup);
        setChatLoading(false);
      }
      else { console.error('Failed to fetch chats: ', response.status) }
    }
    catch (error) { console.error('Error fetching chats: ', error) }
  };


  useEffect(() => { fetchChats(); }, []);


  useEffect(() => {
    if (searchInput) {
      const chatSearchResult = chats.filter(
        chat => {
          const searchName = chat.group 
            ? chat.group.name 
            : (chat.sender.id === chat.user?.id ? chat.receiver?.username : chat.sender.username);
          return searchName?.toLowerCase().includes(searchInput.toLowerCase());
        }
      );
      setFilteredChats(chatSearchResult);

      const filteredUserList = chatSearchUsers.filter(user =>
        user?.profile?.username.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilterSearchUsers(filteredUserList);

      const filteredGroupList = chatNewGroup.filter(group =>
        group?.name.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredNewGroups(filteredGroupList);
    } 
    else { 
      setFilteredChats(chats);
      setFilterSearchUsers(chatSearchUsers);
      setFilteredNewGroups(chatNewGroup);
    }
  }, [searchInput, chats, setFilterSearchUsers, chatNewGroup]);


  const handleChatClick = async(chatType: 'user' | 'group', chatId: number) => {
    setSelectedChatId(chatId);
    fetchChatMessages(chatType, chatId);
    fetchChats();
    setMobileInbox(true);
  };
   

  const handleCreateGroup = async () => {

    try {
      const response = await fetch('/api/v1/groups/create/', {
        method      : 'POST',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body        : JSON.stringify({ newGroupName: newGroupName }),
        credentials : 'include'
      });

      if (response.ok) {
        const group = await response.json();
        if (searchInput !== '') { setSearchInput(''); }
        setSelectedChatId(null);
        setChatDetails(null);
        fetchChats();
        setNewGroupName('');
        handleChatClick('group', group.id);
      }
      else {
        const data = await response.json();
        setNewGroupError(data.error);
        setNewGroupName(''); 
        setTimeout(() => { setNewGroupError(''); }, 4000); 
      }

    }
    catch (error) { console.error("An error occurred. Please try again later: ", error); }
  };
 

  const fetchChatMessages = async(chatType: 'user' | 'group', chatId: number) => {
 
    try {
      const response = await fetch(`/api/v1/messages/${chatType}/${chatId}/`, {
        method      : 'PATCH',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials : 'include'
      });
  
      if (response.ok) {
        const data                          = await response.json();
        const chatMessages : MessageProps[] = data.chatMessages;
        const newChatUser                   = data.newChatUser; 
        const newGroup                      = data.emptyChatGroup;
        setMessages(chatMessages);     
     
        if (chatType === 'user' && chatMessages && !newChatUser) {

          const sender   = chatMessages[0].sender;
          const receiver = chatMessages[0].receiver;

          if (sender && receiver) { 
            const chatUserData = sender.id === profile.id ? receiver : sender;
            setChatDetails({
              profile: {
                id           : chatUserData.id,
                username     : chatUserData.username,
                firstName    : "",
                lastName     : "",
                email        : "",
                profileIcon  : chatUserData.profileIcon,
                displayTheme : "",
                newChat      : false,
                visibility   : false,
                receiveMails : false,
                climate      : { country : '', name : '', precipitationClass : '' },
                created      : ""
              },
              updateProfile: () => {}
            });
          } else {
            console.error('Sender or Receiver is undefined');
          }  
        }

        else if (chatType === 'user' && !chatMessages && newChatUser) { 
          setChatDetails({
            profile: {
              id           : newChatUser.id,
              username     : newChatUser.username,
              firstName    : "",
              lastName     : "",
              email        : "",
              profileIcon  : newChatUser.profileIcon,
              displayTheme : "",
              newChat      : false,
              visibility   : false,
              receiveMails : false,
              climate      : { country : '', name : '', precipitationClass : '' },
              created      : ""
            },
            updateProfile: () => {}
          });

        }

        else if (chatType === 'group' && chatMessages && !newGroup) {
          const groupData = chatMessages[0].group; 
          if (groupData) {
            setChatDetails({
              id          : groupData.id, 
              groupIcon   : groupData.groupIcon, 
              name        : groupData.name, 
              description : groupData.description, 
              admins      : groupData.admins,
              members     : groupData.members, 
              request     : groupData.request,
              autoJoin    : groupData.autoJoin,
              created     : groupData.created
            });
          }
        }

        else if (chatType === 'group' && !chatMessages && newGroup) {
          if (newGroup) {
            setChatDetails({
              id          : newGroup.id, 
              groupIcon   : newGroup.groupIcon, 
              name        : newGroup.name, 
              description : newGroup.description, 
              admins      : newGroup.admins,
              members     : newGroup.members, 
              request     : newGroup.request,
              autoJoin    : newGroup.autoJoin,
              created     : newGroup.created
            });
          }
        }

        setMessageLoading(false);
      }
      else { console.error('Failed to fetch chats: ', response.status); }
    } catch (error) { console.error('Error fetching messages:', error); }
  };


  const isProfileProps = (chatDetails: ProfileProps | GroupProps | null): chatDetails is ProfileProps => {
    return (chatDetails as ProfileProps).profile !== undefined;
  };


  useEffect(() => {
    if (selectedChatId !== null) {
      const senderId   = profile.id;
      const receiverId = selectedChatId;
      let chatType     = 'user';

      if      (chatDetails && isProfileProps(chatDetails)) { chatType = 'user'; }
      else if (chatDetails && !isProfileProps(chatDetails)) { chatType = 'group'; } 
      else    { console.error('Chat details are not available or invalid'); }

      const sessionUrl = `ws://127.0.0.1:8000/v1/ws/chat/${chatType}/${senderId}/${receiverId}/`;

      const ws = new WebSocket(sessionUrl);
      webSocketRef.current = ws;

      ws.onopen = () => { console.log('WebSocket connection established'); };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (chatType === 'user' && data.type === 'userChatMessage') {
          const newMessage: MessageProps = data.message;

          setMessages((prevMessages) => {
            if (prevMessages) { return [...prevMessages, newMessage];} 
            else {
              if (searchInput !== '') { setSearchInput(''); }
              fetchChats();
              return [newMessage];
            }
          });

          setChats((prevChats) =>
            prevChats.map((chat) =>
              (chat.sender.id === newMessage.sender.id && chat.receiver?.id === newMessage.receiver?.id) ||
              (chat.sender.id === newMessage.receiver?.id && chat.receiver?.id === newMessage.sender.id)
                ? { ...chat, text: newMessage.text, files: newMessage.files, created: newMessage.created }
                : chat
            )
          );
        } 

        else if (chatType === 'group' && data.type === 'groupChatMessage') {
          const newGroupMessage: MessageProps = data.message;
          setMessages((prevMessages) => {
            if (prevMessages) { return [...prevMessages, newGroupMessage];} 
            else {
              if (searchInput !== '') { setSearchInput(''); }
                fetchChats();
                return [newGroupMessage];
            }
          });

          setChats((prevChats) =>
            prevChats.map((chat) =>
              (chat.group?.id === newGroupMessage.group?.id || chat.group?.name === newGroupMessage.group?.name) 
                ? { ...chat, text: newGroupMessage.text, files: newGroupMessage.files, created: newGroupMessage.created}
                : chat
            )
          );
        }

      };

      ws.onclose = () => { console.log('WebSocket connection closed.');  };

      return () => { ws.close(); };
    }
  }, [selectedChatId, profile, chatDetails]);

  
  const sendTextMessage = () => {
    if (newTextMessage.trim() && webSocketRef.current) {
      webSocketRef.current.send(JSON.stringify({ 'message': newTextMessage }));
      setNewTextMessage('');
    }
  };


  const sendMediaMessage = async( textMessage : string, files : File[] ) => {
    if (files.length > 0 && webSocketRef.current) {
      const filePromises = files.map(async (file) => {
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onloadend = () => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result,
            });
          };
          reader.readAsDataURL(file);
        });
      });
  
      const base64Files = await Promise.all(filePromises);
      
      webSocketRef.current.send(JSON.stringify({ 'message': textMessage, 'files': base64Files }));
    }
  };


  const handleClearChat = async(chatType: 'user' | 'group', chatId: number) => {
 
    try {
      const response = await fetch(`/api/v1/messages/${chatType}/${chatId}/delete/`, {
        method      : 'PATCH',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials : 'include'
      });
  
      if (response.ok) {
        setChatModalOpen(false);
        setSelectedChatId(null);
        setChatDetails(null);
        fetchChats();
      }
      else { console.error('Failed to clear chats: ', response.status); }
    } catch (error) { console.error('Error clearing chats:', error); }
  };


  const handleGroupRequest = async (
    requestType : 'accept' | 'decline' | 'elevate' | 'remove' | 'exit' | 'demote', 
    groupId     : number, 
    profileId   : number
  ) => {
 
    try {
      const response = await fetch(`/api/v1/groups/${requestType}/${groupId}/${profileId}/request/`, {
        method      : 'PATCH',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials : 'include',
      });
  
      if (response.ok) { 
        if (requestType === 'exit') {
          setSelectedChatId(null);
          setChatDetails(null);
        }
        fetchChatMessages('group', groupId); 
        fetchChats();
      } 
      else { console.error('Failed adding user to group:', response.status); }
    } 
    catch (error) { console.error('Error adding user to group:', error); }
  };
  

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior : 'smooth' })
    }
  }, [messages]);


  useEffect(() => {
    if (chatDetails && !isProfileProps(chatDetails)) {
      setGroupAutoJoin(chatDetails.autoJoin);
    }
  }, [chatDetails]);


  const handleGroupAutoJoin = async (groupId: number, autoJoinVal: string) => {
    try { 
      const response = await fetch(`/api/v1/groups/${groupId}/${autoJoinVal}/auto/join/`, {
        method      : 'PATCH',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials : 'include'
      });

      if (response.ok) {
        const groupData = await response.json(); 
        setGroupAutoJoin(groupData.autoJoin);  
      } 
      
      else { console.error('Failed to update group auto join feature: ', response.status); }
    } 
    
    catch (error) { console.error('Error updating auto join feature:', error); }
  };


  const addEmojiMessage          = ( emoji:string ) => { setNewTextMessage((prevMessage) => prevMessage + emoji); }
  const handleMediaModalBtnClick = () => {  setUploadModalOpen(true); };
  const closeMediaModal          = () => {  setUploadModalOpen(false); };
  const closeViewMediaModal      = () => {  setViewModalOpen(false); };

  const handleEmojiModalBtnClick = () => { setEmojiModalOpen(true); };
  const CloseEmojiModal          = () => { setEmojiModalOpen(false); }

  const handleDelChatModalClick  = () => setChatModalOpen(true);
  const closeDeleteChatModal     = () => setChatModalOpen(false);


  return (
    <div className={`${css.forumParentDiv} ${profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}>
      <div className={css.forumParentDiv}>

        <div className={css.forumChildDiv}>
          <div className={`${css.forumChatListDiv} ${isMobileInbox ? css.forumMobileHideInboxDiv : '' }`}>

            <div className={css.forumChatSearchDiv}>
              <input 
                type        = "text" 
                placeholder = "Search"
                value       = {searchInput}
                className   = {css.forumChatSearchUserInput} 
                onChange    = {(e) => setSearchInput(e.target.value)}
              />
            </div>
            
            <div className={`${css.forumChatListItemDiv} ${css.fadeIn}`}> 
              {searchInput && ( 
                <CreateForum 
                  error             = {newGroupError}
                  newGroupName      = {newGroupName}   
                  setNewGroupName   = {setNewGroupName}
                  handleCreateGroup = {handleCreateGroup} 
                  profile           = {{ profile: profile, updateProfile: updateProfile }} 
                /> 
              )}

              {isChatLoading ? (
                <div className={css.forumChatListShimmerDiv}> 
                  {Array.from({ length: 9 }, (_, index) => (
                    <div key={index} className={css.forumChatItemShimmerDiv}>
                      <div className={css.forumChatUserShimmerIcon}></div>

                      <div className={css.forumChatFlexShimmerDiv}>
                        <div className={`${css.forumChatUserShimmerItem} ${css.forumChatNameShimmerOne}`}></div>
                        <div className={`${css.forumChatUserShimmerItem} ${css.forumChatNameShimmerTwo}`}></div>
                    </div>
                    </div>
                  ))} 
                </div>
              ) : (
                <>
                  {!searchInput && chats.length === 0 && filteredChats.length === 0 && filteredNewGroups.length === 0 ? (

                    <ChatListPlaceholder 
                      label   = "Inbox" 
                      info    =  "Quiet here. Start a chat !"  
                      iconSrc = {profile.displayTheme === 'light' ? infoCircledLightIcon : infoCircledDarkIcon} 
                    />

                  ) : searchInput && filteredChats.length === 0 && filterSearchUsers.length === 0 && filteredNewGroups.length === 0 ? (

                    <ChatListPlaceholder 
                      label   = "Inbox" 
                      info    = "No match found." 
                      iconSrc = {profile.displayTheme === 'light' ? infoCircledLightIcon : infoCircledDarkIcon} 
                    />

                  ) : filteredChats.length > 0 ? (
                    filteredChats.map((chat) => (
                      <ChatItem
                        chat              = {chat}
                        key               = {chat.id}
                        chatDetails       = {chatDetails}
                        isGroupInfoView   = {isGroupInfoView}
                        setgGroupInfoView = {setgGroupInfoView}
                        profile           = {{ profile: profile, updateProfile: updateProfile }} 
                        onClick           = {(chatType, chatId) => handleChatClick(chatType, Number(chatId))}
                      />
                    ))
                  ) : null}
    
                  {searchInput && filterSearchUsers.length > 0 ? (
                    filterSearchUsers.map((user) => ( 
                      <div 
                        key       = {user.profile.id} 
                        className = {`${css.forumChatItemDiv} ${selectedChatId === user.profile.id ? css.forumSelectedChat : ''}`}
                        onClick   = {() => {
                          handleChatClick('user', user.profile.id);
                          if (isGroupInfoView) { setgGroupInfoView(false); }
                        }}
                      >
                        <img alt="forum-chat-user-icon"className={css.forumChatUserIcon} src={user.profile.profileIcon}/>

                        <div className={css.forumChatInfoDiv}>
                        <div className={css.forumChatInfoChildDiv}> 
                          <p className={css.forumChatUsername}>{user.profile.username}</p>
                        </div>

                        <p className={css.forumChatMessage}>start a chart now !</p>
                        </div>
                      </div>
                      ))
                  ) : null}

                  {filteredNewGroups.length > 0 ? ( 
                    filteredNewGroups.map((group) => (
                                    
                      <div 
                        key       = {group.id} 
                        className = {`${css.forumChatItemDiv} ${selectedChatId === group.id ? css.forumSelectedChat : ''}`}
                        onClick   = {() => {
                          handleChatClick('group', group.id);
                          if (isGroupInfoView) { setgGroupInfoView(false); }
                        }}
                      >
                        <img alt="forum-chat-user-icon"className={css.forumChatUserIcon} src={group.groupIcon}/>

                        <div className={css.forumChatInfoDiv}>
                          <div className={css.forumChatInfoChildDiv}> 
                            <p className={css.forumChatUsername}>{group.name}</p>
                            <p className={css.forumChatTimestamp}>
                              {moment.utc(group.created).local().startOf('seconds').fromNow()}
                            </p>
                          </div>
                          <div className={css.forumChatLastMsgBadgeDiv}> 
                            {group.members.length > 0 && (
                              <p className={css.forumChatMessage}>
                                {(group.members?.length || 0)} ~ {(group.members?.length === 1 ? 'member' : 'members')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : null}
                </>
              )}

            </div>
          </div>

          <div className={`${css.forumInboxDiv} ${!isMobileInbox ? css.forumMobileHideInboxDiv : '' }`}>
            <div className={css.forumBarUserDiv}>
              { chatDetails && typeof selectedChatId === 'number' && selectedChatId !== null && (
                <>
                  <div className={css.forumBarUserIconDiv}>
                    <button 
                      className = {css.forumBarBackBtn} 
                      onClick   = {() => {
                        setChatDetails(null);
                        setSelectedChatId(null);
                        setMobileInbox(false);
                      }}
                    >
                      <img 
                        alt       = "forum-back-icon"
                        className = {css.forumChatOptionIcon} 
                        src       = {profile.displayTheme === 'light' ? arrowLeftLightSvg : arrowLeftDarkSvg}   
                      />
                    </button>

                    <img 
                      alt       = "forum-bar-user-icon"
                      className = {`${css.forumBarUserIcon} ${!isProfileProps(chatDetails) ? css.forumBarGroupIcon : ''}`}
                      onClick   = {() => { if (!isProfileProps(chatDetails)) { setgGroupInfoView(!isGroupInfoView); } }}
                      src       = {isProfileProps(chatDetails) ? 
                        chatDetails.profile.profileIcon  
                        : 
                        selectedGroupIcon ? URL.createObjectURL(selectedGroupIcon) : chatDetails.groupIcon
                      } 
                    />

                    {isProfileProps(chatDetails) ? (
                      <p className={css.forumBarUsername}>{chatDetails.profile.username}</p>
                    ) : (
                      <> 
                        {groupEditMode ? (
                          <button className={css.forumEditGroupInfoBtn}>
                            <span className={css.profileEditUploadImgSpan} onClick={handleGroupIconChange}>upload</span>

                            <input
                              type     = "file"
                              accept   = "image/jpeg, image/png, image/gif"
                              style    = {{ display: 'none' }}
                              onChange = {(e) => {
                                const selectedIcon = e.target.files?.[0];
                                if (selectedIcon) { setSelectedGroupIcon(selectedIcon); }
                              }}
                            />
                          </button>
                        ) : (
                          <div className={css.forumBarGroupInfo}>
                            <p className={css.forumBarUsername}>{chatDetails.name}</p>
                            <p className={css.forumBarGroupUserCount}>~</p>
                            <p className={css.forumBarGroupUserCount}>
                              {chatDetails.members.length} {chatDetails.members.length === 1 ? 'member' : 'members'}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {messages && (
                    <button onClick={handleDelChatModalClick} className={css.forumChatOptionBtn}>
                      <img 
                        alt       = "forum-chat-option-icon"
                        className = {css.forumChatOptionIcon} 
                        src       = {profile.displayTheme === 'light' ? dotsVerticalLightIcon : dotsVerticalDarkIcon}  
                      />
                    </button>
                  )}
                </>
              )}
            </div>

            {!isGroupInfoView ? (
              <>
                {isMesssageLoading ? ( 
                  typeof selectedChatId === 'number' && selectedChatId !== null ? (
                    <div className={css.forumShimmerMessagesDiv}>
                      <div className={`${css.forumShimmerMessageItemDiv} ${css.forumShimmerMessageProfileDiv}`}>
                        <div className={`${css.forumMessageShimmer} ${css.forumShimmerTextDiv}`}></div>
                        <div className={`${css.forumMessageShimmer} ${css.forumShimmerTimeDiv}`}></div>
                      </div>

                      <div className={`${css.forumShimmerMessageItemDiv} ${css.forumShimmerMessageUserDiv}`}>
                        <div className={css.forumShimmerFlexUserDiv}>
                          <div className={`${css.forumMessageShimmer} ${css.forumShimmerIconDiv}`}></div>
                          <div className={`${css.forumMessageShimmer} ${css.forumShimmerNameDiv}`}></div>
                          <div className={`${css.forumMessageShimmer} ${css.forumShimmerUserTimeDiv}`}></div>
                        </div>

                        <div className={`${css.forumMessageShimmer} ${css.forumShimmerImageDiv}`}></div>
                      </div>
                    </div>
                  ) : (
                    <div className={css.forumInboxMessagesDiv}></div>
                  )
                ) : (
                  <ChatInboxMessage
                    messages       = {messages}
                    profile        = {{ profile: profile, updateProfile: updateProfile }} 
                    chatDetails    = {chatDetails}
                    selectedChatId = {selectedChatId}
                    onMediaClick   = {handleMediaClick}
                    chatEndRef     = {chatEndRef}
                  />
                )}
           
                <div className={css.forumInboxSubmitParentDiv}>
                  { typeof selectedChatId === 'number' && selectedChatId !== null && (
                    <>
                      <button 
                        onClick   = {handleMediaModalBtnClick}
                        className = {`${css.forumSendMsgIconBtn} ${css.fadeIn}`}
                      >
                        <img 
                          alt       = "forum-chat-send-icon"
                          className = {css.forumSendMsgIcon} 
                          src       = {profile.displayTheme === 'light' ? mediaLightIcon : mediaDarkIcon}  
                        /> 
                      </button>

                      <input 
                        type        = "text" 
                        value       = {newTextMessage}
                        placeholder = "Send a message..." 
                        className   = {css.forumInboxInput}
                        onChange    = {(e) => setNewTextMessage(e.target.value)}
                      />

                      <button 
                        onClick   = {handleEmojiModalBtnClick}
                        className = {css.forumSendMsgIconBtn}
                      >

                        <img 
                          alt       = "forum-chat-emoji-icon"
                          className = {css.forumSendMsgIcon} 
                          src       = {profile.displayTheme === 'light' ? emojiLightIcon : emojiDarkIcon}  
                        /> 
                      </button>

                      <button className={css.forumSendMsgIconBtn} onClick={sendTextMessage}>
                        <img 
                          alt       = "forum-chat-send-icon"
                          className = {css.forumSendMsgIcon} 
                          src       = {profile.displayTheme === 'light' ? forumSendMsgLightIcon : forumSendMsgDarkIcon}  
                        /> 
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className={css.forumGroupInfoParentDiv}>
                {chatDetails && typeof selectedChatId === 'number' && selectedChatId !== null && (
                  <>
                    {!isProfileProps(chatDetails) && chatDetails?.admins.some(admin => admin.id === profile.id) && (
                      <div className={css.forumGroupInfoAboutDiv}>
                        <div className={css.forumGroupInfoAboutHeaderDiv}>
                          <p className={css.forumGroupInfoAboutText}>Allow users to auto join the group.</p>

                          <div className={css.forumGroupRadioBtnDiv}>
                            <label className={css.forumGroupRadioLabel}>
                              <input 
                                type     = "checkbox"
                                checked  = {groupAutoJoin}
                                onChange = {() => {
                                  const groupId = !isProfileProps(chatDetails) && chatDetails?.id;
                                  if (typeof groupId === 'number') {
                                    const newAutoJoinVal = !groupAutoJoin ? 'true' : 'false';  
                                    handleGroupAutoJoin(groupId, newAutoJoinVal);
                                  }
                                }}
                              />
                              <span className={css.forumGroupRadioSpan}></span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={css.forumGroupInfoAboutDiv}>
                      <div className={css.forumGroupInfoAboutHeaderDiv}>
                        {groupEditError ?    
                          <p className={css.forumGroupInfoError}>{groupEditError}</p> 
                        :  
                          <p className={css.forumGroupInfoAboutHeader}>About</p>
                        } 
                         
                        {!isProfileProps(chatDetails) && chatDetails?.admins.some(admin => admin.id === profile.id) && (
                          <button className={css.forumEditGroupInfoBtn} onClick={toggleGroupEditingMode}>
                            <img 
                              className = {css.profileEditSvg}  
                              alt       = "forum-setting-light-icon"
                              src       = {profile.displayTheme === 'light' ? settingLightIcon : settingDarkIcon} 
                            />
                            Change
                          </button>
                        )}
                      </div>
                      { groupEditMode ? (

                        <div className={css.forumEditGroupInfoDiv}>
                          <input 
                            type        = "text" 
                            placeholder = 'Name'
                            className   = {css.forumEditGroupInput} 
                            value       = {!isProfileProps(chatDetails) && chatDetails?.name ? chatDetails.name : ''}
                            onChange    = {(e) => {
                              if (!isProfileProps(chatDetails)) { setChatDetails({ ...chatDetails, name: e.target.value }); }
                            }}
                          />

                          <textarea 
                            rows        = {4} 
                            placeholder = 'About'
                            className   = {css.forumEditGroupTextarea} 
                            value       = {!isProfileProps(chatDetails) && chatDetails?.description ? chatDetails.description : ''}
                            onChange    = {(e) => {
                              if (!isProfileProps(chatDetails)) { setChatDetails({ ...chatDetails, description: e.target.value }); }
                            }}
                          ></textarea>

                          <button 
                            className={css.forumEditGroupSaveBtn}
                            onClick={() => {
                              const groupId = !isProfileProps(chatDetails) && chatDetails?.id ? chatDetails.id : undefined;
                              if (groupId !== undefined) { handleGroupUpdate(groupId); }
                            }}
                          >Save</button>
                        </div> 
 
                      ) : (
                        <p className={css.forumGroupInfoAboutText}>{!isProfileProps(chatDetails) && chatDetails?.description ? chatDetails.description : ''}</p>
                      )}
                    </div>
 
                    {
                      !isProfileProps(chatDetails) && chatDetails.request.length > 0 &&
                      !isProfileProps(chatDetails) && chatDetails?.admins.some(admin => admin.id === profile.id) &&
                    (
                    <div className={css.forumGroupInfoListDiv}>
                      <p className={css.forumGroupInfoListHeader}>Requests</p>
                      {chatDetails.request.map((member) => (
                        <div key={member.id} className={css.forumGroupInfoItemDiv}>
                          <img className={css.forumGroupInfoUserIcon} src={member.profileIcon} alt={`${member.username}'s icon`}/>
                          <p className={css.forumGroupInfoUsername}>{member.username}</p>
                          
                          {chatDetails.members.some(user => user.id !== member.id) && (
                            <button 
                              className = {css.forumGroupInfoPositiveBtn} 
                              onClick   = {() => handleGroupRequest('accept', chatDetails.id, member.id)}
                            >Accept</button>
                          )}

                          {chatDetails.members.some(user => user.id !== member.id) && (
                            <button 
                              className = {css.forumGroupInfoBtn} 
                              onClick   = {() => handleGroupRequest('decline', chatDetails.id, member.id)}
                            >Decline</button>
                          )}
                        </div>
                      ))}
                    </div>
                    )}

                    <div className={css.forumGroupInfoListDiv}>
                      <p className={css.forumGroupInfoListHeader}>Members</p>
                      {!isProfileProps(chatDetails) && 
                        chatDetails.members
                          .sort((a, b) => {
                            const userAdmin  = chatDetails.admins.some(admin => admin.id === a.id) ? 1 : 0;
                            const userMember = chatDetails.admins.some(admin => admin.id === b.id) ? 1 : 0;
                            return userMember - userAdmin;
                          })
                          .map((member) => (
                            <div key={member.id} className={css.forumGroupInfoItemDiv}>
                              <img className={css.forumGroupInfoUserIcon} src={member.profileIcon} alt={`${member.username}'s icon`}/>
                              <p className={css.forumGroupInfoUsername}>{member.username}</p>
                        
                              {
                                chatDetails.admins.some(admin => admin.id === member.id && chatDetails.admins.length > 1) && 
                                chatDetails.admins.some(admin => admin.id === profile.id) &&
                                (
                                <>
                                  <img 
                                    alt       = "forum-admin-pin"
                                    className = {css.forumGroupInfoAdminPin}   
                                    src       = {profile.displayTheme === 'light' ? forumGroupAdminLightIcon : forumGroupAdminDarkIcon}  
                                  />

                                  <button 
                                    className = {`${css.forumGroupInfoBtn} ${css.hideGroupInfoBtn}`}
                                    onClick   = {() => handleGroupRequest('demote', chatDetails.id, member.id)}
                                  >Demote</button>
                                </>
                              )}

                              {
                                !chatDetails.admins.some(admin => admin.id === member.id) && 
                                chatDetails.admins.some(admin => admin.id === profile.id) &&
                               (
                                <button 
                                  className = {`${css.forumGroupInfoPositiveBtn} ${css.hideGroupInfoBtn}`}
                                  onClick   = {() => handleGroupRequest('elevate', chatDetails.id, member.id)}
                                >Make admin</button>
                              )}
                              
                              {
                                chatDetails.admins.some(admin => admin.id === profile.id) &&
                                (
                                  <button
                                    className={ `${css.forumGroupInfoBtn} ${css.hideGroupInfoBtn}` }
                                    onClick={() =>
                                      member.id === profile.id
                                        ? handleGroupRequest('exit', chatDetails.id, member.id)
                                        : handleGroupRequest('remove', chatDetails.id, member.id)
                                    }
                                  >
                                    {member.id === profile.id ? 'Exit' : 'Remove'}
                                  </button>
                                )
                              }

                              {
                                member.id === profile.id && 
                                !chatDetails.admins.some(admin => admin.id === profile.id) && 
                                (
                                  <button
                                    className={`${css.forumGroupInfoBtn} ${css.hideGroupInfoBtn}`}
                                    onClick={() =>
                                      member.id === profile.id
                                        ? handleGroupRequest('exit', chatDetails.id, member.id)
                                        : handleGroupRequest('remove', chatDetails.id, member.id)
                                    }
                                  >Exit</button>
                                )
                              }
                            </div>
                          ))
                      }
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upload Media Modal */}
        <UploadMediaModal  
          profile       = {{ profile: profile, updateProfile: updateProfile }} 
          isOpen        = {isUploadModalOpen} 
          onClose       = {closeMediaModal}
          onSendMessage = {sendMediaMessage}
        />

        {/* View Media Modal */}
        <ViewMediaModal  
          profile   = {{ profile: profile, updateProfile: updateProfile }} 
          mediaUrl  = {clickedMedia.fileUrl}
          mediaType = {clickedMedia.fileType as 'image' | 'video'}
          isOpen    = {isViewModalOpen} 
          onClose   = {closeViewMediaModal}
        />

        {/* Emoji Modal */}
        <EmojiModal profile={{ profile: profile, updateProfile: updateProfile }} isOpen={isEmojiModalOpen} onClose={CloseEmojiModal}>
          <div className={css.forumModalEmojiDiv}>
            <EmojiComponent onEmojiSelect={addEmojiMessage} isOpen={isEmojiModalOpen}/>
          </div>
        </EmojiModal>

        {/* Delete Chat Modal */}
        { isChatModalOpen && (
          <div 
            className={`    
              ${css.forumModalClearChatModalParentDiv}  
              ${css.fadeIn}
              ${profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}
            `}
            >
            <div className={css.forumModalClearChatDiv}>
              <div className={css.forumModalClearChatChildDiv}>
                { chatDetails && typeof selectedChatId === 'number' && selectedChatId !== null && (
                  <>
                    {isProfileProps(chatDetails) && (
                      <div className={css.forumModalClearChatIconDiv}>
                        <img className={css.forumModalClearChatIcon} src={profile.profileIcon} alt="forum-modal-delete-chat-icon"/>
                        <img className={css.forumModalClearChatIcon} src={chatDetails.profile.profileIcon} alt="forum-modal-delete-chat-icon"/>
                      </div>
                    )
                    }

                    {!isProfileProps(chatDetails) && (
                      <div className={css.forumModalClearChatIconDiv}>
                        <img className={css.forumModalClearChatIcon} src={profile.profileIcon} alt="forum-modal-delete-chat-icon"/>
                        <img className={css.forumModalClearChatIcon} src={chatDetails.groupIcon} alt="forum-modal-delete-chat-icon"/>
                      </div>
                    )
                    }
                  </>
                )}

                <p className={css.forumModalClearChatCount}>
                  {messages.length} {messages.length === 1 ? 'messsage' : 'messsages'}.
                </p>
              </div>

              <div>
                <p className={css.forumModalClearChatText}>Confirm to delete this conversation and all messages.</p>
              </div>

              <div className={css.forumModalChatBtnDiv}>
                <button className={css.forumModalChatConfirmBtn} 
                  onClick = {() => {
                    const chatType = isProfileProps(chatDetails) ? 'user' : 'group';
                    const chatId   = isProfileProps(chatDetails) ? chatDetails.profile.id : chatDetails?.id!;
                    handleClearChat(chatType, chatId);
                  }}
                >confirm</button>
                <button className={css.forumModalChatCancelBtn} onClick={closeDeleteChatModal}>cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;