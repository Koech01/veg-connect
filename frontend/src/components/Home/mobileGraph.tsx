import css from '../Home/index.module.css';
import { useEffect, useState } from 'react'; 
import homeInfoDarkIcon from '../assets/infoCircledDark.svg'; 
import homeInfoLightIcon from '../assets/infoCircledLight.svg';
import { ProfileProps, GroupProps, PlantProps } from '../types/index';


const MobileGraph: React.FC<ProfileProps> = ({ profile }) => {
 
  const [groupDetail, setGroupDetail]       = useState<GroupProps | null>(null);
  const [forumMessage, setForumMessage]     = useState('');
  const [groupLoading, setGroupLoading]     = useState(true); 
  const [visibleGroup, setVisibleGroup]     = useState(false);
  const [graphLoading, setGraphLoading]     = useState(true);
  const [visibleGraph, setVisibleGraph]     = useState(false);
  const [visiblePlants, setVisiblePlants]   = useState(false);
  const [statsPlants, setStatsPlants]       = useState<PlantProps[]>([]);
  const [maxGrowingDays, setMaxGrowingDays] = useState(400);
  const [barHeights, setBarHeights]         = useState<{ height: string; plantName: string; growingDays: string }[]>([]);
  const initialBarHeights                   = statsPlants.map(plant => ({
    height     : '0px',  
    plantName  : plant.plantName,
    growingDays: plant.growingDays
  }));


  const fetchForumSuggestion = async () => {
    try {
    const token    = localStorage.getItem('token');
    const response = await fetch('http://127.0.0.1:8000/api/v1/groups/suggest/', {
      method      : 'GET',
      headers     : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      credentials : 'include',
    })

    if (response.ok) {
      const data = await response.json();
      if (data.message) { setForumMessage(data.message); } 
      else              { setGroupDetail(data); }
    }

    else { console.error('Failed to fetch group suggestion: ', response.status) }
    }

  catch (error) { console.error('Error fetching group suggestion: ', error); }
  };


  const handleJoinGroup = async(groudId?: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/groups/${groudId}/join/`, {
        method      : 'PATCH',
        headers     : { 'Content-Type': 'application/json','Authorization': `Bearer ${token}` },
        credentials : 'include'
      });
  
      if (response.ok) { fetchForumSuggestion(); }
      
      else { console.error('Failed to join group: ', response.status); }
    } catch (error) { console.error('Error joining group:', error); }
  };


  useEffect(() => {
    (async () => {
      try {
        const token    = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/api/v1/plants/days/', {
          method      : 'GET',
          headers     : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          credentials : 'include',
        })

        if (response.ok) {
          const data = await response.json();
          setStatsPlants(data);

          const maxDays = Math.max(...data.map((plant: PlantProps) => parseInt(plant.growingDays, 10)));
          setMaxGrowingDays(Math.ceil(maxDays / 100) * 100);
        }

        else { console.error('Failed to fetch plants: ', response.status); }
      }
      catch (error) { console.error('Error fetching plants: ', error); }
    })();
  }, []);


  useEffect(() => { fetchForumSuggestion(); }, []);


  useEffect(() => { 
    const timer = setTimeout(() => { 
      setVisibleGroup(true);  
      setGroupLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchForumSuggestion]);


  useEffect(() => { 
    setBarHeights(initialBarHeights);
    const timer = setTimeout(() => { 
      setVisibleGraph(true); 
      setVisiblePlants(true); 
      setVisibleGroup(true);  
      setGraphLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [statsPlants]);


  useEffect(() => {
    if (visibleGraph) {
      const heightDelayTimer = setTimeout(() => {
        const updatedBarHeights = statsPlants.map(plant => ({
          height     : `${(parseInt(plant.growingDays) / maxGrowingDays) * 100}%`,
          plantName  : plant.plantName,
          growingDays: plant.growingDays
        }));

        setBarHeights(updatedBarHeights);
      }, 100); 
      return () => clearTimeout(heightDelayTimer); 
    }
  }, [visibleGraph, statsPlants]);
    

  return (
    <div className={`${css.mobileParentDiv} ${profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}>
      <div className={css.mobileParentDiv}>
        <div className={css.mobileGraphChildDiv}>

          {groupLoading ? (
            <>
              <div className={css.mobileCardShimmer}>
                <div className={css.homeCardShimmerChildDiv}> 
                  <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemOne}`}></div> 
                </div> 

                <div className={css.homeCardShimmerChildDiv}> 
                  <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemThree}`}></div> 
                </div>
              </div>
            </>
          ) : ( visibleGroup && (
            <div className={`${css.homeForumParentDiv} ${visibleGroup ? css.fadeIn : ''}`}>
              <div className={css.homeForumCardDiv}>
                <div className={`${css.homeForumCardChildDiv} ${css.homeForumNameDiv}`}>

                  {forumMessage ? (
                    <div className={css.homeForumIconDiv}>
                      <img 
                        alt       = "home-forum-icon"
                        className = {css.homeForumIconPlaceholder}  
                        src       = {profile.displayTheme === 'light' ? homeInfoLightIcon : homeInfoDarkIcon} 
                      />
                      <p className={css.homeForumMessageHeader}>group recommendations</p>
                    </div>
                  ): (
                    <img alt="home-forum-icon" className={css.homeForumIcon} src={groupDetail?.groupIcon}/>
                  )}
                
                  <div className={css.homeForumCardNameDiv}>
                    {!forumMessage && (
                      <>
                        <p className={css.homeForumCardName}>{groupDetail?.name}</p>
                        <button className={css.homeForumJoinBtn} onClick={() => handleJoinGroup(groupDetail?.id)}>Join</button>
                      </>
                    )} 
                  </div>
                </div>

                <div className={`${css.homeForumCardChildDiv} ${css.homeForumEndDiv}`}>
                  <p className={css.homeForumDescription}>{forumMessage ? forumMessage : groupDetail?.description}</p>
                </div>
              </div>
            </div>
          )
          )}

          {graphLoading ? (
            <>
              <div className={css.homeGraphAndForumShimmerDiv}>
                <div className={`${css.homeGraphShimmerBar} ${css.shimmerBarFour}`}></div>
                <div className={`${css.homeGraphShimmerBar} ${css.shimmerBarOne}`}></div>
                <div className={`${css.homeGraphShimmerBar} ${css.shimmerBarTwo}`}></div>
                <div className={`${css.homeGraphShimmerBar} ${css.shimmerBarThree}`}></div>
                <div className={`${css.homeGraphShimmerBar} ${css.shimmerBarFour}`}></div>
                <div className={`${css.homeGraphShimmerBar} ${css.shimmerBarOne}`}></div>
              </div>
            </>
          ) : (
              visibleGraph && (
              <div className={`${css.homeStatsChildDiv} ${visibleGraph ? css.fadeIn : ''}`}>
                <div className={css.homeStatBarGraph}> 
                  {barHeights.map((bar, index) => (
                    <div key={index} className={css.homeStatGraphBarItem}>
                      <div className={css.homeStatGraphBar} style={{ height: bar.height }}></div>
                      <p className={css.homeStatCalibrationLabel}>Bar {index + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
          )
          )}

          {graphLoading ? (
            <>
              <div className={css.homeStatBarGraphKeysShimmer}>
                <div className={css.homeStatBarFlexShimmerDiv}> 
                  <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemOne}`}></div> 
                </div> 
                <div className={css.homeStatBarFlexShimmerDiv}> 
                  <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemTwo}`}></div> 
                  <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarEndShimmerTwo}`}></div>
                </div>
                <div className={css.homeStatBarFlexShimmerDiv}> 
                  <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemThree}`}></div>
                  <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarEndShimmerThree}`}></div> 
                </div> 
                <div className={css.homeStatBarFlexShimmerDiv}> 
                  <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemFour}`}></div> 
                  <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarEndShimmerFour}`}></div>
                </div>  
                <div className={css.homeStatBarFlexShimmerDiv}> 
                  <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarItemThree}`}></div>
                  <div className={`${css.homeStatBarItemShimmer} ${css.homeStatBarEndShimmerThree}`}></div> 
                </div> 
              </div>
            </>
          ) : ( visiblePlants && (
            <div className={`${css.homeStatBarGraphKeysParent} ${visiblePlants ? css.fadeIn : ''}`}>
              <p className={css.homeStatBarGraphLabel}>Approximate plants growth days</p>
              {barHeights.map((bar, index) => (
                <div key={index} className={css.homeStatBarGraphKeysItemDiv}>
                  <p className={css.homeStatBarGraphKeyLabel}>Bar {index + 1}</p>
                  <p className={css.homeStatBarGraphKeyPlant}>{bar.plantName}</p>
                  <p className={css.homeStatBarGraphKeyDays}>{bar.growingDays} days</p>
                </div>
              ))}
            </div>
          )
          )}
 
        </div>
      </div>
    </div>
  );
};

export default MobileGraph; 