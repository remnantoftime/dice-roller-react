import styles from "./css/ColourMode.module.css";
import light from "../assets/theme-light.png";
import dark from "../assets/theme-dark.png";
import { useTheme } from "../context/ThemeContext";

export default function ColourMode() {
  const { theme, toggleTheme } = useTheme();
  const themeIcon = theme === "light" ? light : dark;

  return (
    <img
      className={styles.colourMode}
      src={themeIcon}
      alt="Colour mode icon"
      onClick={toggleTheme}
    />
  );
}
