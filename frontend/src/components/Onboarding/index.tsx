import {useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import css from "../Onboarding/index.module.css";
import onBoardingTaskImg from '../assets/onBoardingTaskImg.png';  
import onBoardingPlantIcon from '../assets/onBoardingPlant.png';
import onBoardingUserIcon from '../assets/onBoardingUserIcon.jpg';


const Onboarding = () => {
    const navigate                      = useNavigate();
    const [theme, setTheme]             = useState('light');
    const [currentItem, setCurrentItem] = useState(0);

    
    useEffect(() => {
        const savedTheme = localStorage.getItem('themePreference');
        if (savedTheme) { setTheme(savedTheme); }
    }, []);


    useEffect(() => {
    if (!theme) return;
    if (theme === 'dark') {
        document.body.classList.add(css.darkTheme);
        document.body.classList.remove(css.lightTheme);
    } else {
        document.body.classList.add(css.lightTheme);
        document.body.classList.remove(css.darkTheme);
    }
    }, [theme]);


    useEffect(() => {
        (async () => {
        try {
            const token    = localStorage.getItem('token');
            await fetch('http://127.0.0.1:8000/api/v1/home/plants/', {
            method      : 'POST',
            headers     : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            credentials : 'include',
            })
        }
        catch (error) { console.error('Error fetching plants: ', error); }
        })();
    }, []);


    useEffect(() => {
        (async () => {
        try {
            const token    = localStorage.getItem('token');
            await fetch('http://127.0.0.1:8000/api/v1/tasks/create/suggestions/', {
                method      : 'POST',
                headers     : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                credentials : 'include',
            });
        }
        catch (error) { console.error('Error creating plant recommendations: ', error); }
        })();
    }, [currentItem]);


    const handleNextClick = () => {
        if   (currentItem === 3) { navigate('/'); } 
        else { setCurrentItem((prevIndex) => (prevIndex + 1) % 4); }
    };


    return (
        <div className={`${css.onboardingParentDiv} ${theme === 'dark' ? css.darkTheme : css.lightTheme}`}>
            <div className={css.onboardingParentDiv}>
                <div className={css.onboardingContentDiv}>
                    <div className={css.onboardingFeaturesDiv}>
                        <div className={css.onboardingComponentListDiv}> 

                            <div className={css.onboardingComponentItemDiv}></div>
                            <div className={css.onboardingComponentItemDiv}></div>
                            <div className={css.onboardingComponentItemDiv}></div>
                            <div className={css.onboardingComponentItemDiv}>

                                {currentItem === 0 && (
                                    <div className={`${css.onboardingInboxDiv} ${css.fadeIn}`}>
                                        <img src={onBoardingUserIcon} alt="onboarding-user-icon" className={css.onboardingUserIcon}/>

                                        <div className={css.onboardingInboxContentDiv}>
                                            <div className={css.onboardingInboxHeaderDiv}>
                                                <p className={css.onboardingInboxName}>Amani</p>
                                                <p className={css.onboardingInboxTime}>5 mins ago</p>
                                            </div>
                                            <p className={css.onboardingInboxText}>Baraka, let’s compare harvest notes.</p>
                                        </div>
                                    </div>
                                )}

                                {currentItem === 1 && (
                                    <div className={`${css.onboardingInboxDiv} ${css.fadeIn}`}>
                                        <img alt="onboarding-task-icon" className={css.onboardingTaskIcon} src={onBoardingTaskImg}/>

                                        <div className={css.onboardingInboxContentDiv}>
                                            <div className={css.onboardingInboxHeaderDiv}>
                                                <p className={css.onboardingInboxName}>Smart Seeding Operations</p>
                                                <p className={css.onboardingInboxTime}>1 hour ago</p>
                                            </div>
                                            <p className={css.onboardingInboxText}>Calibrating autonomous seed drills for precise depth and spacing.</p>
                                        </div>
                                    </div>
                                )}

                                {currentItem === 2 && (
                                    <div className={`${css.onboardingInboxDiv} ${css.fadeIn}`}>
                                        <img src={onBoardingPlantIcon} alt="onboarding-user-icon" className={css.onboardingPlantIcon}/>

                                        <div className={css.onboardingInboxContentDiv}>
                                            <div className={css.onboardingInboxHeaderDiv}>
                                                <p className={css.onboardingInboxName}>Apples</p> 
                                            </div>
                                            <p className={css.onboardingInboxText}>
                                                Use hydroponic setups for optimal nutrient absorption.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {currentItem === 3 && (
                                    <div className={`${css.onboardingInboxDiv} ${css.fadeIn}`}>
                                        <div className={css.onboardingGraphDiv}>
                                            <div className={css.onboardingGraphBarDiv}>
                                                <div className={`${css.onboardingGraphLevel} ${css.levelOne}`}></div>
                                            </div>
                                            <div className={css.onboardingGraphBarDiv}>
                                            <div className={`${css.onboardingGraphLevel} ${css.levelTwo}`}></div>
                                            </div>
                                            <div className={css.onboardingGraphBarDiv}>
                                                <div className={`${css.onboardingGraphLevel} ${css.levelThree}`}></div>
                                            </div>
                                            <div className={css.onboardingGraphBarDiv}>
                                                <div className={`${css.onboardingGraphLevel} ${css.levelFour}`}></div>
                                            </div>
                                        </div>
                                
                                        <div className={css.onboardingInboxContentDiv}>
                                            <div className={css.onboardingGraphTextDiv}>
                                                <p className={css.onboardingInboxPect}>30 days</p>
                                                <p className={css.onboardingInboxTime}>lettuce</p>
                                            </div>
                                            <div className={css.onboardingGraphTextDiv}>
                                                <p className={css.onboardingInboxPect}>100 days</p>
                                                <p className={css.onboardingInboxTime}>lemon cucumbers</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={css.onboardingComponentInfoDiv}>
                        <div className={css.onboardingComponentChildDiv}>
                            {currentItem === 0 && (
                                <div className={`${css.onboardingComponentTextDiv} ${css.fadeIn}`}>
                                    <p className={css.onboardingTitle}>Connect & Grow</p>
                                    <p className={css.onboardingDescription}>Join niche groups for pest control, irrigation hacks, and more — connect, share, and grow!</p>
                                </div>
                            )}

                            {currentItem === 1 && (
                                <div className={`${css.onboardingComponentTextDiv} ${css.fadeIn}`}>
                                    <p className={css.onboardingTitle}>Collaborative Farming</p>
                                    <p className={css.onboardingDescription}>Create and share farming tasks with peers for collaborative growth.</p>
                                </div>
                            )}

                            {currentItem ===2 && (
                                <div className={`${css.onboardingComponentTextDiv} ${css.fadeIn}`}>
                                    <p className={css.onboardingTitle}>Green Tips</p>
                                    <p className={css.onboardingDescription}>Curated planting tips to enhance your farming experience.</p>
                                </div>
                            )}

                            {currentItem === 3 && (
                                <div className={`${css.onboardingComponentTextDiv} ${css.fadeIn}`}>
                                    <p className={css.onboardingTitle}>Growth Visuals</p>
                                    <p className={css.onboardingDescription}>Explore the growth journey of diverse crops.</p>
                                </div>
                            )}
                        </div>

                        <button className={css.onboardingNextBtn} onClick={handleNextClick}>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;