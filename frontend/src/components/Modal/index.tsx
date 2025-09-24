import React from "react";
import css from "../Modal/index.module.css";
import type { ModalProps } from '../types/index';


const Modal: React.FC<ModalProps> = ({ profile, isOpen, children }) => {

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