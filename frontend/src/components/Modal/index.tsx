import React from "react";
import { ModalProps } from '../types/index';
import css from "../Modal/index.module.css";


const Modal: React.FC<ModalProps> = ({ profile, isOpen, onClose, children }) => {

    if (!isOpen) return null;

    return (
        <div className={`${css.modalParentDiv} ${css.fadeIn} ${profile.profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}>
            <div className={css.modalParentDiv}>
                <div className={css.modalChildDiv}>
                    <div className={css.modalContentDiv}>{children}</div>
                </div>
            </div>
        </div>
    );
};

export default Modal;