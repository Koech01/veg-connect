import HomePage from '../Home'; 
import InboxPage from '../Forum';
import ProfilePage from '../Profile';
import CreateTaskPage from '../Create';
import BookmarkPage from '../Bookmark';
import { useState, useEffect } from 'react';
import { useAuth } from '../Auth/authContext'; 
import { useNavigate } from 'react-router-dom';
import css from '../Dashboard/index.module.css';
import type { ProfileProps } from '../types/index'; 
import MobilePlantTaskPage from '../Home/mobilePlantTask';
import MobileGraphPage from '../Home/mobilePlantPairAndList'; 
import navBarHomeDarkSvg from '../assets/navBarHomeDark.svg'; 
import navBarUserDarkSvg from '../assets/navBarUserDark.svg';
import navBarHomeLightSvg from '../assets/navBarHomeLight.svg';
import navBarInboxDarkSvg from '../assets/navBarInboxDark.svg';
import navBarUserLightSvg from '../assets/navBarUserLight.svg';
import navbarGraphDarkSvg from '../assets/navbarGraphDark.svg';
import navbarGraphLightSvg from '../assets/navbarGraphLight.svg';
import navBarCreateDarkSvg from '../assets/navBarCreateDark.svg';
import navBarInboxLightSvg from '../assets/navBarInboxLight.svg';
import navBarCreateLightSvg from '../assets/navBarCreateLight.svg';
import navBarInsightDarkSvg from '../assets/navBarInsightDark.svg';
import navBarInsightLightSvg from '../assets/navBarInsightLight.svg';   
import navBarActiveUserDarkSvg from '../assets/navBarActiveUserDark.svg'; 
import navBarActiveHomeDarkSvg from '../assets/navBarActiveHomeDark.svg'; 
import navBarActiveHomeLightSvg from '../assets/navBarActiveHomeLight.svg'; 
import navBarActiveUserLightSvg from '../assets/navBarActiveUserLight.svg'; 
import navbarActiveGraphDarkSvg from '../assets/navbarActiveGraphDark.svg';  
import navBarActiveInboxDarkSvg from '../assets/navBarActiveInboxDark.svg';
import navbarActiveGraphLightSvg from '../assets/navbarActiveGraphLight.svg'; 
import navBarActiveInboxLightSvg from '../assets/navBarActiveInboxLight.svg';
import navBarActiveCreateDarkSvg from '../assets/navBarActiveCreateDark.svg';
import navBarActiveCreateLightSvg from '../assets/navBarActiveCreateLight.svg';
import navBarActiveInsightDarkSvg from '../assets/navBarActiveInsightDark.svg';
import navBarActiveInsightLightSvg from '../assets/navBarActiveInsightLight.svg';


const Dashboard = () => {

  const { accessToken }             = useAuth();
  const navigate                    = useNavigate();
  const [activePage, setActivePage] = useState('Home'); 
  const [profile, setProfile]       = useState({
    id           : 0,
    username     : '',
    firstName    : '',
    lastName     : '',
    email        : '',
    profileIcon  : '',
    displayTheme : 'light',
    newChat      : false, 
    visibility   : false, 
    receiveMails : false, 
    climate      : { country : '', name : '', precipitationClass : '' },
    created      : ''
  });
  

  const handlePageClick = async (page: string) => {
    try { 
      const response = await fetch('/api/v1/home/', {
        method      : 'PATCH',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials : 'include'
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile((prevProfile) => ({ ...prevProfile, newChat: updatedProfile.newChat}));
      }
      else { console.error('Failed to update profile: ', response.status); }
    }
    catch (error) { console.error('An error occurred while to updating profile: ', error) }
    setActivePage(page);
  }


  const handleHomeClick     = () => { handlePageClick('Home'); };
  const handleForumClick    = () => { setActivePage('Inbox'); };
  const handleProfileClick  = () => { handlePageClick('Profile'); };
  const handleCreateClick   = () => { handlePageClick('Create'); }; 
  const handleInsightsClick = () => { handlePageClick('Insights'); };
  const handleGraphClick    = () => { handlePageClick('Graph'); };
  const handleBookmarkClick = () => { handlePageClick('Bookmark'); };


  const updateProfile = (updatedProfile: ProfileProps['profile']) => {
    setProfile((prevProfile) => ({ ...prevProfile, ...updatedProfile, }));
  };

  
  useEffect(() => {
    (async () => {
      try { 
        const response = await fetch('/api/v1/home/', {
          method      : 'PATCH',
          headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          credentials : 'include'
        });

        if (response.ok) {
          const profile = await response.json();
          setProfile(profile);
        }
        else {
          if (response.status === 404) { navigate('/login/'); }
          else { 
            console.error('Failed to fetch home: ', response.status);
            navigate('/login/')
          }
        }
      }
      catch (error) { console.error('An error occurred while fetching home: ', error) }
    })();
  }, [navigate]);


  return (
    <div className={`${css.dashboardParentDiv} ${profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}>
      <div className={css.dashboardParentDiv}>
        <div className={css.dashboardMenuDiv}>
          <button 
            className = {`${css.dashboardMenuItem} ${activePage === 'Home' ? css.active : '' }`}
            onClick   = {handleHomeClick}
          >Home</button>

          <button 
            className = {`${css.dashboardMenuItem} ${activePage === 'Create' ? css.active : '' }`}
            onClick   = {handleCreateClick}
          >Create</button>

          <div className={css.dashboardMenuItemDiv}>
            <button 
              className = {`${css.dashboardMenuItem} ${activePage === 'Inbox' ? css.active : '' }`}
              onClick   = {handleForumClick}
            >Inbox</button>
            {profile.newChat && activePage !== 'Inbox' && ( <div className={css.dashboardMenuChatIndicator}></div> )}
          </div>

          <button 
            className = {`${css.dashboardMenuItem} ${activePage === 'Profile' ? css.active : '' }`}
            onClick   = {handleProfileClick}
          >Profile</button>

          <button 
            className = {`${css.dashboardMenuItem} ${activePage === 'Bookmark' ? css.active : '' }`}
            onClick   = {handleBookmarkClick}
          >Bookmark</button>
        </div>


        <div className={css.dashboardMobileMenuDiv}>
          <div className={css.dashboardMobileChildDiv}>
            <button className={`${css.dashboardMobileBtn} ${activePage === 'Home' ? css.active : '' }`} onClick={handleHomeClick}>
              <img  
                alt       = "mobile-navbar-icon"
                className = {css.dashboardMobileIcon} 
                src       = { 
                  activePage === 'Home'
                  ? profile.displayTheme === 'light' ? navBarActiveHomeLightSvg : navBarActiveHomeDarkSvg
                  : profile.displayTheme === 'light' ? navBarHomeLightSvg : navBarHomeDarkSvg
                }
              />
            </button>
 
            <button className={`${css.dashboardMobileBtn} ${activePage === 'Insights' ? css.active : '' }`} onClick={handleInsightsClick}>
              <img  
                alt       = "mobile-navbar-icon"
                className = {css.dashboardMobileIcon}
                src       = {
                  activePage === 'Insights'
                  ? profile.displayTheme === 'light' ? navBarActiveInsightLightSvg : navBarActiveInsightDarkSvg
                  : profile.displayTheme === 'light' ? navBarInsightLightSvg : navBarInsightDarkSvg
                }
              />
            </button>

            <button className={`${css.dashboardMobileBtn} ${activePage === 'Graph' ? css.active : '' }`} onClick={handleGraphClick}>
              <img  
                alt       = "mobile-navbar-icon"
                className = {css.dashboardMobileIcon}  
                src       = { 
                  activePage === 'Graph'
                  ? profile.displayTheme === 'light' ? navbarActiveGraphLightSvg : navbarActiveGraphDarkSvg
                  : profile.displayTheme === 'light' ? navbarGraphLightSvg : navbarGraphDarkSvg
                }
              />
            </button>

            <button className={`${css.dashboardMobileBtn} ${activePage === 'Create' ? css.active : '' }`} onClick={handleCreateClick}>
              <img  
                alt       = "mobile-navbar-icon"
                className = {css.dashboardMobileIcon}
                src       = { 
                  activePage === 'Create'
                  ? profile.displayTheme === 'light' ? navBarActiveCreateLightSvg : navBarActiveCreateDarkSvg
                  : profile.displayTheme === 'light' ? navBarCreateLightSvg : navBarCreateDarkSvg
                }
              />
            </button>

            <button className={`${css.dashboardMobileBtn} ${activePage === 'Inbox' ? css.active : '' }`} onClick={handleForumClick}>
              <img  
                alt       = "mobile-navbar-icon"
                className = {css.dashboardMobileIcon} 
                src       = { 
                  activePage === 'Inbox'
                  ? profile.displayTheme === 'light' ? navBarActiveInboxLightSvg : navBarActiveInboxDarkSvg
                  : profile.displayTheme === 'light' ? navBarInboxLightSvg : navBarInboxDarkSvg
                }
              />
            </button>

            <button className={`${css.dashboardMobileBtn} ${activePage === 'Profile' ? css.active : '' }`} onClick={handleProfileClick}>
              <img  
                alt       = "mobile-navbar-icon"
                className = {css.dashboardMobileIcon} 
                src       = { 
                  activePage === 'Profile'
                  ? profile.displayTheme === 'light' ? navBarActiveUserLightSvg : navBarActiveUserDarkSvg
                  : profile.displayTheme === 'light' ? navBarUserLightSvg : navBarUserDarkSvg
                }
              />
            </button>
          </div>
        </div>

        <div className={css.dashboardContentDiv}>
          {activePage === 'Home' && <HomePage profile={profile} updateProfile={updateProfile}/>}
          {activePage === 'Inbox' && <InboxPage profile={profile} updateProfile={updateProfile}/>}
          {activePage === 'Create' && <CreateTaskPage profile={profile} updateProfile={updateProfile}/>}
          {activePage === 'Profile' && <ProfilePage profile={profile} updateProfile={updateProfile}/>}  
          {activePage === 'Bookmark' && <BookmarkPage profile={profile} updateProfile={updateProfile}/>}  
          {activePage === 'Insights' && <MobilePlantTaskPage profile={profile} updateProfile={updateProfile}/>}
          {activePage === 'Graph' && <MobileGraphPage profile={profile} updateProfile={updateProfile}/>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;