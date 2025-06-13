import css from '../Home/index.module.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../Auth/authContext';
import taskShareDarkIcon from '../assets/taskShareDark.svg';
import taskShareLightIcon from '../assets/taskShareLight.svg'; 
import taskDeleteDarkIcon from '../assets/taskDeleteDark.svg'; 
import taskDeleteLightIcon from '../assets/taskDeleteLight.svg';
import { type TaskProps, formatDate, formatTaskDate } from '../types/index';


interface ClickedTaskProps {

    theme                  : string; 
    handleRemoveItemDetail : () => void; 
    handleTaskDeleteClick  : () => void;
    fetchUserTasks         : () => void;
    taskDetail             : TaskProps | null;
    handleItemShareClick   : (clickedItemType: 'task' | 'plant') => void;
}

const ClickedTask: React.FC<ClickedTaskProps> = ({ 
    theme, taskDetail, handleRemoveItemDetail, handleItemShareClick, handleTaskDeleteClick, fetchUserTasks
}) => {

    const { accessToken }                   = useAuth();
    const [taskCompleted, setTaskCompleted] = useState<boolean>(taskDetail?.completed || false);

    useEffect(() => { if (taskDetail) { setTaskCompleted(taskDetail.completed); } }, [taskDetail]); 

    const handleTaskComplete = async (taskId: number, taskCompletedVal: string) => {
        try { 
          const response = await fetch(`/api/v1/tasks/${taskId}/${taskCompletedVal}/complete/`, {
            method      : 'PATCH',
            headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            credentials : 'include'
          });
    
          if (response.ok) {
            const taskData = await response.json();
            setTaskCompleted(taskData.completed);  
            fetchUserTasks();
          } 
          
          else { console.error('Failed to update task detail: ', response.status); }
        } 
        
        catch (error) { console.error('Error updating task detail:', error); }
    };


    return (
        <>
            <div className={`${css.homeClickedItemDiv} ${css.fadeIn} ${theme === 'dark' ? css.darkTheme : css.lightTheme}`}>
                <h5 className={css.homeClickedItemHeader}>{taskDetail?.title}</h5>
                <div className={css.homeClickedItemSpacedDiv}>
                    <div className={css.homeClickedRadioBtnDiv}>
                        <p className={css.homeClickedItemDate}>task completed ?</p>

                        <label className={css.homeClickedItemRadioLabel}>
                            <input 
                                type     = "checkbox"
                                checked  = {taskCompleted}
                                onChange = {() => {
                                    const taskCompletedVal = !taskCompleted ? 'true' : 'false';  
                                    if (taskDetail && taskDetail.id) { handleTaskComplete(taskDetail.id, taskCompletedVal); }
                                }}
                            />
                            <span className={css.homeClickedItemRadioSpan}></span>
                        </label>
                    </div>
                          
                    <p className={css.homeClickedItemDate}>created&nbsp;.&nbsp;{formatDate(taskDetail?.created ?? '')}</p>
                </div>
                <p className={css.homeClickedItemText}>{taskDetail?.description}</p>
                <p className={css.homeClickedItemText}>{taskDetail?.completed}</p>

                <p className={css.homeClickedItemDate}>scheduled&nbsp;.&nbsp;{formatTaskDate(taskDetail?.scheduledTime ?? '')}</p>
                    
                <div className={css.homeClickedItemFlexDiv}>
                    {taskDetail?.scheduledTime && new Date() > new Date(taskDetail?.scheduledTime) && !taskDetail?.completed ? (
                        <div className={css.homeTaskOverdueDiv}>
                            <div className={css.homeTaskOverdueIndicator}></div>
                            <p className={css.homeTaskOverdueText}>overdue</p>
                        </div>
                    ) : taskDetail?.recurringType && (
                        <div className={css.homeTaskRepeatDiv}>
                            <div className={css.homeTaskRepeatIndicator}></div>
                            <p className={css.homeTaskRepeatText}>{taskDetail.recurringType}</p>
                        </div>
                    )}

                    <button className={css.homeClickedShareBtn} onClick={() => handleItemShareClick('task')}>
                        <img 
                            alt       = "task-share-icon"
                            className = {css.homeClickedIcon}  
                            src       = {theme === 'light' ? taskShareLightIcon : taskShareDarkIcon}  
                        />
                    </button>

                    <button className={css.homeClickedShareBtn} onClick={handleTaskDeleteClick}> 
                        <img 
                            alt       = "task-delete-icon"
                            className = {css.homeClickedIcon}  
                            src       = {theme === 'light' ? taskDeleteLightIcon : taskDeleteDarkIcon}  
                        /> 
                    </button>

                    <div className={css.homeClickedItemBtnDiv}>
                        <button className={css.homeClickedModalCancelBtn} onClick={handleRemoveItemDetail}>Back</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClickedTask;