import css from '../Home/index.module.css';
import { type PlantProps } from '../types/index';
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
            <div className={`${css.homeClickedItemDiv} ${css.fadeIn} ${theme === 'dark' ? css.darkTheme : css.lightTheme}`}>  
                <h3 className={css.homeClickedItemHeader}>{plantDetail?.commonName}</h3>
                <p className={css.homeClickedItemText}>Scientific Name &nbsp;&nbsp;<p className={css.homeClickedValueText}>{plantDetail?.scientificName}</p></p>
              
                <div  className={css.homeClickedPlantsectionDiv}>
                    <p className={`${css.homeClickedItemText} ${css.homeClickedPlantText}`}>Plant Information</p>
                    <p className={`${css.homeClickedItemText} ${css.homeClickedPlantText}`}>
                        Family<p className={css.homeClickedValueText}>{plantDetail?.family}</p>
                    </p>
                    <p className={`${css.homeClickedItemText} ${css.homeClickedPlantText}`}>
                        Life Cycle <p className={css.homeClickedValueText}>{plantDetail?.lifeCycles?.join(', ')}</p>
                    </p>
                    <p className={`${css.homeClickedItemText} ${css.homeClickedPlantText}`}>
                        Height <p className={css.homeClickedValueText}>{plantDetail?.height} m</p>
                    </p>
                    <p className={`${css.homeClickedItemText} ${css.homeClickedPlantText}`}>
                        Width <p className={css.homeClickedValueText}>{plantDetail?.width} m</p>
                    </p>
                </div>
                 
                <div  className={css.homeClickedPlantsectionDiv}>
                    <p className={`${css.homeClickedItemText} ${css.homeClickedPlantText}`}>Growth Conditions</p>
                    <p className={`${css.homeClickedItemText} ${css.homeClickedPlantText}`}>
                        Soil pH <p className={css.homeClickedValueText}>{plantDetail?.soilPH}</p>
                    </p>
                    <p className={`${css.homeClickedItemText} ${css.homeClickedPlantText}`}>
                        Soil Type <p className={css.homeClickedValueText}>{plantDetail?.soilTypes?.join(', ')}</p>
                    </p>
                    <p className={`${css.homeClickedItemText} ${css.homeClickedPlantText}`}>
                        Light Requirement <p className={css.homeClickedValueText}>{plantDetail?.lightRequirements?.join(', ')}</p>
                    </p>
                    <p className={`${css.homeClickedItemText} ${css.homeClickedPlantText}`}>
                        USDA Hardiness Zone <p className={css.homeClickedValueText}>{plantDetail?.usdaHardinessZone}</p>
                    </p>
                </div>

                <div  className={css.homeClickedPlantsectionDiv}>
                    <p className={`${css.homeClickedItemText} ${css.homeClickedPlantText}`}>Utility | Use</p>

                    <ol className={css.homeClickedListItemText}> 
                        {plantDetail?.utility
                            ?.slice()  
                            .sort((a, b) => a.localeCompare(b))
                            .map((item, index) => { 
                            const capitalized = item.charAt(0).toUpperCase() + item.slice(1);
                            return <li key={`utility-${index}`}>{capitalized}</li>;
                        })}
                    </ol>
                </div>

                <div  className={css.homeClickedPlantsectionDiv}>
                    <p className={`${css.homeClickedItemText} ${css.homeClickedPlantText}`}>Alternate Names</p>

                    <ol className={css.homeClickedListItemText}> 
                        {plantDetail?.alternateNames
                            ?.filter((name, index, arr) => arr.indexOf(name) === index) 
                            .slice()
                            .sort((a, b) => a.localeCompare(b))
                            .map((name, index) => {
                                const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
                                return <li key={`alternateName-${index}`}>{capitalized}</li>;
                            })
                        }
                    </ol>
                </div>
 
                <div className={css.homeClickedItemFlexDiv}>
                    <button className={css.homeClickedShareBtn} onClick={() => handleItemShareClick('plant')}>
                        <img className={css.homeClickedIcon} src={taskShareLightIcon} alt="task-share-icon"/>
                    </button>

                    <div className={css.homeClickedItemBtnDiv}>
                        <button className={css.homeClickedModalCancelBtn} onClick={handleRemoveItemDetail}>Close</button>
                    </div>
                </div>  
            </div>
        </>
    );
};

export default ClickedPlant;