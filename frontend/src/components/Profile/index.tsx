import css from '../Profile/index.module.css';
import { useAuth } from '../Auth/authContext'; 
import { useNavigate } from 'react-router-dom';
import statusDarkSvg from '../assets/completedDark.svg';   
import settingDarkIcon from '../assets/settingDark.svg';
import statusLightSvg from '../assets/completedLight.svg'; 
import settingLightIcon from '../assets/settingLight.svg';
import { LocationDropdown } from '../Onboarding/dropdown';
import React, { useEffect, useRef, useState } from 'react'; 
import profileLocationDarkIcon from '../assets/profileLocationDark.svg'; 
import profileLocationLightIcon from '../assets/profileLocationLight.svg';
import { type CityProps, type ProfileProps, formatDate } from '../types/index';


const Profile: React.FC<ProfileProps> = ({ profile, updateProfile }) => {

  const { accessToken }                               = useAuth();
  const [editMode, setEditMode]                       = useState(false);
  const [selectedProfileIcon, setSelectedProfileIcon] = useState<File | null>(null);
  const [updateMessage, setUpdateMessage]             = useState(false);
  const initialProfileRef                             = useRef({ ...profile });
  const navigate                                      = useNavigate();
  const [isModalOpen, setModalOpen]                   = useState<boolean>(false);
  const [profileVisibility, setProfileVisibility]     = useState(profile.visibility || true );
  const [activeDisplayMode, setActiveDisplayMode]     = useState(profile.displayTheme || 'dark' );
  const [cities, setCities]                           = useState<CityProps[]>([]);
  const [selectedCity, setSelectedCity]               = useState<CityProps | null>(null);

  
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(profile) !== JSON.stringify(initialProfileRef.current)) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [profile]);


  const toggleEditingMode = () => { setEditMode(!editMode); };


  const handleProfilePictureChange = () => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };


  const handleProfileSubmit = async () => {
    const formData = new FormData();
    formData.append('username', profile.username);
    formData.append('firstName', profile.firstName);
    formData.append('lastName', profile.lastName);
    formData.append('email', profile.email);

    if (selectedProfileIcon) {
      formData.append('profileIcon', selectedProfileIcon);
    }
    
    if (selectedCity) {
      formData.append('cityName', selectedCity.name);
      formData.append('countryName', selectedCity.country);
      formData.append('precipitation', selectedCity.precipitationClass);
    }

    try { 
      const response = await fetch('/api/v1/profiles/', {
        method      : 'PATCH',
        headers     : { Authorization: `Bearer ${accessToken}` },
        credentials : 'include',
        body        : formData,
      });

      if (response.ok) { 
        const updatedProfile = await response.json();
        const hasChanged     = JSON.stringify(updatedProfile) !== JSON.stringify(initialProfileRef.current);

        setEditMode(false);
        updateProfile(updatedProfile);
        
        if (hasChanged) { setUpdateMessage(true); }

        initialProfileRef.current = updatedProfile;
      }

      else {
        const errorData = await response.json();
        console.error('Failed to update profile:', errorData);
      }

    }

    catch (error) { console.error('An error occurred. Please try again later: ', error); }
  }


  useEffect(() => {
    if (updateMessage) {
      const timer = setTimeout(() => { setUpdateMessage(false); }, 2000);
      return () => { clearTimeout(timer); }
    }
  }, [updateMessage])


  const handleTogglesChange = async (toggleType: 'theme' | 'visibility', toggleVal: string) => {
    try { 
      const response = await fetch(`/api/v1/profiles/${toggleType}/${toggleVal}/preference/`, {
        method      : 'POST',
        headers     : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials : 'include',
      });

      if (response.ok) { 
        const profileData = await response.json();
       
        if (toggleType === 'theme' && profileData.displayTheme) {
          setActiveDisplayMode(profileData.displayTheme); 
          updateProfile({ ...profile, displayTheme: profileData.displayTheme }); 
          localStorage.setItem('themePreference', profileData.displayTheme);
        }

        if (toggleType === 'visibility' && profileData.visibility !== undefined) {
          setProfileVisibility(profileData.visibility); 
          updateProfile({ ...profile, visibility: profileData.visibility }); 
        }
      } 

      else { console.error('Failed to update profile: ', response.status); }

    } catch (error) { console.error('Error updating profile:', error); }
  };

  
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/v1/logout/', {
        method      : 'POST',
        headers     : { 'Content-Type' : 'application/json' },
        credentials : 'include',
      })

      if (response.ok) {
        navigate('/login/');
        localStorage.removeItem('token');
      }
      else { console.error('Failed to logout: ', response.status); }
    }

    catch (error) { console.error('Error logging out', error) }
  }


  useEffect(() => {
    const loadCSV = async () => {
      try {
        const response = await fetch('/static/cities-precipitation.csv');
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
      } 
      
      catch (error) { console.error("Error loading city CSV:", error);      }
    };

    loadCSV();
  }, []);


  const updatePlantInterests = () => { navigate('/welcome/'); };


  const openModal  = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);


  return (
    <div className={`${css.profileParentDiv} ${profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}>

      <div className={css.profileParentDiv}>

        { !editMode ? (
          <>
            <div className={css.profileCard}>
              <div className={css.profileChildCard}>
                <img className={css.profileIcon} alt="profile-user-icon" src={profile.profileIcon}/>

                <div className={css.profileHeaderDiv}>
                  <div className={css.profileUsernameDiv}>
                    <p className={css.profileUsername}>{profile.username}</p>
                    <p className={css.profileEmail}>{profile.email}</p>
                  </div>
            
                  <button className={css.profileEditBtn} onClick={toggleEditingMode}>
                    <img 
                      className = {css.profileEditSvg}  
                      alt       = "profile-setting-icon"
                      src       = {profile.displayTheme === 'light' ? settingLightIcon : settingDarkIcon} 
                    />
                    Update
                  </button>   
                </div>
              </div>

              <div className={css.profileItemInfoDiv}>  
                <div className={css.profileItemLocationDiv}>
                  <img 
                    className = {css.profileItemLocationIcon}  
                    alt       = "profile-location-icon"
                    src       = {profile.displayTheme === 'light' ? profileLocationLightIcon : profileLocationDarkIcon} 
                  />
                  <p className={css.profileLocationText}>{profile.climate.name}</p>
                </div>
 
                <div className={css.profileItemInfoModelDiv}>
                  <div className={css.profileCreatedInfoDiv}>
                    <p className={css.profileJoinedLabel}>Joined</p>
                    <p className={css.profileJoinedLabel}>.</p>
                    <p className={css.profileJoinedDate}>{formatDate(profile.created)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Setting */}
            <div className={css.profileSettingChildDiv}>

              <div className={css.profileSettingItemDiv}>
                <div className={css.profileSettingItemChildDiv}>
                  <p className={css.profileSettingItemLabel}>Dark mode</p>
                  <p className={css.profileSettingItemHint}>Select your preferred display theme</p>
                </div>

                <div className={css.profileSettingItemBtnDiv}>
                  <label className={css.profileRadioSwitchLabel}>
                    <input 
                      type     = "checkbox"
                      checked  = {activeDisplayMode === 'dark'}
                      onChange = {() => handleTogglesChange('theme' , activeDisplayMode === 'light' ? 'dark' : 'light')}
                    />
                    <span className={css.profileRadioSliderSpan}></span>
                  </label>
                </div>
              </div>

              <div className={css.profileSettingItemDiv}>
                <div className={css.profileSettingItemChildDiv}>
                  <p className={css.profileSettingItemLabel}>Profile visibility</p>
                  <p className={css.profileSettingItemHint}>Other users will be able to find you through searches</p>
                </div>

                <div className={css.profileSettingItemBtnDiv}>
                  <label className={css.profileRadioSwitchLabel}>
                    <input 
                      type     = "checkbox"
                      checked  = {profileVisibility === true}
                      onChange = {() => handleTogglesChange('visibility', !profileVisibility ? 'true' : 'false')}
                    />
                    <span className={css.profileRadioSliderSpan}></span>
                  </label>
                </div>
              </div>

              <div className={css.profileSettingItemDiv}>
                <div className={css.profileSettingItemChildDiv}>
                  <p className={css.profileSettingItemLabel}>Plant Interests</p>
                  <p className={css.profileSettingItemHint}>Update plants you're most interested in</p>
                </div>

                <button className={css.profileEditBtn} onClick={updatePlantInterests}>Update</button> 
              </div>

              <div className={css.profileSettingItemDiv}>
                <div className={css.profileSettingItemChildDiv}>
                  <p className={css.profileSettingItemLabel}>Logout</p>
                  <p className={css.profileSettingItemHint}>Log out as {profile.username}</p>
                </div>
                <button className={css.profileSettingItemBtn} onClick={openModal}>Logout</button>
              </div>
            </div>

            {/* Profile Logout Modal */}
            { isModalOpen && (
              <div 
                className={`
                  ${css.profileSettingLogoutModalParentDiv}  
                  ${css.fadeIn}
                  ${profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}
                `}
              > 
                <div className={css.profileSettingLogoutModalChildDiv}>
                  <div className={css.profileSettingLogoutModalTextDiv}>
                    <p className={css.profileSettingLogoutLabel}>Logout</p>
                    <p className={css.profileSettingLogoutHint}>
                      You are logged in as {profile.username}, Are you sure you want to log out ?
                    </p>
                  </div>
                
                  <div className={css.profileSettingLogoutModalBtnDiv}>
                    <button className={css.profileSettingLogoutConfirmBtn} onClick={handleLogout}>Confirm</button>
                    <button className={css.profileSettingLogoutCancelBtn} onClick={closeModal}>Cancel</button>
                  </div>
                </div>
              </div>
            )}


            {/* Profile Update Success Modal */}
            <div className={`${css.profileUpdateCard} ${css.fadeIn} ${updateMessage  ? '' : `${css.profileHideUpdateCard} ${css.fadeOut}`}`}>
              <div className={css.profileUpdateIconDiv}> 
                <img  
                  alt       = "profile-updated-svg"
                  className = {css.profileUpdateIcon} 
                  src       = {profile.displayTheme === 'light' ? statusLightSvg : statusDarkSvg} 
                />
              </div>

              <div className={css.profileUpdateTextDiv}>
                <p className={css.profileUpdateHeader}>Success !</p>
                <p className={css.profileUpdateText}>Profile Updated</p>
              </div>
            </div>
          </>
        ) : (

          <div className={css.profileEditCard}>

            <div className={css.profileEditFlexDiv}>
              <p className={css.profileEditHeader}>Account Settings</p>
            </div>

            <div className={css.profileEditUserIconDiv}>
              <img 
                alt       = "profile-edit-user-icon"
                className = {css.profileEditUserIcon} 
                src       = {selectedProfileIcon ? URL.createObjectURL(selectedProfileIcon) : profile.profileIcon}
              />

              <div className={css.profileIconEditDiv}>
                <button className={css.profileEditUploadImgBtn}>
                  <span className={css.profileEditUploadImgSpan} onClick={handleProfilePictureChange}>upload</span>

                  <input
                    type     = "file"
                    accept   = "image/jpeg, image/png, image/gif"
                    style    = {{ display: 'none' }}
                    onChange = {(e) => {
                      const selectedIcon = e.target.files?.[0];
                      if (selectedIcon) { setSelectedProfileIcon(selectedIcon); }
                    }}
                  />

                  <span className={css.profileEditUploadImgHint} >Allowed files .png, .jpg .jpeg</span>
                </button>
              </div>
 
              <div className={css.profileDesktopLocationDiv}> 
                <LocationDropdown 
                  theme        = {profile.displayTheme} 
                  cities       = {cities} 
                  selectedCity = {selectedCity} 
                  onChange     = {setSelectedCity} 
                />
              </div>  
            </div>
  
            <div className={css.profileEditPairInputDiv}>
              <div className={css.profileMobileLocationDiv}> 
                <LocationDropdown 
                  theme        = {profile.displayTheme} 
                  cities       = {cities} 
                  selectedCity = {selectedCity} 
                  onChange     = {setSelectedCity} 
                />
              </div>  

              <div className={css.profileEditInputDiv}>
                <span className={css.profileEditCardSpan}>Username</span>
                <input 
                  placeholder = "Username"
                  value       = {profile.username}
                  className   = {css.profileEditCardInput} 
                  onChange    = { (e) => updateProfile({ ...profile, username: e.target.value}) }
                />
              </div>

              <div className={css.profileEditInputDiv}>
                <span className={css.profileEditCardSpan}>Email</span>
                <input 
                  placeholder = "Email"
                  value       = {profile.email}
                  className   = {css.profileEditCardInput} 
                  onChange    = { (e) => updateProfile({ ...profile, email: e.target.value }) }
                />
              </div>
            </div>

            <div className={css.profileEditPairInputDiv}>
              <div className={css.profileEditInputDiv}>
                <span className={css.profileEditCardSpan}>First Name</span>
                <input 
                  placeholder = "First Name"
                  value       = {profile.firstName}
                  className   = {css.profileEditCardInput} 
                  onChange    = { (e) => updateProfile({ ...profile, firstName: e.target.value }) }
                />
              </div>

              <div className={css.profileEditInputDiv}>
                <span className={css.profileEditCardSpan}>Last Name</span>
                <input 
                  placeholder = "Last Name"
                  value       = {profile.lastName}
                  className   = {css.profileEditCardInput} 
                  onChange    = { (e) => updateProfile({ ...profile, lastName: e.target.value }) }
                />
              </div>
            </div>
        
            <div className={css.profileEditFlexDiv}>
              <button className={css.profileEditSubmitBtn} onClick={handleProfileSubmit}>Save Changes</button>
            </div>
          </div> 

        )}

      </div>
    </div>
  );
};

export default Profile;