import React from "react";
import css from "../Modal/index.module.css";
import { type ModalProps } from '../types/index'; 
import closeDarkIcon from '../assets/closeDark.svg';
import closeLightIcon from '../assets/closeLight.svg';


const Modal: React.FC<ModalProps> = ({ profile, isOpen, onClose, children }) => {

    if (!isOpen) return null;

    return (
        <div className={`${css.emojiModalParentDiv} ${css.fadeIn} ${profile.profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}>
            <div className={css.emojiModalParentDiv}>
                <div className={css.emojiModalChildDiv}>
                    <button className={`${css.modalCloseBtn} ${css.emojiMobileCloseBtn}`} onClick={onClose}>
                        <img 
                            alt       = "modal-close-icon"
                            className = {css.modalCloseBtnImg} 
                            src       = {profile.profile.displayTheme === 'light' ? closeLightIcon : closeDarkIcon}  
                        />
                    </button>

                    <div className={css.modalContentDiv}>
                        {children}

                        <div className={css.emojiMobileModalBtnDiv}><button className={css.emojiMobileModalBtn} onClick={onClose}>Close</button></div>
                    </div>
                </div>
            </div>
        </div>
      );
};

export default Modal;