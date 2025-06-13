import css from '../MediaModal/index.module.css'; 
import modalCss from "../Modal/index.module.css";
import {type ProfileProps } from '../types/index';
import closeDarkIcon from '../assets/closeDark.svg';
import closeLightIcon from '../assets/closeLight.svg';


interface ViewMediaModalProps {
  profile   : ProfileProps;
  mediaUrl  : string;  
  mediaType : 'image' | 'video';  
  isOpen    : boolean;
  onClose   : () => void;
}

const ViewMediaModal: React.FC<ViewMediaModalProps> = ({ profile, isOpen, mediaUrl, mediaType, onClose }) => {


    return (
      <>
        {isOpen && (
          <div className={`${css.viewMediaModalParentDiv} ${css.fadeIn} ${profile.profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}>
            <div className={css.viewMediaModalParentDiv}>
              <div className={css.viewMediaModalChildDiv}>
                <button className={css.viewModalCloseBtn} onClick={onClose}> 
                  <img 
                    alt       = "modal-close-icon"
                    className = {modalCss.modalCloseBtnImg} 
                    src       = {profile.profile.displayTheme === 'light' ? closeLightIcon : closeDarkIcon}  
                  />
                </button>

                <div className={css.viewMediaModalContentDiv}>
                  {mediaType === 'image' && 
                    <img src={mediaUrl} alt="media" className={css.viewMediaImageDiv} 
                  />}

                  {mediaType === 'video' && (
                    <video controls className={css.viewMediaVideoDiv}>
                      <source src={mediaUrl}/>
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };
  
  export default ViewMediaModal;