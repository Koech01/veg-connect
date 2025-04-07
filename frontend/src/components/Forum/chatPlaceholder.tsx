import css from '../Forum/index.module.css';
 

interface ChatListPlaceholderProps {
    label   : string;
    info    : string;
    iconSrc : string;
}
 
const ChatListPlaceholder: React.FC<ChatListPlaceholderProps> = ({ label, info, iconSrc }) => (
    <div className={css.forumNoChatParentDiv}>
        <div className={css.forumNoChatIconDiv}>
            <img className={css.forumNoChatIcon} src={iconSrc} alt="forum-chat-user-icon"/>
        </div>

        <div className={css.forumNoChatTextDiv}>
            <p className={css.forumNoChatLabel}>{label}</p>
            <p className={css.forumNoChatInfo}>{info}</p>
        </div>
    </div>
);

export default ChatListPlaceholder;