import css from '../Emoji/index.module.css';
import type { EmojiPickerProps } from '../types/index';
import EmojiPicker, {type EmojiClickData} from 'emoji-picker-react';


const EmojiComponent : React.FC<EmojiPickerProps> = ({ onEmojiSelect, isOpen }) => {

    const onEmojiClick = ( emojiIcon : EmojiClickData ) => { onEmojiSelect(emojiIcon.emoji); }

    return(
    <>
        {isOpen && (
            <div className={css.emojiParentDiv}>
                <EmojiPicker onEmojiClick={onEmojiClick}/>
            </div>
        )}
    </>
    );
}

export default EmojiComponent;