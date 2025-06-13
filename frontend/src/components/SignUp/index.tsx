import css from '../Auth/index.module.css';
import { useAuth } from '../Auth/authContext';
import { useNavigate } from 'react-router-dom';
import authErrorIconDark from '../assets/taskErrorDark.svg';
import authErrorIconLight from '../assets/taskErrorLight.svg';
import { type SyntheticEvent, useState, useEffect } from 'react';


const Signup = () => {
  
  const { setAccessToken }        = useAuth();
  const navigate                  = useNavigate();
  const [email, setEmail]         = useState('');
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [redirects, setRedirects] = useState(false);
  const [theme, setTheme]         = useState('light');


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


  const submit = async (e: SyntheticEvent) => {

    e.preventDefault();

    try {
      const response = await fetch('/api/v1/signup/', {
        method      : 'POST',
        headers     : { 'Content-Type': 'application/json' },
        credentials : 'include',
        body        : JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        const data = await response.json(); 
        setAccessToken(data.token);
        localStorage.setItem('themePreference', 'light');
        setRedirects(true); 
      } 

      else {

        const data = await response.json();
        if ( data.username) {
          setError(data.username[0] === 'This field must be unique.' ? 'This username is already taken.' : data.username[0]);
        }
        else if ( data.email) { setError(data.email[0]); } 
        else if ( data.password) { setError(data.password[0]); }
        else    { setError('An error occurred. Please try again later.'); }
        
      }
    } catch (error) { setError('An error occurred. Please try again later.'); }
  };


  const redirectToLogin = () => { navigate('/login/'); };
  

  useEffect(() => { if (redirects) { navigate('/welcome/'); } }, [ redirects, navigate ]);

  
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
                type        = "text"
                placeholder = "Enter Username"
                onChange    = {(e) => setUsername(e.target.value)}
                className   = {`${css.authInput} ${css.authFirst}`} 
              />
            </div>

            <hr className={css.authHr}/>

            <div className={css.authInputDiv}>
              <input 
                required
                type        = "email"
                placeholder = "Enter Email"
                onChange    = {(e) => setEmail(e.target.value)}
                className   = {css.authInput}
              />
            </div>

            <hr className={css.authHr}/>

            <div className={css.authInputDiv}>
              <input 
                required
                type        = "password"
                placeholder = "Enter Password"
                onChange    = {(e) => setPassword(e.target.value)}
                className   = {`${css.authInput} ${css.authLast}`} 
              />
            </div>
          </div>

          <button className={css.authSubmitBtn} type='submit'><span>Sign Up</span></button>
        </form>

        <div className={css.authUrlDiv}>
          <a className={css.authUrlHint}>Already have an account ?</a>
          <a className={css.authUrl} onClick={redirectToLogin}>Log In</a>
        </div>

        {error &&(   
          <div className={`${css.authErrorDiv} ${error ? css.fadeIn : css.fadeOut}`}>
            <img 
              className = {css.authErrorIcon} 
              src       = {theme === 'dark' ? authErrorIconDark : authErrorIconLight}
              alt       = "auth-error-icon"
            />
        
            <div className={css.authErrorTextDiv}>
              <p className={css.authErrorHeader}>Error</p>
              <p className={css.authErrorText}>{error}</p>
            </div>
          </div>
        )}  
      </div>
    </div>
  );
};

export default Signup;