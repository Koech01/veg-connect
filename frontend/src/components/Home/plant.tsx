import css from '../Home/index.module.css';
import { PlantProps } from '../types/index';
import taskShareLightIcon from '../assets/taskShareLight.svg';


interface ClickedPlantProps {
    theme                   : string;
    plantDetail             : PlantProps | null;
    handleRemoveItemDetail  : () => void;
    handleItemShareClick    : (clickedItemType: 'task' | 'plant') => void;
}

const ClickedPlant: React.FC<ClickedPlantProps> = ({ 
    theme, plantDetail, handleRemoveItemDetail, handleItemShareClick
}) => {

    return (
        <>
            <div className={`${css.homeClickedItemDiv} ${css.fadeIn}`}>
                <h5 className={css.homeClickedItemHeader}>{plantDetail?.plantName}</h5>
                <p className={css.homeClickedItemText}>binomial name ~ {plantDetail?.binomialName}</p>
                <p className={css.homeClickedItemText}>{plantDetail?.description}</p>
              
                <div className={css.homeClickedItemFlexDiv}>
                    <button className={css.homeClickedShareBtn} onClick={() => handleItemShareClick('plant')}>
                        <img className={css.homeClickedIcon} src={taskShareLightIcon} alt="task-share-icon"/>
                    </button>

                    <div className={css.homeClickedItemBtnDiv}>
                        <button className={css.homeClickedModalCancelBtn} onClick={handleRemoveItemDetail}>Back</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClickedPlant;