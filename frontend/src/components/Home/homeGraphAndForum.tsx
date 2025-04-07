import css from '../Home/index.module.css';
import { useEffect, useState } from 'react';
import { PlantProps, GroupProps } from '../types/index';
import homeInfoDarkIcon from '../assets/infoCircledDark.svg'; 
import homeInfoLightIcon from '../assets/infoCircledLight.svg';


interface HomeGraphAndForumProps {
    statsPlants    : PlantProps[],
    maxGrowingDays : number,
    groupDetail    : GroupProps | null,
    forumMessage   : string
    onGroupJoin    : () => void;  
    theme          : string
  
}


const HomeGraphAndForum: React.FC<HomeGraphAndForumProps> = ({ 
    statsPlants, maxGrowingDays, groupDetail, forumMessage, onGroupJoin, theme
}) => {
    const [graphLoading, setGraphLoading]   = useState(true);
    const [visibleGraph, setVisibleGraph]   = useState(false);
    const [visiblePlants, setVisiblePlants] = useState(false);
    const [visibleGroup, setVisibleGroup]   = useState(false);
    const [barHeights, setBarHeights]       = useState<{ height: string; plantName: string; growingDays: string }[]>([]);
    const initialBarHeights                 = statsPlants.map(plant => ({
        height     : '0px',  
        plantName  : plant.plantName,
        growingDays: plant.growingDays
    }));

    
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


    const handleJoinGroup = async(groudId?: number) => {
        const token = localStorage.getItem('token');
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/v1/groups/${groudId}/join/`, {
            method      : 'PATCH',
            headers     : { 'Content-Type': 'application/json','Authorization': `Bearer ${token}` },
            credentials : 'include'
          });
      
          if (response.ok) { onGroupJoin(); }
          
          else { console.error('Failed to join group: ', response.status); }
        } catch (error) { console.error('Error joining group:', error); }
    };

    
    return (
        <div className={css.homeGraphAndForumParentDiv}>
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

            {graphLoading ? (
                <>
                    <div className={css.homeForumCardShimmer}>
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
                                        src       = {theme === 'light' ? homeInfoLightIcon : homeInfoDarkIcon} 
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
        </div>
    );
};

export default HomeGraphAndForum;