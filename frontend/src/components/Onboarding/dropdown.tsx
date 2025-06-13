import type { CityProps } from '../types';
import css from "../Onboarding/index.module.css";
import React, { useState, useRef, useEffect } from "react";
import onBoardingGlobeDarkIcon from '../assets/onBoardingGlobeDark.svg';
import onBoardingGlobeLightIcon from '../assets/onBoardingGlobeLight.svg';


interface LocationDropdownProps {
    theme: string
    cities: CityProps[];
    selectedCity: CityProps | null;
    onChange: (city: CityProps) => void;
}


export const LocationDropdown: React.FC<LocationDropdownProps> = ({ theme, cities, selectedCity, onChange }) => {

  const [isOpen, setIsOpen]                     = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef                            = useRef<HTMLDivElement>(null);


  const toggleDropdown = () => setIsOpen((prev) => !prev);


  const closeDropdown = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };


  const handleSelect = (city: CityProps) => {
    onChange(city);
    closeDropdown();
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown") {
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        setHighlightedIndex((prev) => (prev + 1) % cities.length);
        break;
      case "ArrowUp":
        setHighlightedIndex((prev) => (prev - 1 + cities.length) % cities.length);
        break;
      case "Enter":
        if (highlightedIndex >= 0) {
          handleSelect(cities[highlightedIndex]);
        }
        break;
      case "Escape":
        closeDropdown();
        break;
    }
  };


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <div className={`${css.onboardingDropdownParent} ${theme === 'dark' ? css.darkTheme : css.lightTheme}`} ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown}>
      <div
        className={css.onboardingDropdownDiv}
        onClick={toggleDropdown}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <img 
            alt       = "home-plant-pair-icon"
            className = {css.homePlantsPairHeaderIcon}  
            src       = {theme === 'light' ? onBoardingGlobeLightIcon : onBoardingGlobeDarkIcon} 
        />

        {selectedCity ? `${selectedCity.country} - ${selectedCity.name}` : "Select a city"}
      </div>

      {isOpen && (
        <div
          className={css.onboardingDropdownListDiv}
          role="listbox"
        >
          {cities.map((city, index) => (
            <div
              key={`${city.country}-${city.name}`}
              role="option"
              aria-selected={selectedCity?.name === city.name}
              className={`px-4 py-2 cursor-pointer ${
                highlightedIndex === index
                  ? "bg-blue-100"
                  : selectedCity?.name === city.name
                  ? "bg-gray-100"
                  : ""
              }`}
              onMouseDown={() => handleSelect(city)} 
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {city.country} - {city.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};