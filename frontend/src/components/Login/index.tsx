import css from '../Auth/index.module.css';
import { useAuth } from '../Auth/authContext';
import { useNavigate } from 'react-router-dom';
import authDemoDarkSvg from '../assets/authDemoDark.svg';
import authDemoLightSvg from '../assets/authDemoLight.svg';
import authErrorIconDark from '../assets/taskErrorDark.svg';
import authErrorIconLight from '../assets/taskErrorLight.svg';
import { type SyntheticEvent, useState, useEffect } from 'react';


const Login = () => {
  
  const { setAccessToken }          = useAuth();
  const navigate                    = useNavigate();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [redirects, setRedirects]   = useState(false);
  const [theme, setTheme]           = useState('light');
  const [guestBoard, setGuestBoard] = useState(false);


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
      const response = await fetch('/api/v1/login/', {
        method      : 'POST',
        headers     : { 'Content-Type': 'application/json' },
        credentials : 'include',
        body        : JSON.stringify({ email, password }),
      });
  
      if (response.ok) {
        const data = await response.json(); 
        setAccessToken(data.token);

        if (data.guestMode) {
          navigate('/welcome/');  
          return;
        }
        setRedirects(true);
      } else {
        const data = await response.json();
        setError(data.detail);
      }
    } catch (error) { setError('An error occurred. Please try again.'); }
  };

  
  const redirectToSignup = () => { navigate('/signup/'); };


  const redirectToReset  = () => { navigate('/forgot/'); };


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
 

  useEffect(() => {
    const timer = setTimeout(() => { setGuestBoard(true); }, 500); 
    return () => clearTimeout(timer);  
  }, []);

  
  const toggleDemoVisibility = () => setGuestBoard(!guestBoard);

  return (
    <div className={`${css.authParent} ${theme === 'dark' ? css.darkTheme : css.lightTheme}`}>
      <div className={css.authContainer}>

        <form className={css.authForm} onSubmit={submit}>
          <div className={css.authInputParentDiv}>
            <div className={css.authInputDiv}>
              <input 
                required
                type        = "email"
                placeholder = "Email"
                onChange    = {(e) => setEmail(e.target.value)} 
                className   = {`${css.authInput} ${css.authFirst}`} 
              />
            </div>

            <hr className={css.authHr}/>

            <div className={css.authInputDiv}>
              <input 
                required
                type        = "password"
                placeholder = "Password"
                onChange    = {(e) => setPassword(e.target.value)}
                className   = {`${css.authInput} ${css.authLast}`} 
              />
            </div>
          </div>

          <button className={css.authSubmitBtn} type='submit'><span>Login</span></button>
        </form>

        <div className={css.authUrlDiv}>
          <a className={css.authUrlHint} onClick={redirectToReset}>Forgot Password ?</a>
          <a className={css.authUrl} onClick={redirectToSignup}>Sign Up</a>
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

        {guestBoard && (
          <div className={`${css.authDemoDiv} ${guestBoard ? css.fadeIn : css.fadeOut}`}>
            <img 
              className = {css.authDemoIcon} 
              src       = {theme === 'dark' ? authDemoDarkSvg : authDemoLightSvg}
              alt       = "auth-demo-icon"
            />
            <p className={css.authDemoText}>Guest account <strong>&nbsp;guest@vegconnect.com</strong> &nbsp;|&nbsp; password <strong>&nbsp;!justlooking#</strong></p>
            <p className={css.authDemoText} onClick={toggleDemoVisibility}>Hide</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;