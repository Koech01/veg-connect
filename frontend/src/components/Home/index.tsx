import ClickedTask from './task';
import ClickedPlant from './plant';
import css from '../Home/index.module.css';
import HomePlantPair from './homePlantPair'; 
import { useAuth } from '../Auth/authContext';
import { useEffect, useState, useRef } from 'react'; 
import statusDarkSvg from '../assets/completedDark.svg';
import calendarDarkSvg from '../assets/calendarDark.svg';
import statusLightSvg from '../assets/completedLight.svg';
import bookmarkDarkIcon from '../assets/bookmarkDark.svg'; 
import calendarLightSvg from '../assets/calendarLight.svg';
import bookmarkLightIcon from '../assets/bookmarkLight.svg';
import homeSearchPlant from '../assets/homeSearchPlant.svg'; 
import taskHeaderDarkSvg from '../assets/taskHeaderDark.svg'; 
import arrowRightDarkSvg from '../assets/arrowRightDark.svg';
import homeInfoDarkIcon from '../assets/infoCircledDark.svg';
import unBookmarkDarkIcon from '../assets/unBookmarkDark.svg'; 
import homeInfoLightIcon from '../assets/infoCircledLight.svg';
import arrowRightLightSvg from '../assets/arrowRightLight.svg';
import taskHeaderLightSvg from '../assets/taskHeaderLight.svg'; 
import plantGrowthDarkSvg from '../assets/plantGrowthDark.svg';
import unBookmarkLightIcon from '../assets/unBookmarkLight.svg';  
import homeplantInfoDarkIcon from '../assets/plantInfoDark.svg';
import plantGrowthLightSvg from '../assets/plantGrowthLight.svg'; 
import homeplantInfoLightIcon from '../assets/plantInfoLight.svg';
import taskUnfinishedDarkSvg from '../assets/taskUnfinishedDark.svg';
import homeSearchTaskDarkSvg from '../assets/homeSearchTaskDark.svg'; 
import homeSearchTaskLightSvg from '../assets/homeSearchTaskLight.svg';  
import taskUnfinishedLightSvg from '../assets/taskUnfinishedLight.svg';
import homeSearchIconLightSvg from '../assets/homeSearchIconLight.svg'; 
import { type ProfileProps, type PlantProps, type TaskProps, type GroupProps, type ShareProfile, type BookmarkPayload, formatDate, formatTaskDate, transformApiPlantData } from '../types/index';


const Home: React.FC<ProfileProps> = ({ profile }) => {

  const { accessToken }                         = useAuth();
  const hasFetched                              = useRef(false);
  const [searchQuery, setSearchQuery]           = useState('');
  const [focusSearchInput, setFocusSearchInput] = useState(false);
  const [slideDown, setSlideDown]               = useState(false);
  const [completedTask, setCompletedTask]       = useState<TaskProps[]>([]);
  const [incompletedTask, setIncompletedTask]   = useState<TaskProps[]>([]);
  const [isSearchLoading, setSearchLoading]     = useState(true);
  const [isTaskLoading, setTaskLoading]         = useState(true);
  const [searchTasks, setSearchTasks]           = useState<TaskProps[]>([]);
  const [searchPlants, setSearchPlants]         = useState<PlantProps[]>([]);
  const currentDate                             = formatDate(new Date().toISOString());
  const [suggestionTasks, setSuggestionTasks]   = useState<PlantProps[]>([]);
  const [viewTasks, setViewTasks]               = useState(false);
  const [viewHintTasks, setViewHintTasks]       = useState(false);
  const [clickedItemType, setClickedItemType]   = useState<'task' | 'plant' | null>(null);
  const [clickedTask, setClickedTask]           = useState(false);
  const [clickedPlant, setClickedPlant]         = useState(false);
  const [taskDetail, setTaskDetail]             = useState<TaskProps | null>(null);
  const [plantDetail, setPlantDetail]           = useState<PlantProps | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setShareModalOpen]   = useState<boolean>(false);
  const [shareProfiles, setShareProfiles]       = useState<ShareProfile[]>([]);
  const [shareGroups, setShareGroups]           = useState<GroupProps[]>([]);
  const [activeModalTab, setActiveModalTab]     = useState('group'); 
  const [shareUserIds, setShareUserIds]         = useState<number[]>([]);
  const [shareGroupIds, setShareGroupIds]       = useState<number[]>([]);
  const [shareTextMessage, setShareTextMessage] = useState('');
  const [bookmarkedTitles, setBookmarkedTitles] = useState<Set<string>>(new Set());


  const handleSearchFocus = () => {  
    setFocusSearchInput(true);
    setSlideDown(true); 
  }


  const handleSearchBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (!event.relatedTarget || !event.relatedTarget.closest(`.${css.homeSearchResultDiv}`)) {
      setFocusSearchInput(false);
    }
  };


  useEffect(() => {
    const timer = setTimeout(() => { setViewTasks(true); }, 300);
    return () => clearTimeout(timer);
  }, []); 
 
  
  const fetchUserTasks = async () => {
    try { 
      const response = await fetch('/api/v1/home/tasks/', {
        method      : 'GET',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials : 'include',
      })

      if (response.ok) {
        const tasks: TaskProps[] = await response.json(); 
        const completedTasks     = tasks.filter(task => task.completed);
        const inCompletedTasks   = tasks.filter(task => !task.completed);
        setCompletedTask(completedTasks);
        setIncompletedTask(inCompletedTasks);
        setTaskLoading(false);
      }

      else { 
        console.error('Failed to fetch tasks: ', response.status);
        setTaskLoading(false);
      }
    }
    catch (error) { 
      console.error('Error fetching tasks: ', error);
      setTaskLoading(false);
    }
  };


  useEffect(() => { fetchUserTasks(); }, []);


  useEffect(() => {
 
    if (hasFetched.current) return;
    hasFetched.current = true;

    (async () => {
      setViewHintTasks(false);
      try {
        const response = await fetch('/api/v1/home/recommendations/', {
          method     : 'GET',
          headers    : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const contextualPlants: PlantProps[] = data.contextualPlants;
          setSuggestionTasks(contextualPlants);

          if (contextualPlants.length === 0) { setViewHintTasks(true); }
        } 
        
        else {
          console.error('Failed to fetch plant recommendations:', response.status);
          setViewHintTasks(true);
        }

      } 
      
      catch (error) {
        console.error('Error fetching plant recommendations:', error);
        setViewHintTasks(true);
      } 
      
      finally { setTaskLoading(false); }
    })();
  }, []);


  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(event.target.value); };


  useEffect(() => {
    const fetchSearchResults = async () => {
      try { 
        const response = await fetch(`/api/v1/home/search/?search=${encodeURIComponent(searchQuery)}`, {
          method      : 'GET',
          headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          credentials : 'include',
        });

        if (response.ok) {
          const data: { plants: PlantProps[], tasks: any[] } = await response.json();

          const uniquePlants = Array.from(
            new Map(data.plants.map(plant => [plant.id ?? plant.displayName, plant])).values()
          );

          setSearchTasks(data.tasks);
          setSearchPlants(uniquePlants); 
          setSearchLoading(false);
        }

        else { 
          console.error('Failed to fetch search results :', response.status)
          setSearchLoading(false);
        }
      }

      catch (error) { 
        console.error('Error fetching search results:', error);  
        setSearchLoading(false); 
      }
    };

    if (searchQuery) fetchSearchResults();
  }, [searchQuery]);

  
  const handleClickTask = async(taskId: number) => {   
    handleRemoveItemDetail(); 
    setClickedTask(true);
    if (focusSearchInput !== false) { setFocusSearchInput(false); }
    if (clickedPlant !== false)     { setClickedPlant(false); }
  
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}/detail/ `, {
        method      : 'GET',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials : 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTaskDetail(data);
      }
      else { console.error('Failed to task details: ', response.status) }
    }
    catch (error) { console.error('Error fetching task details: ', error) }
  };
  

  const handleClickPlant = async (plantName: string) => {
    handleRemoveItemDetail();
    setClickedPlant(true);
    if (focusSearchInput !== false) setFocusSearchInput(false);
    if (clickedPlant !== false) setClickedTask(false);
 
    try {
      const response = await fetch(`/api/v1/plants/detail/?query=${encodeURIComponent(plantName)}`, {
        method      : 'GET',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials : 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPlantDetail(data); 
        setPlantDetail(transformApiPlantData(data)); 
      } else {
        console.error("Failed to fetch plant information: ", response.status);
      }
    } catch (error) {
      console.error("Error fetching plant information: ", error);
    }
  };


  useEffect(() => {
    (async () => {
      try { 
        const response = await fetch('/api/v1/tasks/users/groups/', {
          method      : 'GET',
          headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          credentials : 'include',
        })

        if (response.ok) {
         const data = await response.json();
          setShareProfiles(data.users || []);
          setShareGroups(data.groups || []);
        }

        else { console.error('Failed to fetch users and groups: ', response.status); }
      }
      catch (error) { console.error('Error fetching users and groups: ', error); }
    })();
  }, []);
 

  const handleRemoveItemDetail = () => { 
    if (clickedTask !== false) { setClickedTask(false); }
    if (clickedPlant !== false) { setClickedPlant(false); }
    setTaskDetail(null);
    setPlantDetail(null);
    setClickedItemType(null);
  };


  const handleDeleteTask = async(taskId?: number) => {
 
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}/delete/`, {
        method      : 'DELETE',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials : 'include'
      });
  
      if (response.ok) {
        setDeleteModalOpen(false);
        handleRemoveItemDetail();
        fetchUserTasks();
      }
      else { console.error('Failed to delete task: ', response.status); }
    } catch (error) { console.error('Error deleting task:', error); }
  };


  const isCheckboxChecked = (id: number, type: 'user' | 'group') => {
    if (type === 'user')       { return shareUserIds.includes(id); } 
    else if (type === 'group') { return shareGroupIds.includes(id); }
  };


  const handleClickTaskCheckbox = (id: number, type: 'user' | 'group') => {
    if (type === 'user') {
      setShareUserIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
    } else if (type === 'group') {
      setShareGroupIds(prev => prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]);
    }
  };


  const handleShareItem = async () => {
    let baseUrl;
    let itemId;
    let itemKey;

    if (clickedItemType === 'task')  { 
      baseUrl = '/api/v1/tasks/send/';
      itemId  = taskDetail?.id;
      itemKey = 'taskId';
    } 

    else if (clickedItemType === 'plant') { 
      baseUrl = '/api/v1/plants/send/'; 
      itemId  = plantDetail?.commonName;
      itemKey = 'commonName';
    } 

    else { return; }
  
    const userGroupsIds = [
      ...shareUserIds.map(id => ({ id, type: 'user' })),
      ...shareGroupIds.map(id => ({ id, type: 'group' }))
    ];
    
    if (!itemId) {
      console.error('Item ID is missing.');
      setShareModalOpen(false);  
    }
  
    try {
      const response = await fetch(baseUrl, {
        method      : 'POST',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body        : JSON.stringify({ userGroupsIds, [itemKey]: itemId, textMessage: shareTextMessage }),
        credentials : 'include'
      });
  
      if (response.ok) {
        setShareModalOpen(false);
        handleRemoveItemDetail();
        setShareUserIds([]);
        setClickedItemType(null);
        setShareTextMessage('');
      } 
      
      else { console.error('Failed to share item:', response.status); }
    } 
    
    catch (error) {  console.error('Error sharing item:', error);  }
  };
  

  const toggleBookmark = async (bookmark: BookmarkPayload) => {
    try {
      const response = await fetch('/api/v1/home/bookmark/', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, },
      body   : JSON.stringify(bookmark),
      });

      if (response.ok) {  
        setBookmarkedTitles((prev) => {
          const updated = new Set(prev);
          if (updated.has(bookmark.title)) {
            updated.delete(bookmark.title);
          } else {
            updated.add(bookmark.title);
          }
          return updated;
        });
   
      } 
      
      else { console.error('Failed to toggle bookmark:', response.status); }
    } 
    
    catch (error) { console.error('Error toggling bookmark:', error); }
  };


  const handleTaskDeleteClick = () => setDeleteModalOpen(true);
  const closeTaskDeleteClick  = () => setDeleteModalOpen(false);
  
  const handleItemShareClick = (type: 'task' | 'plant') => {
    setShareModalOpen(true);   
    setClickedItemType(type);
  };
  
  const closeItemShareClick = () => {
    setShareModalOpen(false);   
    setClickedItemType(null);
  };

  const handleModalTabClick = (page: string) => { setActiveModalTab(page); }
  const handleGroupTabClick = () => { handleModalTabClick('group'); };
  const handleUsersTabClick = () => { handleModalTabClick('user'); };


  return (
    <div className={`${css.homeParentDiv} ${profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}>
      <div className={css.homeParentChildDiv}>
        <div className={css.homeParentColumnDiv}>
          {/* Plant */}
          <HomePlantPair   
            theme        = {profile.displayTheme} 
          />
        </div>

        <div className={css.homeParentColumnDiv}>

          <div className={css.homeSearchDiv}>
            <div className={`
              ${css.homeSearchContainer} 
              ${focusSearchInput ? css.focusSearchContainer : css.blurSearchContainer}
            `}>

              <div 
                className={`
                  ${css.homeSearchInputDiv} 
                  ${focusSearchInput ? css.focusSearchInputDiv : css.blurSearchInputDiv}
                `}
              >
                <img 
                  src       = {homeSearchIconLightSvg} 
                  alt       = "home-search-icon-light-svg"
                  className = {css.homePlantItemIcon}
                />
          
                <input 
                  name         = "text" 
                  type         = "search"
                  placeholder  = "Search" 
                  autoComplete = "off"  
                  onBlur       = {handleSearchBlur}
                  onFocus      = {handleSearchFocus}
                  onChange     = {handleSearchInputChange}
                  className    = {`${css.homeSearchInput} ${focusSearchInput ? css.focusSearchInput : css.blurSearchInput}`}
                />
              </div>

              {focusSearchInput && (
                <div className={`${css.homeSearchResultDiv} ${focusSearchInput ? css.slideInDown : css.fadeOut }`}>

                  {isSearchLoading && searchQuery ? ( 
                    <div className={css.homeSearchShimmerListDiv}> 
                      <div className={css.homeSearchShimmerDiv}>
                        <div className={` ${css.homeSearchShimmerIcon}`}></div>  

                        <div className={css.homeSearchShimmerItemDiv}> 
                          <div className={css.homeSearchShimmerChildDiv}> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemOne}`}></div> 
                          </div> 

                          <div className={css.homeSearchShimmerChildDiv}> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemFour}`}></div> 
                          </div>
                        </div>
                      </div>
                        
                      <div className={css.homeSearchShimmerDiv}>
                        <div className={` ${css.homeSearchShimmerIcon}`}></div>  

                        <div className={css.homeSearchShimmerItemDiv}> 
                          <div className={css.homeSearchShimmerChildDiv}> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemThree}`}></div> 
                          </div> 

                          <div className={css.homeSearchShimmerChildDiv}> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemTwo}`}></div> 
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {searchTasks.length === 0 && searchPlants.length === 0 && searchQuery &&(
                        <div className={css.homeSearchNoResultFlexDiv}>
                          <img  
                            alt       = "home-search-icon"
                            className = {css.homeForumIconPlaceholder} 
                            src       = {profile.displayTheme === 'light' ? homeInfoLightIcon : homeInfoDarkIcon}  
                          />
                          <p className={css.homeSearchNoResultText}>No match found.</p> 
                        </div>
                      )}
 
                      {/* Task */}
                      {searchTasks.length > 0 && (
                        <div className={css.homeSearchResultFlexDiv}>
                          <p className={css.homeTaskDate}>Tasks</p>
                          <div className={css.homeSearchTaskListDiv}>
                            {searchTasks.map((task) => (
                              <button key={task.id} className={css.homeSearchResultItemDiv} onClick={() => handleClickTask(task.id)}>
                                <div className={`${task.completed ? css.homeSearchCompletedIconDiv : css.homeSearchTaskIconDiv}`}>
                                  <img 
                                    alt       = "task-status-icon"
                                    className = {css.homeSearchItemIcon} 
                                    src       = {
                                      profile.displayTheme === 'light' ?
                                      (task.completed ? statusLightSvg : homeSearchTaskLightSvg) 
                                      : 
                                      (task.completed ? statusDarkSvg : homeSearchTaskDarkSvg)
                                    } 
                                  />
                                </div>

                                <button className={css.homeSearchResultItemTextBtn} onClick={() => handleClickTask(task.id)}>
                                  <p className={css.homeSearchResultHeader}>{task.title}</p> 
                                </button>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Plant */}
                      {searchPlants.length > 0 && (

                        <div className={css.homeSearchResultFlexDiv}>
                          <p className={css.homeTaskDate}>Plants</p>
                          <div className={css.homeSearchPlantListDiv}>
                            {searchPlants.map((plant) => (

                              <button key={plant.id} className={css.homeSearchResultItemDiv} onClick={() => handleClickPlant(plant.displayName ?? plant.commonName)}>
                                <div className={css.homeSearchPlantIconDiv}>
                                  <img alt="home-search-plant-svg" className={css.homeSearchPlantIcon} src={homeSearchPlant}/>
                                </div>
        
                                <button className={css.homeSearchResultItemTextBtn} onClick={() => handleClickPlant(plant.displayName ?? plant.commonName)}>
                                  <p className={css.homeTaskDescription}>{plant.displayName ?? plant.commonName}</p> 
                                </button>
                              </button>

                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={` 
            ${slideDown ? css.slideInDown : ''}  
            ${clickedTask || clickedPlant ? css.homeClickedItemParentDiv : css.homeTaskParentDiv}
            `}
          >
            {clickedTask ? ( 
              <ClickedTask  
                theme                  = {profile.displayTheme}
                taskDetail             = {taskDetail} 
                handleRemoveItemDetail = {handleRemoveItemDetail}
                handleItemShareClick   = {() => handleItemShareClick('task')}
                handleTaskDeleteClick  = {handleTaskDeleteClick}
                fetchUserTasks         = {fetchUserTasks}
              />
            ) : clickedPlant ? (
              <ClickedPlant  
                theme                  = {profile.displayTheme}
                plantDetail            = {plantDetail} 
                handleItemShareClick   = {() => handleItemShareClick('plant')}
                handleRemoveItemDetail = {handleRemoveItemDetail}
              />
            ) : (
              <>
                <div className={css.homeTaskHeaderDiv}>
                  <img  
                    alt       = "home-task-header-svg"
                    className = {`${css.homeTaskIcon} ${css.homeTaskHeaderIcon}`}
                    src       = {profile.displayTheme === 'light' ? taskHeaderLightSvg : taskHeaderDarkSvg} 
                  />
                  <p className={css.homeTaskDate}>
                    {completedTask.length === 0 && incompletedTask.length === 0 && (<>No task added.</>)}
                    {completedTask.length > 0 && incompletedTask.length > 0 && (<>
                      {incompletedTask.length} {incompletedTask.length === 1 ? 'task' : 'tasks'} outstanding  
                      &nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;
                      {completedTask.length} {completedTask.length === 1 ? 'task' : 'tasks'} completed.
                    </>)}

                    {completedTask.length > 0 && incompletedTask.length === 0 && (<>{completedTask.length} tasks completed.</>)}
                    {completedTask.length === 0 && incompletedTask.length > 0 && (<>{incompletedTask.length} tasks outstanding.</>)}
                  </p>
                </div>

                <div className={css.homeFirstTaskList}>
                  {isTaskLoading ? (
                    <div className={css.homeTaskListShimmerDiv}>
                      <div className={css.homeTaskListItemShimmerDiv}> 
                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                          <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemOne}`}></div> 
                        </div> 

                        <div className={css.homePlantsPairShimmerFlexDiv}>  
                          <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairEndShimmerFour}`}></div>
                        </div> 

                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                          <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemTwo}`}></div> 
                          <div className={`${css.homePlantsPairShimmer} ${css.homeTaskBtnShimmer}`}></div>
                        </div>
                        
                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                          <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemThree}`}></div>
                        </div> 
                      </div> 

                      <div className={css.homeTaskListItemShimmerDiv}> 
                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                          <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemOne}`}></div> 
                        </div> 

                        <div className={css.homePlantsPairShimmerFlexDiv}>  
                          <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairEndShimmerThree}`}></div>
                        </div> 

                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                          <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemTwo}`}></div> 
                          <div className={`${css.homePlantsPairShimmer} ${css.homeTaskBtnShimmer}`}></div>
                        </div> 
                      </div> 
                    </div>
                    
                  ) : (completedTask.length === 0 && incompletedTask.length === 0 ? (
                    <div className={`${css.homeTaskItem} ${css.homeFirstTaskItem} ${css.homeEmptyTaskItem}`}> 

                      <div className={css.homeTaskItemChildDiv}>
                        <div className={css.homeTaskHeaderChildDiv}>
                          <h5 className={css.homeTaskHeader}>New Task ?</h5>
                          <img 
                            alt       = "home-task-date-svg"
                            className = {css.homeTaskDateIcon}  
                            src       = {profile.displayTheme === 'light' ? calendarLightSvg : calendarDarkSvg} 
                          />
                          <p className={css.homeTaskDate}>{currentDate}</p>
                        </div>

                        <p className={css.homeTaskDescription}>It’s empty for now. Perfect time to get ahead on your goals !</p>
                      </div>
                    </div>

                  ) : (
                    <>
                      {incompletedTask.length > 0 && viewTasks && (
                        incompletedTask.map((task) => (
                          <div key={task.id} className={`${css.homeTaskItem} ${viewTasks ? css.fadeIn : ''}`}>
                            <div className={css.homeTaskStatusIconDiv}>
                              <img  
                                alt       = "home-task-status-svg"
                                className = {`${css.homeTaskIcon} ${css.homeTaskUncompletedIcon}`}
                                src       = {profile.displayTheme === 'light' ? taskUnfinishedLightSvg : taskUnfinishedDarkSvg} 
                              />
                            </div>
            
                            <div className={css.homeTaskItemChildDiv}>
                              <div className={css.homeTaskHeaderDiv}>
                                <h5 className={css.homeTaskHeader}>{task.title}</h5>
                                <img  
                                  alt       = "home-task-date-svg"
                                  className =  {`${css.homeTaskDateIcon} ${css.homeMobileTaskDateIcon}`}
                                  src       = {profile.displayTheme === 'light' ? calendarLightSvg : calendarDarkSvg}  
                                />
                                <p className={`${css.homeTaskDate} ${css.homeMobileTaskDate}`}>{formatTaskDate(task.scheduledTime)}</p>
                              </div>

                              {new Date() > new Date(task.scheduledTime) && !task.completed ? (
                                <div className={css.homeTaskOverdueDiv}>
                                  <div className={css.homeTaskOverdueIndicator}></div>
                                  <p className={css.homeTaskOverdueText}>overdue</p>
                                </div>
                              ) : task.recurringType && (
                                <div className={css.homeTaskRepeatDiv}>
                                  <div className={css.homeTaskRepeatIndicator}></div>
                                  <p className={css.homeTaskRepeatText}>{task.recurringType}</p>
                                </div>
                              )}
            
                              <p className={css.homeTaskDescription}>{task.description}</p>
                            </div>
            
                            <div className={css.homeTaskDetailIconBtnDiv}>
                              <button className={css.homeTaskDetailIconBtn} onClick={() => { handleClickTask(task.id); }}>
                                <img  
                                  alt       = "home-task-detail-svg"
                                  className = {css.homeTaskDetailIcon}
                                  src       = {profile.displayTheme === 'light' ? arrowRightLightSvg : arrowRightDarkSvg} 
                                />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
 
                      {completedTask.length > 0 && viewTasks && (
                        completedTask.map((task) => (
                          <div key={task.id} className={`${css.homeTaskItem} ${css.homeFirstTaskItem} ${viewTasks ? css.fadeIn : ''}`}>
                            <div className={css.homeTaskStatusIconDiv}>
                              <img  
                                alt       = "home-task-status-svg"
                                className = {`${css.homeTaskIcon} ${css.homeTaskCompletedIcon}`}
                                src       = {profile.displayTheme === 'light' ? statusLightSvg : statusDarkSvg} 
                              />
                            </div>

                            <div className={css.homeTaskItemChildDiv}>
                              <div className={css.homeTaskHeaderChildDiv}>
                                <h5 className={css.homeTaskHeader}>{task.title}</h5> 
                                <img 
                                  alt       = "home-task-date-svg"
                                  className =  {`${css.homeTaskDateIcon} ${css.homeMobileTaskDateIcon}`}
                                  src       = {profile.displayTheme === 'light' ? calendarLightSvg : calendarDarkSvg} 
                                />
                                <p className={`${css.homeTaskDate} ${css.homeMobileTaskDate}`}>{formatTaskDate(task.scheduledTime)}</p>
                              </div>

                              <p className={css.homeTaskDescription}>{task.description}</p>
                            </div>

                            <div className={css.homeTaskDetailIconBtnDiv}>
                              <button className={css.homeTaskDetailIconBtn} onClick={() => { handleClickTask(task.id); }}>
                                <img   
                                  alt       = "home-task-detail-svg"
                                  className = {css.homeTaskDetailIcon}
                                  src       = {profile.displayTheme === 'light' ? arrowRightLightSvg : arrowRightDarkSvg} 
                                />
                              </button>
                            </div>
                          </div>
                        ))
                      )} 
                    </>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={css.homeParentColumnDiv}>
          <div className={css.homeTaskSuggestionList}> 
            {isTaskLoading ? ( 
              <> 
                <div className={css.homeSuggestionShimmerDivOne}>
                  <div className={css.homePlantsPairShimmerFlexDiv}>  
                    <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairEndShimmerFour}`}></div>
                  </div> 

                  <div className={css.homePlantsPairShimmerFlexDiv}> 
                    <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemOne}`}></div> 
                  </div> 
 
                  <div className={css.homePlantsPairShimmerFlexDiv}> 
                    <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemThree}`}></div>
                  </div> 

                  <div className={css.homePlantsPairShimmerFlexDiv}> 
                    <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairEndShimmerTwo}`}></div> 
                  </div>
                </div>

                <div className={css.homeSuggestionShimmerDivOne}>
                  <div className={css.homePlantsPairShimmerFlexDiv}> 
                    <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemOne}`}></div> 
                  </div> 

                  <div className={css.homePlantsPairShimmerFlexDiv}>  
                    <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairEndShimmerFour}`}></div>
                  </div> 
 
                  <div className={css.homePlantsPairShimmerFlexDiv}> 
                    <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemThree}`}></div>
                  </div> 

                  <div className={css.homePlantsPairShimmerFlexDiv}> 
                    <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemTwo}`}></div>  
                  </div>
                </div>
              </>
                      
            ) : ( suggestionTasks.length > 0 || !viewHintTasks ? (
              suggestionTasks.map((plant) => (
                <div className={`${css.homeTaskSuggestionItem}`}>
                  <div className={css.homeTaskSuggestionFlexDiv}>
                    <img  
                      alt       = "home-task-suggestion-svg" 
                      className = {css.homeTaskSuggestionIcon}
                      src       = {profile.displayTheme === 'light' ? plantGrowthLightSvg : plantGrowthDarkSvg} 
                    />
                    <p className={css.homeTaskSuggestionPlantName}>{plant.commonName}</p>
                  </div>

                  <div className={css.homeTaskSuggestionBtnFlexDiv}> 
                    <div  
                      className = {css.homePlantTaskIndicatorDiv}
                      onClick   = {() => handleClickPlant(plant.displayName ?? plant.commonName)}
                    >
                      <img  
                        alt       = "home-plant-info"
                        className = {css.homePlantTaskIndicatorIcon} 
                        src       = {profile.displayTheme === 'light' ? homeplantInfoLightIcon : homeplantInfoDarkIcon}  
                        />

                      <p className={css.homePlantTaskIndicatorText}>Details</p>
                    </div>

                    <button
                      className={css.homePlantsPairBookmarkBtn}
                      onClick={() => toggleBookmark({ title: plant.commonName, context: plant.taskRecommendations, type: 'task', })}
                    >
                      <img 
                        className={css.homeItemBookmarkBtnIcon} 
                        src={
                          bookmarkedTitles.has(plant.commonName)
                            ? profile.displayTheme === 'light' ? bookmarkLightIcon : bookmarkDarkIcon
                            : profile.displayTheme === 'light' ? unBookmarkLightIcon : unBookmarkDarkIcon
                        } 
                        alt="" 
                      />
                    </button>
                  </div>
 
                  <p className={css.homeTaskSuggestionDescription}>{plant.taskRecommendations}</p>
                </div>
               ))
            ) : (
              <div className={`${css.homeTaskSuggestionItem}`}>
                <div className={css.homeTaskSuggestionFlexDiv}>
                  <img 
                    alt       = "home-task-suggestion-svg" 
                    className = {css.homeTaskSuggestionIcon}
                    src       = {profile.displayTheme === 'light' ? plantGrowthLightSvg : plantGrowthDarkSvg} 
                  />
                  <p className={css.homeTaskSuggestionPlantName}>Planting tips</p>
                </div>
              
                <p className={css.homeTaskSuggestionDescription}>
                  Find your personalized plant growing tips based on your recent searches, favorite plants, and local climate.
                  If nothing shows up here, the recommendation feature might be temporarily unavailable.
                  Make sure you’ve selected your location and added plant interests to get the best matches.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
 

      {isShareModalOpen && (
        <div 
          className={`    
            ${css.homeClickedModalParentDiv}  
            ${css.fadeIn}
            ${profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}
          `}
        >
          <div className={`${css.homeClickedModalChildDiv} ${css.homeClickedModalShareDiv}`}>
            <div className={css.homeClickedModalMenu}>
              <a 
                className = {`${css.homeClickedModalMenuItem} ${activeModalTab === 'group' ? css.active : '' }`}
                onClick   = {handleGroupTabClick}
              ><p className={css.homeClickedModalLabel}>{shareGroups.length === 1 ? 'group' : 'groups'}</p>
              </a>
            
              <a 
                className = {`${css.homeClickedModalMenuItem} ${activeModalTab === 'user' ? css.active : '' }`}
                onClick   = {handleUsersTabClick}
              ><p className={css.homeClickedModalLabel}>{shareProfiles.length === 1 ? 'user' : 'users'}</p></a>
            </div>

            {activeModalTab === 'group' && shareGroups.length === 0 && (
              <div className={css.homeClickedModalUserListDiv}>
                <p className={`${css.homeClickedModalMessage} ${css.fadeIn}`}>Tasks are better shared in groups. Join one to begin !</p>
              </div>
            )}

            {activeModalTab === 'group' && shareProfiles.length === 0 && (
              <div className={css.homeClickedModalUserListDiv}>
                <p className={`${css.homeClickedModalMessage} ${css.fadeIn}`}>No users at the moment.</p>
              </div>
            )}

            {activeModalTab === 'group' && shareGroups.length > 0 && (
              <div className={css.homeClickedModalUserListDiv}>
                {shareGroups.map(group => (
                  <div key={`group-${group.id}`} className={css.homeClickedModalUserItem}>
                    <div className={css.homeClickedModalInputDiv}>
                      <input 
                        type      = "checkbox" 
                        style     = {{ display: 'none' }} 
                        id        = {`homeClickedModalInput-${group.id}`} 
                        className = {css.homeClickedModalInput} 
                        onChange  = {() => handleClickTaskCheckbox(group.id, 'group')} 
                        checked   = {isCheckboxChecked(group.id, 'group')}
                      />

                      <label 
                        htmlFor={`homeClickedModalInput-${group.id}`} 
                        className={css.homeClickedModalCheck}>
                        <svg width="18px" height="18px" viewBox="0 0 18 18">
                          <path d="M 1 9 L 1 9 c 0 -5 3 -8 8 -8 L 9 1 C 14 1 17 5 17 9 L 17 9 c 0 4 -4 8 -8 8 L 9 17 C 5 17 1 14 1 9 L 1 9 Z"></path>
                          <polyline points="1 9 7 14 15 4"></polyline>
                        </svg>
                      </label>
                    </div>

                    <img className={`${css.homeClickedModalUserIcon} ${css.fadeIn}`} src={group.groupIcon} alt={group.name}/>
                    <p className={`${css.homeClickedModalUsername} ${css.fadeIn}`}>{group.name}</p>
                  </div>
                ))}
              </div>
            )}


            {activeModalTab === 'user' && shareProfiles.length > 0 && (
              <div className={css.homeClickedModalUserListDiv}>
                {shareProfiles.map(user => (
                  <div key={`user-${user.id}`} className={css.homeClickedModalUserItem}>
                    <div className={css.homeClickedModalInputDiv}>
                      <input 
                        type      = "checkbox" 
                        style     = {{ display: 'none' }} 
                        id        = {`homeClickedModalInput-${user.id}`} 
                        className = {css.homeClickedModalInput} 
                        onChange  = {() => handleClickTaskCheckbox(user.id, 'user')} 
                        checked   = {isCheckboxChecked(user.id, 'user')}
                      />

                      <label 
                        htmlFor={`homeClickedModalInput-${user.id}`} 
                        className={css.homeClickedModalCheck}>
                        <svg width="18px" height="18px" viewBox="0 0 18 18">
                          <path d="M 1 9 L 1 9 c 0 -5 3 -8 8 -8 L 9 1 C 14 1 17 5 17 9 L 17 9 c 0 4 -4 8 -8 8 L 9 17 C 5 17 1 14 1 9 L 1 9 Z"></path>
                          <polyline points="1 9 7 14 15 4"></polyline>
                        </svg>
                      </label>
                    </div>
 
                    <img className={`${css.homeClickedModalUserIcon} ${css.fadeIn}`} src={user.profileIcon} alt={user.username}/>
                    <p className={`${css.homeClickedModalUsername} ${css.fadeIn}`}>{user.username}</p>
                  </div>
                ))}
              </div>
            )}

            <div className={css.homeClickedModalTextAreaDiv}>
              <textarea 
                rows        = {1} 
                value       = {shareTextMessage}
                placeholder = 'Add a caption ...' 
                className   = {css.homeClickedModalTextArea} 
                onChange    = {(e) => setShareTextMessage(e.target.value)}
              ></textarea>
            </div>
      
            <div className={css.homeClickedModalBtnDiv}>
              <button className={css.homeClickedModalShareBtn} onClick={() => handleShareItem()}>share</button>
              <button className={css.homeClickedModalCancelBtn} onClick={closeItemShareClick}>close</button>
            </div>
          </div>
        </div>
      )}
 

      {isDeleteModalOpen && (
        <div 
          className={`    
            ${css.homeClickedModalParentDiv}  
            ${css.fadeIn}
            ${profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}
          `}
        >
          <div className={`${css.homeClickedModalChildDiv} ${css.homeClickedModalDeleteDiv}`}>
            <div className={css.homeClickedModalDeleteChildDiv}>
              <h5 className={css.homeClickedItemHeader}>{taskDetail?.title}</h5>
              <p className={css.homeClickedDeleteModalText}>Are you sure you want to delete this task? This action cannot be undone.</p>
            </div>

            <div className={css.homeClickedDeleteBtnDiv}>
              <button className={css.homeClickedModalConfirmBtn} onClick={() => handleDeleteTask(taskDetail?.id)}>confirm</button>
              <button className={css.homeTaskClickedDeleteCancelBtn} onClick={closeTaskDeleteClick}>cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;