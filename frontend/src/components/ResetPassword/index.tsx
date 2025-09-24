import css from '../Auth/index.module.css';
import { useAuth } from '../Auth/authContext';
import { useNavigate } from 'react-router-dom';
import authErrorIconDark from '../assets/taskErrorDark.svg';
import authErrorIconLight from '../assets/taskErrorLight.svg';
import { type SyntheticEvent, useState, useEffect } from 'react';


const ResetPassword = () => {
  
  const { setAccessToken }            = useAuth();
  const navigate                      = useNavigate();
  const [password, setPassword]       = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [redirects, setRedirects]     = useState(false);
  const [error, setError]             = useState('');
  const [theme, setTheme]             = useState('dark');


  useEffect(() => {
    const savedTheme = localStorage.getItem('themePreference');
    if (savedTheme) { setTheme(savedTheme); }
  }, []);


  const submit = async (e: SyntheticEvent) => {

    e.preventDefault();
  
    try {
      const response = await fetch('/api/v1/reset/', {
        method      : 'POST',
        headers     : { 'Content-Type': 'application/json' },
        credentials : 'include',
        body        : JSON.stringify({ password, confirmPass }),
      });
  
      if (response.ok) { 
        const data = await response.json(); 
        setAccessToken(data.token);
        setRedirects(true); 

      } else {

        const data = await response.json();
        setError(data.detail);

      }
    } catch (error) { setError('An error occurred. Please try again.'); }
  };


  useEffect(() => { if (redirects) { navigate('/'); } }, [redirects, navigate]);


  useEffect(() => {
    if (error) {
      const timer        = setTimeout(() => { setError(''); }, 4000);
      const fadeOutTimer = setTimeout(() => { setError(''); }, 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(fadeOutTimer);
      };
    }
  }, [error]);


  return (
    <div className={`${css.authParent} ${theme === 'dark' ? css.darkTheme : css.lightTheme}`}>
      <div className={css.authContainer}>
        <form className={`${css.authForm} ${theme === 'dark' ? css.darkTheme : css.lightTheme}`} onSubmit={submit}>
        
          <div className={css.authInputParentDiv}>
            <div className={css.authInputDiv}>
              <input 
                required
                type        = "password"
                placeholder = "Enter Password"
                onChange    = {(e) => setPassword(e.target.value)}
                className   = {`${css.authInput} ${css.authFirst}`}
              />
            </div>

            <hr className={css.authHr}/>

            <div className={css.authInputDiv}>
              <input 
                required
                type        = "password"
                placeholder = "Confirm Password"
                onChange    = {(e) => setConfirmPass(e.target.value)}
                className   = {`${css.authInput} ${css.authLast}`} 
              />
            </div>

          </div>

          <button className={css.authSubmitBtn} type='submit'><span>Reset</span></button>

          {error &&(   
            <div className={`${css.authErrorDiv} ${error ? css.fadeIn : css.fadeOut}`}>
              <img 
                className = {css.authErrorIcon} 
                src       = {theme === 'dark' ? authErrorIconDark : authErrorIconLight}
                alt       = "auth-error-icon"
              />
          
              <div className={css.authErrorTextDiv}>
                <p className={css.authErrorHeader}>Error{error}</p>
                <p className={css.authErrorText}>Profile Updated successfully{error}</p>
              </div>
            </div>
          )}  
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;