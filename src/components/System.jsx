import styles from "./css/System.module.css";
import { useTheme } from "../context/ThemeContext";
import diceSystems from "../assets/systems/SystemDice.json";

import cyberpunkLight from "../assets/systems/cyberpunk-light.png";
import d20Light from "../assets/systems/d20-light.png";
import cyberpunkDark from "../assets/systems/cyberpunk-dark.png";
import d20Dark from "../assets/systems/d20-dark.png";

const imagesLight = {
  cyberpunk: cyberpunkLight,
  d20: d20Light,
};
const imagesDark = {
  cyberpunk: cyberpunkDark,
  d20: d20Dark,
};

// Get the list of system names
const systems = Object.keys(diceSystems);
const systemNames = {
  cyberpunk: "Cyberpunk RED",
  d20: "D20 System",
};

export const System = ({ system, setSystem }) => {
  // Set theme context and use correct image for the theme
  const { theme } = useTheme();
  const images = theme === "light" ? imagesLight : imagesDark;

  // When the image is clicked, change the system to the next system
  const systemIndex = systems.findIndex((systemName) => systemName === system);
  const changeSystem = () => {
    const newSystemIndex = systems.length - 1 === systemIndex ? 0 : systemIndex + 1;
    const newSystem = systems[newSystemIndex];
    setSystem(newSystem);
  };

  return (
    <img
      src={images[system]}
      className={styles.systemImage}
      alt={systemNames[system]}
      onClick={changeSystem}
    />
  );
};
