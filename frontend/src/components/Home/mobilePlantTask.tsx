import css from '../Home/index.module.css';
import { useEffect, useState } from 'react'; 
import { useAuth } from '../Auth/authContext';
import mainCss from '../Bookmark/index.module.css';  
import bookmarkDarkIcon from '../assets/bookmarkDark.svg'; 
import bookmarkLightIcon from '../assets/bookmarkLight.svg'; 
import unBookmarkDarkIcon from '../assets/unBookmarkDark.svg'; 
import plantGrowthDarkSvg from '../assets/plantGrowthDark.svg';
import unBookmarkLightIcon from '../assets/unBookmarkLight.svg'; 
import homeplantInfoDarkIcon from '../assets/plantInfoDark.svg';
import plantGrowthLightSvg from '../assets/plantGrowthLight.svg';
import homeplantInfoLightIcon from '../assets/plantInfoLight.svg';
import homePlantPairDarkIcon from '../assets/homePlantPairDark.svg'; 
import homePlantPairLightIcon from '../assets/homePlantPairLight.svg';
import type { ProfileProps, PlantProps, Bookmark } from '../types/index';  


const MobilePlantTask: React.FC<ProfileProps> = ({ profile }) => {
 
    const { accessToken }                               = useAuth();
    const [activePage, setActivePage]                   = useState('PlantPair');  
    const [isTaskLoading, setTaskLoading]               = useState(true);
    const [viewHintTasks, setViewHintTasks]             = useState(false);
    const [suggestionTasks, setSuggestionTasks]         = useState<PlantProps[]>([]);
    const [visiblePlantPair, setVisiblePlantPair]       = useState(false); 
    const [plantPair, setPlantPair]                     = useState<Bookmark[]>([]);
    const [visibleBookmarkTask, setVisibleBookmarkTask] = useState(true);
    const [viewTaskBookmarks, setViewTaskBookmarks]     = useState(false);
    const [taskBookmarks, setTaskBookmarks]             = useState<Bookmark[]>([]); 


    const handlePlantPairClick         = () => { setActivePage('PlantPair'); };
    const handlePlantPairBookmarkClick = () => { setActivePage('PlantPairBookmark'); };
    const handlePlantTaskClick         = () => { setActivePage('PlantTaskBookmark'); };


    const fetchPlantTaskSuggestions = async () => {
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
    };
     

    const fetchUserBookmarks = async () => {
        setVisiblePlantPair(false);
        setViewTaskBookmarks(false);

        try {
        const response = await fetch('/api/v1/home/bookmark/list/', {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            },
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
    
            setPlantPair(data.plantPairs);   
            setTaskBookmarks(data.tasks);

            if (data.tasks.length === 0) setViewTaskBookmarks(true);
        } else {
            console.error('Failed to fetch bookmarks:', response.status);
            setPlantPair([]);
            setViewTaskBookmarks(true);
        }
        } 
        
        catch (error) {
        console.error('Error fetching recommendations:', error);
            setPlantPair([]);
            setViewTaskBookmarks(true);
        } 
        
        finally {
            setVisiblePlantPair(true);
            setVisibleBookmarkTask(false);
        }
    };


    const toggleBookmark = async (bookmark: { title: string; context: string; type: 'plantPair' | 'task'; }) => {
        try {
        const response = await fetch('/api/v1/home/bookmark/', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body   : JSON.stringify(bookmark),
        });
    
        if (response.status === 204) {
            if (bookmark.type === 'plantPair') { setPlantPair(prev => prev.filter(p => p.context !== bookmark.context));  } 
            else if (bookmark.type === 'task') { setTaskBookmarks(prev => prev.filter(t => t.context !== bookmark.context)); }
        }  
            
        else { console.error('Failed to toggle bookmark:', response.status); } 
        } 
        
        catch (error) { console.error('Error toggling bookmark:', error); }
    };


    useEffect(() => { 
        fetchPlantTaskSuggestions();
        fetchUserBookmarks();
    }, []);

 
    useEffect(() => { 
        const timer = setTimeout(() => { setViewHintTasks(true); }, 300);
        return () => clearTimeout(timer);
    }, []);
    

    return (
        <div
        className={`
        ${css.mobileParentDiv} 
        ${profile.displayTheme === 'dark' ? `${css.darkTheme} ${mainCss.darkTheme}` : `${css.lightTheme} ${mainCss.lightTheme}`}
        `}>

            <div className={css.mobileParentDiv}>
                <div className={css.mobilePlantTaskDiv}>
 
                    <div className={css.mobilePlantMenuDiv}>
                        <button 
                            className = {`${css.mobilePlantMenuItem} ${activePage === 'PlantPair' ? css.active : '' }`}
                            onClick   = {handlePlantPairClick}
                        >Home</button>

                        <button 
                            className = {`${css.mobilePlantMenuItem} ${activePage === 'PlantPairBookmark' ? css.active : '' }`}
                            onClick   = {handlePlantPairBookmarkClick}
                        >Plant Pair</button>

                        <button 
                            className = {`${css.mobilePlantMenuItem} ${activePage === 'PlantTask' ? css.active : '' }`}
                            onClick   = {handlePlantTaskClick}
                        >Task Tips</button>
                    </div>

 
                    {activePage === 'PlantPair' && (
 
                        <div className={css.mobilePlantTaskListDiv}> 
                            {isTaskLoading ? ( 
                                <> 
                                    <div className={css.mobileuggestionShimmerDiv}>
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

                                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemThree}`}></div>
                                        </div>  
                                    </div>

                                    <div className={css.mobileuggestionShimmerDiv}>
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

                                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemThree}`}></div>
                                        </div>  
                                    </div>

                                    <div className={css.mobileuggestionShimmerDiv}>
                                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemThree}`}></div>
                                        </div> 

                                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemTwo}`}></div>  
                                        </div>

                                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemThree}`}></div>
                                        </div> 

                                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairEndShimmerTwo}`}></div> 
                                        </div>

                                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemThree}`}></div>
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
                                        
                                        <div className = {css.homePlantTaskIndicatorDiv}>
                                            <img  
                                            alt       = "home-plant-info"
                                            className = {css.homePlantTaskIndicatorIcon} 
                                            src       = {profile.displayTheme === 'light' ? homeplantInfoLightIcon : homeplantInfoDarkIcon}  
                                            />

                                            <p className={css.homePlantTaskIndicatorText}>Details</p>
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
                                    
                                    <p className={css.homeTaskSuggestionDescription}>Tailored plant care tips appear here.</p>
                                </div>
                                ))
                            }
                        </div>  
                    )}


                    {activePage === 'PlantPairBookmark' && (
                        <div className={css.mobilePlantTaskListDiv}> 
 
                            {!visiblePlantPair ? (
                                <div className={css.homePlantsPairShimmerParentDiv}>  
                                {Array.from({ length: 3 }).map((_, groupIndex) => (
                                    <div key={groupIndex} className={css.homePlantsPairShimmerDiv}>
                                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                                        <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairTextOne}`}></div> 
                                        </div> 
                                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                                        <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairTextTwo}`}></div>
                                        </div>
                                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                                        <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairTextThree}`}></div> 
                                        </div> 
                                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                                        <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairTextThree}`}></div>
                                        </div>
                                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                                        <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairTextTwo}`}></div>
                                        </div> 
                                    </div>  
                                    ))}  
                                </div>
                                ) : plantPair.length > 0 ? ( 
                                plantPair.map((plant) => (
                                    <div key={plant.id} className={`${css.homePlantsPairChildDiv} ${plantPair ? css.fadeIn : ''}`}>
                                        <div className={mainCss.homePlantsPairHeaderDiv}>
                                            <img 
                                                alt       = "home-plant-pair-icon"
                                                className = {css.homePlantsPairHeaderIcon}  
                                                src       = {profile.displayTheme === 'light' ? homePlantPairLightIcon : homePlantPairDarkIcon} 
                                            />
                            
                                            <button
                                                className={css.homePlantsPairBookmarkBtn}
                                                onClick={() => toggleBookmark({ title: 'Plant Pair', context: plant.context, type: 'plantPair', })}
                                            >
                                                <img 
                                                    className={css.homeItemBookmarkBtnIcon} 
                                                    src={
                                                    plantPair.some((p) => p.context === plant.context)
                                                        ? profile.displayTheme === 'light' ? bookmarkLightIcon : bookmarkDarkIcon
                                                        : profile.displayTheme === 'light' ? unBookmarkLightIcon : unBookmarkDarkIcon
                                                    }
                                                alt="bookmark-icon" 
                                                />
                                            </button>  
                                        </div>
                                        
                                        <p className={css.homePlantsPairDescription}>{plant.context}</p>
                                    </div> 
                                ))
                                ) : (
                                <div className={`${css.homePlantsPairChildDiv} ${plantPair ? css.fadeIn : ''}`}>
                                    <div className={css.homePlantsPairPlaceholderDiv}>
                                        <img 
                                            alt       = "home-plant-pair-icon"
                                            className = {css.homePlantsPairHeaderIcon}  
                                            src       = {profile.displayTheme === 'light' ? homePlantPairLightIcon : homePlantPairDarkIcon} 
                                        />
                                        <h4 className={css.homePlantsPairHeader}>Empty pairing tips bookmark.</h4>
                                    </div>
                                    
                                    <p className={css.homePlantsPairDescription}> 
                                        Plant pairing suggestions are recommended based on your plant interests, recent searches, and local climate.
                                    </p>
                                </div> 
                            )} 
                        </div> 
                    )}


                    {activePage === 'PlantTaskBookmark' && (
                        <div className={css.mobilePlantTaskListDiv}> 

                            {visibleBookmarkTask ? ( 
                                <>  
                                {Array.from({ length: 3 }).map((_, groupIndex) => (
                                    <div key={groupIndex} className={css.homeSuggestionShimmerDivOne}>
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
                                ))} 
                                </>
                                        
                            ) : ( taskBookmarks.length > 0 || !viewTaskBookmarks ? (
                                taskBookmarks.map((task) => (
                                <div key={task.id} className={`${css.homeTaskSuggestionItem}`}>
                                    <div className={mainCss.homeTaskSuggestionFlexDiv}>
                                        <img  
                                            alt       = "home-task-suggestion-svg" 
                                            className = {css.homeTaskSuggestionIcon}
                                            src       = {profile.displayTheme === 'light' ? plantGrowthLightSvg : plantGrowthDarkSvg} 
                                        />
                                        <p className={css.homeTaskSuggestionPlantName}>{task.title}</p>
                                        
                                        <div className={css.homePlantsPairBookmarkBtnDiv}> 
                                            <button
                                                className={css.homePlantsPairBookmarkBtn}
                                                onClick={() => toggleBookmark({ title: task.title, context: task.context, type: 'task', })}
                                            >
                                            <img 
                                            className={css.homeItemBookmarkBtnIcon} 
                                                src={
                                                taskBookmarks.some((t) => t.context === task.context)
                                                    ? profile.displayTheme === 'light' ? bookmarkLightIcon : bookmarkDarkIcon
                                                    : profile.displayTheme === 'light' ? unBookmarkLightIcon : unBookmarkDarkIcon
                                                }
                                            alt="bookmark-icon" 
                                            />
                                            </button>
                                        </div> 
                                    </div>
                                    
                                    <p className={css.homeTaskSuggestionDescription}>{task.context}</p>
                                </div>
                                ))
                            ) : (
                                <div className={`${mainCss.homeMobileTaskSuggestionItem}`}>
                                    <div className={css.homeTaskSuggestionFlexDiv}>
                                        <img 
                                            alt       = "home-task-suggestion-svg" 
                                            className = {css.homeTaskSuggestionIcon}
                                            src       = {profile.displayTheme === 'light' ? plantGrowthLightSvg : plantGrowthDarkSvg} 
                                        />
                                        <p className={css.homeTaskSuggestionPlantName}>Empty plant growing tips bookmarks.</p>
                                    </div>
                                    
                                    <p className={css.homeTaskSuggestionDescription}>Plant growing tips are recommended based on your plant interests, recent searches, and local climate.</p>
                                </div>
                            ))} 
                        </div> 
                    )}

                </div>
            </div>
        </div>
    );
};

export default MobilePlantTask; 