import css from '../Auth/index.module.css';
import { useNavigate } from 'react-router-dom';
import authErrorIconDark from '../assets/taskErrorDark.svg';
import authErrorIconLight from '../assets/taskErrorLight.svg';
import { type SyntheticEvent, useState, useEffect } from 'react'; 
import authSuccessIconDark from '../assets/authSuccessIconDark.svg';
import authSuccessIconLight from '../assets/authSuccessIconLight.svg';


const ForgotPassword = () => {
  
  const navigate              = useNavigate();
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [theme, setTheme]     = useState('light');


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
      const response = await fetch('/api/v1/forgot/', {
        method      : 'POST',
        headers     : { 'Content-Type': 'application/json' },
        credentials : 'include',
        body        : JSON.stringify({ email }),
      })

      if   (response.ok) { setSuccess(true); }
      else { setError('Enter a valid email address.'); }

    }
    catch (error) { setError('An error occurred please try again later'); }
  };


  const redirectToLogin = () => { navigate('/login/'); };
  

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
                type        = "email" 
                placeholder = "Enter Email"
                onChange    = {(e) => setEmail(e.target.value)} 
                className   = {`${css.authInput} ${css.authMiddle}`} 
              />
            </div>
          </div>

          <button className={css.authSubmitBtn} type='submit'><span>Send</span></button>
        </form>

        <div className={css.authUrlDiv}>
          <a className={css.authUrlHint}>Already have an account ?</a>
          <a className={css.authUrl} onClick={redirectToLogin}>Log In</a>
        </div>

        {success &&(  
          <div className={css.authErrorDiv}>
            <img 
              className = {css.authErrorIcon} 
              src       = {theme === 'dark' ? authSuccessIconDark : authSuccessIconLight}
              alt       = "auth-success-icon"
            />
            <div className={css.authErrorTextDiv}>
              <p className={css.authErrorHeader}>Success</p>
              <p className={css.authErrorText}>Email sent !</p>
            </div>
          </div>
        )}    

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

export default ForgotPassword;