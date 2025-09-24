import css from '../Create/index.module.css'; 
import { useAuth } from '../Auth/authContext';
import { useEffect, useState, useRef } from 'react';
import statusDarkSvg from '../assets/completedDark.svg'; 
import calendarDarkSvg from '../assets/calendarDark.svg';
import statusLightSvg from '../assets/completedLight.svg'; 
import calendarLightSvg from '../assets/calendarLight.svg'; 
import arrowLeftDarkSvg from '../assets/arrowLeftDark.svg';  
import taskErrorDarkSvg from '../assets/taskErrorDark.svg';
import taskRepeatDarkSvg from '../assets/taskRepeatDark.svg'; 
import arrowLeftLightSvg from '../assets/arrowLeftLight.svg';
import taskErrorLightSvg from '../assets/taskErrorLight.svg';
import arrowRightDarkSvg from '../assets/arrowRightDark.svg';
import taskRepeatLightSvg from '../assets/taskRepeatLight.svg';  
import arrowRightLightSvg from '../assets/arrowRightLight.svg';
import mobileTimeDarkBtnSvg from '../assets/taskUnfinishedDark.svg';
import mobileTimeLightBtnSvg from '../assets/taskUnfinishedLight.svg';
import { type TaskProps, type ProfileProps, formatDate, formatTaskDate } from '../types/index'; 


const CreateTask: React.FC<ProfileProps> = ({ profile }) => {

  const { accessToken }                       = useAuth();
  const [error, setError]                     = useState('');
  const [currentDate, setCurrentDate]         = useState(new Date());
  const [days, setDays]                       = useState<number[]>([]); 
  const [taskTime, setTaskTime]               = useState('00:00');
  const [taskTitle, setTaskTitle]             = useState('Task title');
  const [taskDescription, setTaskDescription] = useState("Task Details (e.g., 'Apply compost to boost growth')");
  const [showCreatedTask, setShowCreatedTask] = useState(false);
  const [newTask, setNewTask]                 = useState<TaskProps | null>(null);
  const [selectedDate, setSelectedDate]       = useState<Date | null>(null);
  const taskTitleRef                          = useRef<HTMLInputElement | null>(null);
  const taskDescriptionRef                    = useRef<HTMLTextAreaElement | null>(null);
  const taskDescriptionMobileRef              = useRef<HTMLTextAreaElement | null>(null);
  const [isRecurring, setIsRecurring]         = useState(false);
  const [activeRepeatTab, setActiveRepeatTab] = useState('daily'); 


  useEffect(() => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth     = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    const daysArray : number[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) { daysArray.push(0); }
    for (let i = 1; i <= daysInMonth; i++)    { daysArray.push(i); }
    setDays(daysArray);

    if (!selectedDate) { setSelectedDate(new Date()); }
  }, [currentDate, selectedDate]);


  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };


  const handleMobileDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDateString = e.target.value;
    if (selectedDateString) {
      setSelectedDate(new Date(selectedDateString));
    } else {
      setSelectedDate(null);
    }
  };


  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTaskTime(event.target.value);
  };


  const handleTitleChange = (event : React.ChangeEvent<HTMLInputElement>) => {
    setTaskTitle(event.target.value || 'Task title');
  }

  
  const handleDescriptionChange = (event : React.ChangeEvent<HTMLTextAreaElement>) => {
    setTaskDescription(event.target.value || "Task Details (e.g., 'Apply compost to boost growth')");
  } 


  const handleDateClick = ( day : number ) => {
    if (day > 0) {
      const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDate(clickedDate);
    }
    else { setSelectedDate(null); }
  }


  const handleCreateTask = async () => {

    try {
      const response = await fetch('/api/v1/tasks/create/', {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body    : JSON.stringify({
          taskTitle       : taskTitle,
          taskDescription : taskDescription,
          taskRepeat     : isRecurring,  
          recurringType   : activeRepeatTab, 
          scheduledTime   : selectedDate ? `${selectedDate.toISOString().split('T')[0]}T${taskTime}:00Z` : new Date().toISOString()
        }),
        credentials : 'include'
      });

      if (response.ok) {
        const taskData = await response.json();
        setNewTask(taskData);
        setIsRecurring(false);
        setShowCreatedTask(true);
        setTimeout(() => setShowCreatedTask(false), 3000);

        setTimeout(() => {
          if (taskTitleRef.current && taskDescriptionRef.current && taskDescriptionMobileRef.current) {
            taskTitleRef.current.value = '';
            taskDescriptionRef.current.value = '';
            taskDescriptionMobileRef.current.value = '';
          }

          setTaskTitle('Task title');
          setTaskDescription("Task Details (e.g., 'Apply compost to boost growth')");
        }, 3000); 
      }

      else {
        const data = await response.json();
        setError(data.error);
        setTimeout(() => { setError(''); }, 4000);
      }

    }
    catch (error) { console.error("An error occurred.Please try again later: ", error) }
  } 


  const handleDiscardTask = async () => {
    if (taskTitleRef.current && taskDescriptionRef.current && taskDescriptionMobileRef.current) {
      taskTitleRef.current.value = '';
      taskDescriptionRef.current.value = '';
      taskDescriptionMobileRef.current.value = '';
      setIsRecurring(false);
    }

    setTaskTitle('Task title');
    setTaskDescription("Task Details (e.g., 'Apply compost to boost growth')");
  } 


  const handleRecurringToggle = () => { setIsRecurring(!isRecurring); };
  const handleTabChange       = (page: string) => { setActiveRepeatTab(page); }
  const handleDailyClick      = () => { handleTabChange('daily'); };
  const handleWeeklyClick     = () => { handleTabChange('weekly'); };
  const handleMonthlyClick    = () => { handleTabChange('monthly'); };


  return (
    <div className={`${css.createTaskParentDiv} ${profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}>
      <div className={css.createTaskParentDiv}>

        <div className={css.createTaskChildDiv}>
          {showCreatedTask ? (
            <div className={css.createTaskShowDiv}>
              <div className={css.createTaskShowIconDiv}> 
                <img  
                  alt       = "task-created-svg"
                  className = {css.createTaskShowSvg}
                  src       = {profile.displayTheme === 'light' ? statusLightSvg : statusDarkSvg} 
                />
              </div>

              <div className={`${css.createTaskShowItemDiv} ${showCreatedTask ? css.fadeIn : css.fadeOut}`}>
                <div className={css.createTaskItemHeaderDiv}>
                  <p className={css.createTaskItemTitle}>{newTask?.title}</p>
                  <img 
                    alt       = "calendar-svg"
                    className = {css.createTaskItemSvg}   
                    src       = {profile.displayTheme === 'light' ? calendarLightSvg : calendarDarkSvg} 
                  />
                  <p className={css.createTaskItemDate}>{formatTaskDate(selectedDate ? selectedDate.toISOString() : new Date().toISOString())}</p>
                </div>
                <p className={css.createTaskItemDescription}>{newTask?.description}</p>
              </div>
            </div>
     
           ) : error ? ( 
            <div className={css.createTaskShowDiv}>
              <img 
                alt       = "task-error"
                className = {css.createTaskShowSvg} 
                src       = {profile.displayTheme === 'light' ? taskErrorLightSvg : taskErrorDarkSvg} 
              />
              <div className={`${css.createTaskShowItemDiv} ${error ? css.fadeIn : css.fadeOut}`}>
                <div className={css.createTaskItemHeaderDiv}>
                  <p className={css.createTaskItemDescription}>{error}</p>
                </div>
              </div>
            </div>
          ):(
            <div className={`${css.calendarTaskDefaultDiv} ${!showCreatedTask ? css.fadeIn : css.fadeOut}`}>
              <div className={css.createTaskItemHeaderDiv}>
                <p className={css.createTaskItemTitle}>{taskTitle}</p> 
                <img 
                  alt       = "calendar-svg"
                  className = {css.createTaskShowSvg}   
                  src       = {profile.displayTheme === 'light' ? calendarLightSvg : calendarDarkSvg} 
                />
                <p className={css.createTaskItemDate}>{formatTaskDate(selectedDate ? selectedDate.toISOString() : new Date().toISOString())}</p>
              </div>
              <p className={css.createTaskItemDescription}>{taskDescription}</p>
            </div> 
          )}
      
          <div className={css.createTaskCalendarDiv}>

            <div className={css.createMobileTaskCalendarChildDiv}> 
              <div className={css.createMobileTaskCalendarBtnDiv}>
                <button className={`${css.createMobileTaskCalendarBtn} ${css.createMobileDateBtn}`}> 
                  <label htmlFor="datePicker" className={css.createMobileDateLabel}>
                    <img
                      alt       = "mobile-calendar-btn-svg"
                      className = {css.createTaskCalendarBtnSrc}
                      src       = {profile.displayTheme === "light" ? calendarLightSvg : calendarDarkSvg}
                    />
                    {formatDate(selectedDate ? selectedDate.toISOString() : new Date().toISOString())}
                  </label>

                  <input
                    type      = "date"
                    id        = "datePicker"
                    onChange  = {handleMobileDateChange}
                    className = {css.createMobileDateInput}
                  />
                </button>

                <button className={`${css.createMobileTaskCalendarBtn} ${css.createMobileDateBtn}`}>
                  <img  
                    alt       = "mobile-time-btn-svg"
                    className = {css.createTaskCalendarBtnSrc}  
                    src       = {profile.displayTheme === 'light' ? mobileTimeLightBtnSvg : mobileTimeDarkBtnSvg}   
                  />

                  <input
                    type      = "time"
                    value     = {taskTime}
                    onChange  = {(e) => setTaskTime(e.target.value)}  
                    className = {css.createMobileTimeInput}
                  />
                  {taskTime}
                </button>
              </div> 

              <div className={css.createMobileTaskCalendarFlexDiv}>
                <p className={css.createMobileRecurringText}>Recurring task ?</p>
              </div>
 
              <div className={css.createMobileTaskCalendarFlexDiv}>
                <p className={css.createMobileTaskHint}>Repeat this task automatically on a set schedule.</p>

                <label className={css.createTaskRadioLabel}>
                  <input type="checkbox" checked={isRecurring} onChange={handleRecurringToggle}/>
                  <span className={css.createTaskRadioSpan}></span>
                </label>
              </div>
 
              <div className={css.createRecurringMenu}>
                <a 
                className = {`${css.createRecurringMenuItem} ${activeRepeatTab === 'daily' ? css.active : '' }`}
                onClick   = {handleDailyClick}
                >daily</a>

                <a 
                  className = {`${css.createRecurringMenuItem} ${activeRepeatTab === 'weekly' ? css.active : '' }`}
                  onClick   = {handleWeeklyClick}
                >weekly</a>

                <a 
                  className = {`${css.createRecurringMenuItem} ${activeRepeatTab === 'monthly' ? css.active : '' }`}
                  onClick   = {handleMonthlyClick}
                >monthly</a>
              </div> 
            </div>


            <div className={css.createTaskCalendarChildDiv}>
              <div className={css.createTaskCalendarHeaderDiv}>
                <span className={css.createTaskMonthSpan}>
                  {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>

                <input className={css.createTaskTimeInput} type="time"  defaultValue="00:00" onChange={handleTimeChange}/>
                
                <div className={css.createTaskCalendarBtnDiv}>
                  <button className={css.createTaskCalendarBtn} onClick={() => changeMonth(-1)}>
                    <img  
                      alt       = "arrow-left-svg"
                      className = {css.createTaskCalendarBtnSrc}  
                      src       = {profile.displayTheme === 'light' ? arrowLeftLightSvg : arrowLeftDarkSvg}  
                    />
                  </button>

                  <button className={css.createTaskCalendarBtn} onClick={() => changeMonth(1)}>
                    <img 
                      alt       = "arrow-right-svg"
                      className = {css.createTaskCalendarBtnSrc}  
                      src       = {profile.displayTheme === 'light' ? arrowRightLightSvg : arrowRightDarkSvg}   
                    />
                  </button>
                </div>
              </div>
            
              <ul className={css.createTaskWeekDayList}>
                <li>Su</li>
                <li>Mo</li>
                <li>Tu</li>
                <li>We</li>
                <li>Th</li>
                <li>Fr</li>
                <li>Sa</li>
              </ul>

              <ul className={css.createTaskDaysList}>
                {days.map((day, index) => (
                  <li 
                    key       = {index} 
                    onClick   = {() => handleDateClick(day)}
                    className = {`${day === selectedDate?.getDate() ? css.createTaskCurrentDate : ''}`}
                  >
                    {day > 0 ? day : ''}
                  </li>
                ))}
              </ul>
            </div>

            <div className={css.createTaskInputsDiv}>
              <input 
                type        = "text" 
                placeholder = 'Title'
                ref         = {taskTitleRef}
                onChange    = {handleTitleChange}
                className   = {css.createTaskTitleInput} 
              />

              <textarea 
                rows        = {4} 
                placeholder = 'Description'
                ref         = {taskDescriptionRef}
                onChange    = {handleDescriptionChange}
                className   = {css.createTaskTextareaInput} 
              ></textarea>

              <textarea 
                rows        = {8} 
                placeholder = 'Description' 
                onChange    = {handleDescriptionChange}
                ref         = {taskDescriptionMobileRef}
                className   = {css.createMobileTaskTextarea} 
              ></textarea>

              <div className={css.createTaskBtnsDiv}>
                <div className={css.createRecurringDiv}>
                  {!isRecurring && (
                    <div className={css.createTaskRadioBtnDiv}>
                      <p className={css.createTaskRadioText}>repeat this task</p>

                      <img 
                        alt       = "mobile-recurring-task-svg"
                        className = {css.createTaskItemSvg}
                        src       = {profile.displayTheme === 'light' ? taskRepeatLightSvg : taskRepeatDarkSvg} 
                      />

                      <label className={css.createTaskRadioLabel}>
                        <input type="checkbox" checked={isRecurring} onChange={handleRecurringToggle}/>
                        <span className={css.createTaskRadioSpan}></span>
                      </label>
                    </div>
                  )}

                  {isRecurring && (
                    <div className={`${css.createRecurringMenu} ${css.createRecurringTablet} ${isRecurring ? css.fadeIn : css.fadeOut}`}>
                      <a 
                      className = {`${css.createRecurringMenuItem} ${activeRepeatTab === 'daily' ? css.active : '' }`}
                      onClick   = {handleDailyClick}
                      >daily</a>

                      <a 
                        className = {`${css.createRecurringMenuItem} ${activeRepeatTab === 'weekly' ? css.active : '' }`}
                        onClick   = {handleWeeklyClick}
                      >weekly</a>

                      <a 
                        className = {`${css.createRecurringMenuItem} ${activeRepeatTab === 'monthly' ? css.active : '' }`}
                        onClick   = {handleMonthlyClick}
                      >monthly</a>
                    </div>
                  )}
                </div>

                <button className={css.createTaskDiscardBtn} onClick={handleDiscardTask}>Discard</button>
                <button className={css.createTaskSaveBtn} onClick={handleCreateTask}>Create</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTask;