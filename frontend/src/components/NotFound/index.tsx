import { useState, useEffect } from 'react';
import css from '../NotFound/index.module.css'
import { useNavigate } from 'react-router-dom'; 


const NotFound = () => {
    const [theme, setTheme] = useState('light');
    const navigate          = useNavigate();


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


    const handleHomeClick = () => { navigate('/'); };

    return (
        <div className={`${css.notFoundParentDiv} ${theme === 'dark' ? css.darkTheme : css.lightTheme}`}>
            <div className={css.notFoundParentDiv}>
                <div className={css.notFoundChildDiv}> 
                    <div className={css.notFoundHeaderDiv}>
                        <h1 className={css.notFoundHeader}>404</h1>
                    </div>
                    <div className={css.notFoundTextDiv}>
                        <h3 className={css.notFoundHint}>Oops! Page Not Found.</h3>
                        <p className={css.notFoundText}>The page you are looking for doesn't exist or has been moved.</p>
                        <button className={css.notFoundBtn} onClick={handleHomeClick}>Home</button>
                    </div> 
                </div> 
            </div> 
        </div>
    );
};

export default NotFound;