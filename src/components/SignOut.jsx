import styles from "./css/SignOut.module.css";
import light from "../assets/signout-light.png";
import dark from "../assets/signout-dark.png";
import { useTheme } from "../context/ThemeContext";
import { signOut } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SignOut() {
  const { theme } = useTheme();
  const logoutIcon = theme === "light" ? light : dark;

  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut()
      .then(navigate("/login"))
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <img className={styles.logoutImage} src={logoutIcon} alt="Logout" onClick={handleSignOut} />
  );
}
