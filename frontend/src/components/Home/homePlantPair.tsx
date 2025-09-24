import css from '../Home/index.module.css'; 
import { useAuth } from '../Auth/authContext';
import { useEffect, useState, useRef } from 'react';
import bookmarkDarkIcon from '../assets/bookmarkDark.svg';
import bookmarkLightIcon from '../assets/bookmarkLight.svg'; 
import homeInfoDarkIcon from '../assets/infoCircledDark.svg'; 
import unBookmarkDarkIcon from '../assets/unBookmarkDark.svg';
import homeInfoLightIcon from '../assets/infoCircledLight.svg'; 
import unBookmarkLightIcon from '../assets/unBookmarkLight.svg'; 
import homePlantPairDarkIcon from '../assets/homePlantPairDark.svg'; 
import homePlantPairLightIcon from '../assets/homePlantPairLight.svg';
import homePlantRankUpDarkIcon from '../assets/homePlantRankUpDark.svg'; 
import homePlantRankUpLightIcon from '../assets/homePlantRankUpLight.svg';
import homePlantRankDownDarkIcon from '../assets/homePlantRankDownDark.svg'; 
import homePlantRankDownLightIcon from '../assets/homePlantRankDownLight.svg';
import { type GroupProps, type PlantRank, type BookmarkPayload } from '../types/index';  


interface HomePlantCompanionAndGroupsProps { theme : string }


const HomePlantCompanionAndGroups: React.FC<HomePlantCompanionAndGroupsProps> = ({ theme }) => {
    
    const { accessToken }                         = useAuth();
    const hasFetchedPairRef                       = useRef(false);
    const [visiblePlantPair, setVisiblePlantPair] = useState(false);
    const [visiblePlantList, setVisiblePlantList] = useState(false);
    const [visibleGroup, setVisibleGroup]         = useState(false);
    const [plantPair, setPlantPair]               = useState('');
    const [isBookmarked, setIsBookmarked]         = useState(false);
    const [groupDetail, setGroupDetail]           = useState<GroupProps | null>(null);
    const [forumMessage, setForumMessage]         = useState('');
    const [rankedPlants, setRankedPlants]         = useState<PlantRank[]>([]);

 
    const fetchPlantPairRecommendations = async () => {
        if (hasFetchedPairRef.current) return;  
        hasFetchedPairRef.current = true;

        setVisiblePlantPair(false);

        try { 
            const response = await fetch('/api/v1/home/recommendations/', {
            method      : 'GET',
            headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            credentials : 'include',
            })

            if (response.ok) {
                const data            = await response.json(); 
                const companionPlants = data.companionPlants; 
                setPlantPair(companionPlants);  
                setVisiblePlantPair(true);
            }

            else {
                console.error('Failed to fetch plants pair recommendations: ', response.status);
                setPlantPair('');  
            }
 
        }
        
        catch (error) {
            console.error('Error fetching plants pair recommendations: ', error);
            setPlantPair('');
        } 
        
        finally { setVisiblePlantPair(true); }
    };

 
    const fetchGroupPlantsRanks = async () => { 
        setVisiblePlantList(false);

        try { 
            const response = await fetch('/api/v1/home/ranks/', {
                method      : 'GET',
                headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                credentials : 'include',
            })

            if (response.ok) {
                const data: PlantRank[] = await response.json();
                setRankedPlants(data);
            } 
            
            else {
                console.error('Failed to fetch group suggestion: ', response.status);
                setRankedPlants([]);  
            }
        }

        catch (error) {
            console.error('Error fetching group suggestion: ', error);
            setRankedPlants([]);  
        } 
        
        finally { setVisiblePlantList(true); }
    };


    const fetchForumSuggestion = async () => {
        setVisibleGroup(false);     
        setForumMessage('');
        setGroupDetail(null);

        try { 
            const response = await fetch('/api/v1/groups/suggest/', {
                method      : 'GET',
                headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
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
        finally { setVisibleGroup(true); }
    };


    const fetchBookmarks = async () => {
        try {
            const response = await fetch('/api/v1/home/bookmarks/', {
                headers    : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                const found = data.plantPairs?.some((item: any) => item.context === plantPair);
                setIsBookmarked(found);
            } 
            
            else { console.error('Failed to fetch bookmarks'); }
        } 
        
        catch (error) { console.error('Error fetching bookmarks', error); }
    };


    useEffect(() => { 
        fetchPlantPairRecommendations();
        fetchGroupPlantsRanks();
        fetchForumSuggestion();  
        fetchBookmarks(); 
    }, []);


    const toggleBookmark = async (bookmark: BookmarkPayload) => {
        try {
            const response = await fetch('/api/v1/home/bookmark/', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, },
            body   : JSON.stringify(bookmark),
            });

            if (response.ok) { setIsBookmarked((prev) => !prev); } 
            
            else { console.error('Failed to toggle bookmark:', response.status); }
        } 
        
        catch (error) { console.error('Error toggling bookmark:', error); }
    };


    const handleJoinGroup = async(groudId?: number) => { 
        try {
          const response = await fetch(`/api/v1/groups/${groudId}/join/`, {
            method      : 'PATCH',
            headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            credentials : 'include'
          });
      
          if (response.ok) { fetchForumSuggestion(); }
          
          else { console.error('Failed to join group: ', response.status); }
        } catch (error) { console.error('Error joining group:', error); }
    };

    
    return (
        <div className={css.homePlantsandGroupsParentDiv}>
            {!visiblePlantPair ? (
                <>
                    <div className={css.homePlantsPairShimmerDiv}>
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

                </>
            ) : plantPair ? ( 
                <div className={`${css.homePlantsPairChildDiv} ${plantPair ? css.fadeIn : ''}`}>
                    <div className={css.homePlantsPairHeaderDiv}>
                        <img 
                            alt       = "home-plant-pair-icon"
                            className = {css.homePlantsPairHeaderIcon}  
                            src       = {theme === 'light' ? homePlantPairLightIcon : homePlantPairDarkIcon} 
                        />
                        <h4 className={css.homePlantsPairHeader}>Plants precision pairing</h4>

                        <div className={css.homePlantsPairBookmarkBtnDiv}> 
                            <button
                                className={css.homePlantsPairBookmarkBtn}
                                onClick={() => toggleBookmark({ title: 'Plant Pair', context: plantPair, type: 'plantPair', })}
                            > 
                                <img 
                                    className={css.homeItemBookmarkBtnIcon} 
                                    alt="bookmark-icon"
                                    src={
                                        isBookmarked
                                        ? theme === 'light'
                                        ? bookmarkLightIcon : bookmarkDarkIcon : theme === 'light'
                                        ? unBookmarkLightIcon : unBookmarkDarkIcon 
                                    }
                                    
                                /> 
                            </button> 
                        </div>
                    </div>
                    
                    <p className={css.homePlantsPairDescription}>{plantPair}</p>
                </div>

            )  : (
                <div className={`${css.homePlantsPairChildDiv} ${plantPair ? css.fadeIn : ''}`}>
                    <div className={css.homePlantsPairHeaderDiv}>
                        <img 
                            alt       = "home-plant-pair-icon"
                            className = {css.homePlantsPairHeaderIcon}  
                            src       = {theme === 'light' ? homePlantPairLightIcon : homePlantPairDarkIcon} 
                        />
                        <h4 className={css.homePlantsPairHeader}>Plants precision pairing</h4>
                    </div>
                    
                    <p className={css.homePlantsPairDescription}> 
                        Find your personalized plant pairing tips based on your recent searches, favorite plants, and local climate.
                        If nothing shows up here, the recommendation feature might be temporarily unavailable.
                        Make sure you’ve selected your location and added plant interests to get the best matches.
                    </p>
                </div> 
            )}


            {!visiblePlantList ? (
                <>
                    <div className={css.homePlantsPairGroupListShimmer}>
                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemOne}`}></div> 
                        </div> 
                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemTwo}`}></div> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairEndShimmerTwo}`}></div>
                        </div>
                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemThree}`}></div>
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairEndShimmerThree}`}></div> 
                        </div> 
                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemFour}`}></div> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairEndShimmerFour}`}></div>
                        </div>  
                        <div className={css.homePlantsPairShimmerFlexDiv}> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemThree}`}></div>
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairEndShimmerThree}`}></div> 
                        </div> 
                    </div>
                </>
            ) : rankedPlants.length > 0 ? (
                <div className={`${css.homePlantsPairGroupListParent} ${visiblePlantList ? css.fadeIn : ''}`}>
                    <h4 className={css.homePlantsPairHeader}>The Growboard</h4>
                    <p className={`${css.homePlantsPairDescription} ${css.homePlantsPairHint}`}>Most shared & talked about plants in your groups this week.</p>
                    <ul className={css.homeGroupPlantList}>

                        {rankedPlants.map((plant, index) => (
                            <div className={css.homeGroupPlantListItemDiv}>
                                <li key={index} className={css.homeGroupPlantListItem}>{plant.rank}. {plant.name}</li>
                                
                                <div className={css.homeGroupPlantListItemPctDiv}>
                                    <img 
                                        alt       = "home-plant-pair-icon"
                                        className = {css.homePlantsPairHeaderIcon}  
                                        src={
                                            theme === 'light'
                                            ? (plant.change === '+' ? homePlantRankUpLightIcon : homePlantRankDownLightIcon)
                                            : (plant.change === '+' ? homePlantRankUpDarkIcon : homePlantRankDownDarkIcon)
                                        } 
                                    />

                                    <li key={2} className={css.homeGroupPlantListPect}>{plant.percentChange || '0'} %</li>
                                </div> 
                            </div>
                        ))}
                    </ul>
                </div>
            ) : ( 
                <div className={`${css.homePlantsPairGroupListParent} ${css.fadeIn}`}>
                    <h4 className={css.homePlantsPairHeader}>The Growboard</h4>
                    <p className={`${css.homePlantsPairDescription}`}>
                        This section highlights the top 3 plants based on activity across the forums you’ve joined.
                        To start receiving weekly plant rankings here, consider joining more groups that match your interests.
                    </p>
                </div>
            )}
 

            {!visibleGroup ? (
                <>
                    <div className={css.homeForumCardShimmer}>
                        <div className={css.homeCardShimmerChildDiv}> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemOne}`}></div> 
                        </div> 

                        <div className={css.homeCardShimmerChildDiv}> 
                            <div className={`${css.homePlantsPairShimmer} ${css.homePlantsPairItemThree}`}></div> 
                        </div>
                    </div>
                </>
            ) : (
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
                                {!forumMessage && groupDetail && (
                                    <>
                                        <p className={css.homeForumCardName}>{groupDetail?.name}</p>
                                        <button className={css.homeForumJoinBtn} onClick={() => handleJoinGroup(groupDetail?.id)}>Join</button>
                                    </>
                                )} 
                            </div>
                        </div>
 
                        <div className={`${css.homeForumCardChildDiv} ${css.homeForumEndDiv}`}>
                            <p className={css.homeForumDescription}>{forumMessage || groupDetail?.description}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePlantCompanionAndGroups;