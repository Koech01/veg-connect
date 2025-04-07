import css from '../Home/index.module.css';
import { useEffect, useState } from 'react'; 
import plantGrowthDarkSvg from '../assets/plantGrowthDark.svg';
import plantGrowthLightSvg from '../assets/plantGrowthLight.svg';
import { ProfileProps, TaskSuggestionProps } from '../types/index';


const MobileInsights: React.FC<ProfileProps> = ({ profile }) => {
 
    const [isTaskLoading, setTaskLoading]       = useState(true);
    const [viewHintTasks, setViewHintTasks]     = useState(false);
    const [suggestionTasks, setSuggestionTasks] = useState<TaskSuggestionProps[]>([]);


    const fetchUserTasks = async () => {
        try {
            const token    = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:8000/api/v1/home/tasks/insights/', {
                method      : 'GET',
                headers     : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                credentials : 'include',
            })

            if (response.ok) {
                const data                                = await response.json();
                const suggestions : TaskSuggestionProps[] = data.suggestions;
        
                setSuggestionTasks(suggestions);
                setTaskLoading(false);
            }

            else { 
                console.error('Failed to fetch tasks: ', response.status);
                setTaskLoading(false);
            }
        
            await fetch('http://127.0.0.1:8000/api/v1/tasks/create/suggestions/', {
                method      : 'POST',
                headers     : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                credentials : 'include',
            });
        }
        catch (error) { 
            console.error('Error fetching tasks: ', error);
            setTaskLoading(false);
        }
    };
     

    useEffect(() => { fetchUserTasks(); }, []);
 

    useEffect(() => { 
        const timer = setTimeout(() => { setViewHintTasks(true); }, 300);
        return () => clearTimeout(timer);
    }, []);
    

    return (
        <div className={`${css.mobileParentDiv} ${profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}>
            <div className={css.mobileParentDiv}>
                <div className={css.mobileInsightChildDiv}>
                    <div className={css.mobileInsightListDiv}> 
                        {isTaskLoading ? ( 
                            <> 
                                <div className={css.mobileuggestionShimmerDiv}>
                                    <div className={css.homeStatBarFlexShimmerDiv}>  
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarEndShimmerFour}`}></div>
                                    </div> 

                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemOne}`}></div> 
                                    </div> 

                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemThree}`}></div>
                                    </div> 

                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarEndShimmerTwo}`}></div> 
                                    </div>

                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemThree}`}></div>
                                    </div>  
                                </div>

                                <div className={css.mobileuggestionShimmerDiv}>
                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemOne}`}></div> 
                                    </div> 

                                    <div className={css.homeStatBarFlexShimmerDiv}>  
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarEndShimmerFour}`}></div>
                                    </div> 

                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemThree}`}></div>
                                    </div> 

                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemTwo}`}></div>  
                                    </div>

                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemThree}`}></div>
                                    </div>  
                                </div>

                                <div className={css.mobileuggestionShimmerDiv}>
                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemThree}`}></div>
                                    </div> 

                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemTwo}`}></div>  
                                    </div>

                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemThree}`}></div>
                                    </div> 

                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarEndShimmerTwo}`}></div> 
                                    </div>

                                    <div className={css.homeStatBarFlexShimmerDiv}> 
                                        <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemThree}`}></div>
                                    </div>  
                                </div>
                            </>
                                
                            ) : ( suggestionTasks.length > 0 || !viewHintTasks ? (
                            suggestionTasks.map((task) => (
                                <div className={`${css.homeTaskSuggestionItem}`}>
                                    <div className={css.homeTaskSuggestionFlexDiv}>
                                        <img  
                                            alt       = "home-task-suggestion-svg" 
                                            className = {css.homeTaskSuggestionIcon}
                                            src       = {profile.displayTheme === 'light' ? plantGrowthLightSvg : plantGrowthDarkSvg} 
                                        />
                                        <p className={css.homeTaskSuggestionPlantName}>{task.plant.plantName}</p>
                                    </div>
                                    
                                    <p className={css.homeTaskSuggestionDescription}>{task.description}</p>
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
                </div>
            </div>
        </div>
    );
};

export default MobileInsights; 