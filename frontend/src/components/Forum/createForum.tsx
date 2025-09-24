import React from 'react';
import css from '../Forum/index.module.css';
import { type ProfileProps } from '../types/index';
import forumNewGroupDarkIcon from '../assets/forumNewGroupDark.svg';
import forumNewGroupLightIcon from '../assets/forumNewGroupLight.svg';
import forumCreateGroupDarkIcon from '../assets/forumCreateGroupDark.svg';
import forumCreateGroupLightIcon from '../assets/forumCreateGroupLight.svg';


interface CreateForumProps {
    error             : string;
    newGroupName      : string;  
    handleCreateGroup : () => void;
    profile           : ProfileProps;
    setNewGroupName   : React.Dispatch<React.SetStateAction<string>>;
}

const CreateForum: React.FC<CreateForumProps> = ({ 
    error, 
    profile,
    newGroupName,
    setNewGroupName,
    handleCreateGroup
}) => {

    const placeholder = error || 'Name';
     
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       if (error) { setNewGroupName(''); } 
       else       { setNewGroupName(e.target.value); }
    };

    return (
        <div className={css.forumCreateParentDiv}>
            <input 
                type        = "text" 
                placeholder = {placeholder}
                value       = {newGroupName} 
                onChange    = {handleChange}
                className   = {`${css.forumCreateNameInput} ${error ? css.forumCreateNameError : ''}`} 
            />

            <div className={css.forumCreateChildDiv}>
                <div className={css.forumCreateIconDiv}>
                    <img 
                        className = {css.forumCreateIcon}  
                        alt       = "forum-create-new-group-icon"
                        src       = {profile.profile.displayTheme === 'light' ? forumNewGroupLightIcon : forumNewGroupDarkIcon} 
                    />
                    <p className={css.forumChatMessage}>Create a group</p>
                </div>
                <button className={css.forumCreateIconBtn} type="button"  onClick={handleCreateGroup}>
                    <img  
                        className = {css.forumCreateIcon}  
                        alt       = "forum-create-group-icon"
                        src       = {profile.profile.displayTheme === 'light' ? forumCreateGroupLightIcon : forumCreateGroupDarkIcon} 
                    />
                </button>
            </div>
        </div>
    );
};

export default CreateForum;