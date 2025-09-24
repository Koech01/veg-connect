import {useState, useEffect } from 'react';
import { LocationDropdown } from './dropdown';
import { useAuth } from '../Auth/authContext';
import { useNavigate } from 'react-router-dom'; 
import type { CityProps } from '../types/index';
import css from "../Onboarding/index.module.css";
import onBoardingTaskImg from '../assets/onBoardingTaskImg.png';  
import onBoardingPlantIcon from '../assets/onBoardingPlant.png';
import onBoardingUserIcon from '../assets/onBoardingUserIcon.jpg';


const Onboarding = () => {

    const { accessToken }                 = useAuth();
    const navigate                        = useNavigate();
    const [theme, setTheme]               = useState('light');
    const [currentItem, setCurrentItem]   = useState(0);
    const [cities, setCities]             = useState<CityProps[]>([]);
    const [selectedCity, setSelectedCity] = useState<CityProps | null>(null);
    const [plants, setPlants]             = useState<string[]>([]);
    const [selected, setSelected]         = useState<string[]>([]);


    useEffect(() => {
    const loadCSV = async () => {
        try {
        const response = await fetch('/static/assets/cities-precipitation.csv');
        const text = await response.text();
        const lines = text.trim().split('\n');

        const parsed: CityProps[] = lines.slice(1).map(line => {
            const values: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } 

                else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } 
                
                else { current += char; }
            }
            values.push(current.trim()); 

            return { country: values[0], name: values[1], precipitationClass: values[3] };
        });

        setCities(parsed);
        } catch (error) {
        console.error("Error loading city CSV:", error);
        }
    };

    loadCSV();
    }, []);


    const handleUserClimate = async () => {
        if (!selectedCity) {
        alert('Please select a city');
        return;
        }
 
        try { 
            const response = await fetch('/api/v1/profiles/climate/', {
                method  : 'PATCH',
                headers : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body    : JSON.stringify({ 
                    countryName: selectedCity.country, 
                    cityName: selectedCity.name, 
                    precipitation: selectedCity.precipitationClass 
                })
               
            });

            if (!response.ok) {
              const errorData = await response.json();
                console.error('Failed to update location:', errorData);
            } 
        } 
        catch (error) { console.error('An error occurred while saving city:', error); }
    };


    useEffect(() => {
        const fetchPlantInterests = async () => {

            try {
                const response = await fetch('/api/v1/profiles/plants/interests/', {
                    method  : 'GET',
                    headers : {'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Failed to fetch plants list:', errorData);
                    return;
                }

                const data = await response.json();
                setPlants(data); 
            } 
            catch (error) { console.error('Error fetching plants:', error); }
        };

    fetchPlantInterests();
    }, []);


    const togglePlant = (name: string) => {
        setSelected(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    }


    const updateUserPlantInterests = async () => { 
  
        try {
            await fetch('/api/v1/profiles/plants/choice/', {
                method      : 'PATCH',
                headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                credentials : 'include',
                body        : JSON.stringify({ selectedPlants: selected })
            }) 
        }

        catch (error) { console.error('Failed to update user plant interests: ', error) } 
    }


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


    const handleNextClick = async() => {
        if (currentItem === 3) { 
           if (!selectedCity || selected.length === 0) return;
           
           try {
            await handleUserClimate();
            await updateUserPlantInterests()
            navigate('/');
           }
        
           catch(error) { console.error('Failed to complete onboarding:', error); }
        
        } 
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
                                    <div className={css.onboardingPreference}>
                                        <LocationDropdown theme={theme} cities={cities} selectedCity={selectedCity} onChange={setSelectedCity} />
                                      
                                        <div className={css.onboardingPlantGridDiv}>
                                            <div className={css.onboardingPlantGrid}>
                                                {plants.map((plant, index) => (
                                                    <div 
                                                        key       = {index}
                                                        onClick   = {() => togglePlant(plant)}
                                                        className = {`${css.onboardingPlantItemDiv} ${selected.includes(plant) ? css.selectedPlant : ''}`}
                                                    >
                                                        {plant}
                                                    </div>
                                                ))}
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
                                    <p className={css.onboardingDescription}>Join niche groups for pest control, irrigation hacks, and more - connect, share, and grow!</p>
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
                                    <p className={css.onboardingTitle}>Personalized planting tips</p>
                                    <p className={css.onboardingDescription}>Get smart planting tips curated from your favorite plants, climate zone, and search history.</p>
                                </div>
                            )}

                            {currentItem === 3 && (
                                <div className={`${css.onboardingComponentTextDiv} ${css.fadeIn}`}>
                                    <p className={css.onboardingTitle}>Where Are You Growing?</p>
                                    <p className={css.onboardingDescription}>Start by selecting your growing region and a few plants you care about.</p>
                                </div>
                            )}
                        </div>

                        <button 
                            className= {css.onboardingNextBtn} 
                            onClick  = {handleNextClick}
                            disabled = {currentItem === 3 && (!selectedCity || selected.length === 0)} 
                        >
                        Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;