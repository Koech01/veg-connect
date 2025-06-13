import css from '../Home/index.module.css';  
import { useEffect, useState } from 'react'; 
import { useAuth } from '../Auth/authContext'; 
import mainCss from '../Bookmark/index.module.css';  
import bookmarkDarkIcon from '../assets/bookmarkDark.svg'; 
import bookmarkLightIcon from '../assets/bookmarkLight.svg'; 
import unBookmarkDarkIcon from '../assets/unBookmarkDark.svg'; 
import plantGrowthDarkSvg from '../assets/plantGrowthDark.svg'; 
import unBookmarkLightIcon from '../assets/unBookmarkLight.svg'; 
import plantGrowthLightSvg from '../assets/plantGrowthLight.svg';  
import { type ProfileProps, type Bookmark } from '../types/index'; 
import homePlantPairDarkIcon from '../assets/homePlantPairDark.svg'; 
import homePlantPairLightIcon from '../assets/homePlantPairLight.svg';


const Boomark: React.FC<ProfileProps> = ({ profile }) => {

  const { accessToken }                         = useAuth(); 
  const [visiblePlantPair, setVisiblePlantPair] = useState(false); 
  const [plantPair, setPlantPair]               = useState<Bookmark[]>([]);
  const [isTaskLoading, setTaskLoading]         = useState(true);
  const [viewHintTasks, setViewHintTasks]       = useState(false);
  const [suggestionTasks, setSuggestionTasks]   = useState<Bookmark[]>([]); 
  
  const fetchUserBookmarks = async () => {
    setVisiblePlantPair(false);
    setViewHintTasks(false);

    try {
      const response = await fetch('/api/v1/home/bookmark/list/', {
        method     : 'GET',
        headers    : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
 
        setPlantPair(data.plantPairs);   
        setSuggestionTasks(data.tasks);

        if (data.tasks.length === 0) setViewHintTasks(true);
      } else {
        console.error('Failed to fetch bookmarks:', response.status);
        setPlantPair([]);
        setViewHintTasks(true);
      }
    } 
    
    catch (error) {
      console.error('Error fetching recommendations:', error);
      setPlantPair([]);
      setViewHintTasks(true);

    } 
    
    finally {
      setVisiblePlantPair(true);
      setTaskLoading(false);
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
        else if (bookmark.type === 'task') { setSuggestionTasks(prev => prev.filter(t => t.context !== bookmark.context)); }
      }  
        
      else { console.error('Failed to toggle bookmark:', response.status); } 
    } 
    
    catch (error) { console.error('Error toggling bookmark:', error); }
  };


  useEffect( () => { fetchUserBookmarks(); }, [])


  return (
    <div 
    className={`
      ${mainCss.bookmarkParentDiv} 
      ${profile.displayTheme === 'dark' ? `${css.darkTheme} ${mainCss.darkTheme}` : `${css.lightTheme} ${mainCss.lightTheme}`}
    `}>
  

      <div className={mainCss.bookmarkLeftChildDiv}> 
        {!visiblePlantPair ? (
          <div className={mainCss.homePlantsPairShimmerParentDiv}>  
           {Array.from({ length: 3 }).map((_, groupIndex) => (
              <div key={groupIndex} className={mainCss.homePlantsPairShimmerDiv}>
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
            <div key={plant.id} className={`${mainCss.homePlantsPairChildDiv} ${plantPair ? css.fadeIn : ''}`}>
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
          <div className={`${mainCss.homePlantsPairChildDiv} ${plantPair ? css.fadeIn : ''}`}>
            <div className={mainCss.homePlantsPairPlaceholderDiv}>
              <img 
                alt       = "home-plant-pair-icon"
                className = {css.homePlantsPairHeaderIcon}  
                src       = {profile.displayTheme === 'light' ? homePlantPairLightIcon : homePlantPairDarkIcon} 
              />
              <h4 className={css.homePlantsPairHeader}>You haven’t bookmarked any plant pairing tips yet.</h4>
            </div>
            
            <p className={css.homePlantsPairDescription}> 
              Plant pairing suggestions are recommended based on your plant interests, recent searches, and local climate.
            </p>
          </div> 
        )}

      </div>


      <div className={mainCss.bookmarkRightChildDiv}>  
        {isTaskLoading ? ( 
          <>  
            {Array.from({ length: 3 }).map((_, groupIndex) => (
              <div key={groupIndex} className={mainCss.homeSuggestionShimmerDivOne}>
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
                  
        ) : ( suggestionTasks.length > 0 || !viewHintTasks ? (
          suggestionTasks.map((task) => (
            <div key={task.id} className={`${mainCss.homeTaskSuggestionItem}`}>
              <div className={mainCss.homeTaskSuggestionFlexDiv}>
                <img  
                  alt       = "home-task-suggestion-svg" 
                  className = {css.homeTaskSuggestionIcon}
                  src       = {profile.displayTheme === 'light' ? plantGrowthLightSvg : plantGrowthDarkSvg} 
                />
                <p className={mainCss.homeTaskSuggestionPlantName}>{task.title}</p>
                
                <div className={css.homePlantsPairBookmarkBtnDiv}> 
                  <button
                    className={css.homePlantsPairBookmarkBtn}
                    onClick={() => toggleBookmark({ title: task.title, context: task.context, type: 'task', })}
                  >
                    <img 
                      className={css.homeItemBookmarkBtnIcon} 
                      src={
                        suggestionTasks.some((t) => t.context === task.context)
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
          <div className={`${mainCss.homeTaskSuggestionItem}`}>
            <div className={css.homeTaskSuggestionFlexDiv}>
              <img 
                alt       = "home-task-suggestion-svg" 
                className = {css.homeTaskSuggestionIcon}
                src       = {profile.displayTheme === 'light' ? plantGrowthLightSvg : plantGrowthDarkSvg} 
              />
              <p className={css.homeTaskSuggestionPlantName}>You haven’t bookmarked any plant growing/gardening tips yet.</p>
            </div>
          
            <p className={css.homeTaskSuggestionDescription}>Plant growing tips are recommended based on your plant interests, recent searches, and local climate.</p>
          </div>
        ))}  
      </div>

    </div>
  );
};

export default Boomark;