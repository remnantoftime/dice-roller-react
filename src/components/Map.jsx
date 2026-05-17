import styles from "./css/Header.module.css";
import { useTheme } from "../context/ThemeContext";

import mapLight from "../assets/map-light.png";
import mapDark from "../assets/map-dark.png";

export const Map = ({ map, setMap }) => {
  // Set theme context and use correct image for the theme
  const { theme } = useTheme();
  const image = theme === "light" ? mapLight : mapDark;

  // When the image is clicked, change the map state
  const changeMap = () => {
    setMap(!map);
  };

  return (
    <img
      src={image}
      className={styles.headerImage}
      alt="Enable/Disable Map"
      onClick={changeMap}
      style={{ paddingLeft: "10px" }}
    />
  );
};
