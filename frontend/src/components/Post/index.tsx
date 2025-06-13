import React from 'react';
import css from '../Post/index.module.css';
import type { ProfileProps } from '../types/index';
import chevronDownDark from '../assets/chevronDownDark.svg';


const Post: React.FC<ProfileProps> = ({ profile }) => {

  const style = { '--chevronIcon': `url(${chevronDownDark})` } as React.CSSProperties;

  return (
    <div 
      className = {`${css.postParentDiv} ${profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}
      style     = {style}
    >

      <div className={css.postParentDiv}>

        <div className={css.postCardDiv}>
          <div className={css.postFlexDiv}>
            <p className={css.postCardHeader}>Add new item</p>
          </div>

          <div className={css.postCardInputDiv}>
            <span className={css.postCardSpan}>Title</span>
            <input className={css.postCardInput} placeholder="Title"/>
          </div>

          <div className={css.postCardFlexInputDiv}>
            <div className={css.postCardInputTagDiv}>
              <span className={css.postCardSpan}>Tags</span>
              <input className={css.postCardInput} placeholder="Tags"/>
            </div>

            <div className={css.postCardSelectDiv}>
              <span className={css.postCardSpan}>Condition</span>
              <select className={css.postCardSelect}>
                <option value="new">new</option>
                <option value="slightly used">slightly used</option>
                <option value="used">used</option>
              </select>
            </div>
          </div>

          <div className={css.postCardInputDiv}>
            <span className={css.postCardSpan}>Description</span>
            <textarea
              rows        = {3}  
              name        = "description"
              placeholder = "Description"
              className   = {css.postTextarea}
            ></textarea>
          </div>

          <div className={css.postCardInputDiv}>
            <button className={css.postUploadImgBtn}>
              <span>upload</span>
              <span>Allowed files .png, .jpg .jpeg</span>
            </button>
          </div>

          <div className={css.postFlexDiv}><button className={css.postSubmitBtn}>Upload</button></div>
        </div>
      </div>
    </div>
  );
};

export default Post;