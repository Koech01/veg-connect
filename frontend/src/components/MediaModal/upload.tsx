import Modal from '../Modal';
import { useState } from 'react';
import css from '../MediaModal/index.module.css';
import fileDarkSvg from '../assets/fileDark.svg'; 
import fileLightSvg from '../assets/fileLight.svg';
import type { MediaModalProps } from '../types/index';  
import closeLightIcon from '../assets/closeLight.svg';


const UploadMediaModal: React.FC<MediaModalProps> = ({ profile, isOpen, onClose, onSendMessage }) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fadeOutIndex, setFadeOutIndex]   = useState<number | null>(null);
    const [textMessage, setTextMessage]     = useState('');

    
    const handleMediaUpload = () => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fileInput.multiple = true;
      fileInput.accept   = 'image/*, video/*';
  
      fileInput.onchange = ( event : Event ) => {
        const target = event.target as HTMLInputElement;
        const files  = target.files;
        if (files) { setSelectedFiles(Array.from(files)); }
      };
  
      fileInput.click();
    }


    const handleRemoveMedia = (index: number) => {
      setFadeOutIndex(index);
      setTimeout(() => {
        setSelectedFiles((prevFile) => prevFile.filter((_, i) => i !== index));
        setFadeOutIndex(null); 
      }, 300); 
    };


    const handleUpload = () => {
      onSendMessage(textMessage, selectedFiles);
      onClose();
      setTextMessage('');
      setSelectedFiles([]);
    }

  
    return (
      <>
        {isOpen && (
          <Modal profile={profile} isOpen={isOpen} onClose={onClose}>
            <div className={`${css.mediaModalParentDiv} ${profile.profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}>
              <div className={css.mediaModalParentDiv}>
                <div className={css.mediaModalHeaderDiv}>
                  <img  
                    alt       = "forum-modal-header-icon"
                    className = {css.mediaModalHeaderIcon} 
                    src       = {profile.profile.displayTheme === 'light' ? fileLightSvg : fileDarkSvg}   
                  />
                  <p className={css.mediaModalHeader}>Upload files</p>
                </div> 

                <div className={css.mediaModalUploadDiv}>
                  <button className={css.mediaModalUploadBtn}> 
                    <span className={css.mediaModalUploadLabel} onClick={handleMediaUpload}>upload</span>

                    <input
                      type     = "file"
                      accept   = "image/jpeg, image/png, image/gif, image/tiff, video/mov, video/mp4, video/webm, video/ogg"
                      style    = {{ display: 'none' }}
                    />

                    <span className={css.mediaModalUploadHint}>Allowed files .png, .jpg .jpeg</span>
                  </button>
                </div>

                <div className={`${css.mediaModalDisplayDiv} ${selectedFiles.length > 0 ? css.mediaModalHasFile : css.mediaModalHasNoFile}`}>
                  {selectedFiles.map((file, index) => (
                    <div 
                      key       = {index} 
                      className = {`${css.mediaModalDiv} ${fadeOutIndex === index ? css.fadeOut : ''}`}
                    >
                      <button 
                        className = {css.mediaModalRemoveButton}
                        onClick   = {() => handleRemoveMedia(index)}
                      >
                        <img className={css.mediaModalBtnImg} src={closeLightIcon} alt="forum-modal-close-icon"/>
                      </button>

                      {file.type.startsWith('image/') ? (
                        <img 
                          key       = {index}
                          alt       = "forum-chat-user-icon"
                          src       = {URL.createObjectURL(file)} 
                          className = {css.mediaModalImage} 
                        />
                      ) : (
                        <video
                          controls
                          key       = {index}
                          className = {css.mediaModalVideo}
                        >
                          <source src={URL.createObjectURL(file)} type={file.type}/>
                          Your browser does not support the video tag. 
                        </video>
                      )}
                    </div>
                  ))}
                </div>

                <textarea 
                  rows        = {1} 
                  placeholder = 'Add a caption...'
                  className   = {css.mediaModalTextarea} 
                  onChange  = {(e) => setTextMessage(e.target.value)}
                ></textarea>

                <div className={css.mediaModalBtnDiv}>
                  <button className={css.mediaModalCloseBtn} onClick={onClose}>Close</button>
                  <button className={css.mediaModalSendBtn} onClick={handleUpload}>Upload</button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  };
  
  export default UploadMediaModal;