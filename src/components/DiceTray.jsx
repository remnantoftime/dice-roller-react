import styles from "./css/DiceTray.module.css";
import { useTheme } from "../context/ThemeContext";

import d4Light from "../assets/dice/d4-light.png";
import d6Light from "../assets/dice/d6-light.png";
import d8Light from "../assets/dice/d8-light.png";
import d10Light from "../assets/dice/d10-light.png";
import d12Light from "../assets/dice/d12-light.png";
import d20Light from "../assets/dice/d20-light.png";
import d100Light from "../assets/dice/d100-light.png";

import d4Dark from "../assets/dice/d4-dark.png";
import d6Dark from "../assets/dice/d6-dark.png";
import d8Dark from "../assets/dice/d8-dark.png";
import d10Dark from "../assets/dice/d10-dark.png";
import d12Dark from "../assets/dice/d12-dark.png";
import d20Dark from "../assets/dice/d20-dark.png";
import d100Dark from "../assets/dice/d100-dark.png";

const imagesLight = {
  d4: d4Light,
  d6: d6Light,
  d8: d8Light,
  d10: d10Light,
  d12: d12Light,
  d20: d20Light,
  d100: d100Light,
};
const imagesDark = {
  d4: d4Dark,
  d6: d6Dark,
  d8: d8Dark,
  d10: d10Dark,
  d12: d12Dark,
  d20: d20Dark,
  d100: d100Dark,
};

function Dice({ id, number, onIncrease, onDecrease }) {
  // Set theme context and use correct image for the theme
  const { theme } = useTheme();
  const images = theme === "light" ? imagesLight : imagesDark;

  // Pass-through functions for increasing and decreasing based on the id of the dice
  const handleIncrease = () => {
    onIncrease(id);
  };
  const handleDecrease = () => {
    onDecrease(id);
  };

  // Return the dice along with it's visual numbered state
  return (
    <div className={styles.diceImageContainer} onContextMenu={(e) => e.preventDefault()}>
      <img
        src={images[id]}
        className={styles.diceImage}
        alt={id}
        onClick={handleIncrease}
        onContextMenu={handleDecrease}
      />
      {number > 0 && (
        <div className={styles.diceNumberBackground}>
          <h3 className={styles.diceNumber}>{number}</h3>
        </div>
      )}
    </div>
  );
}

export function DiceTray({ diceNumbers, setDiceNumbers }) {
  // When a dice is clicked, increase the number to a maximum of 12
  const handleIncrease = (id) => {
    setDiceNumbers(
      diceNumbers.map((dice) => {
        if (dice.id === id && dice.number < 12) {
          return { ...dice, number: dice.number + 1 };
        } else {
          return dice;
        }
      })
    );
  };

  // When a dice is right clicked, decrease the number ot a minimum of 0
  const handleDecrease = (id) => {
    setDiceNumbers(
      diceNumbers.map((dice) => {
        if (dice.id === id && dice.number > 0) {
          return { ...dice, number: dice.number - 1 };
        } else {
          return dice;
        }
      })
    );
  };

  // Return an array of dice with individual number states
  return (
    <div className={styles.diceTray}>
      {diceNumbers.map((dice) => (
        <Dice
          key={dice.id}
          id={dice.id}
          number={dice.number}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
        />
      ))}
    </div>
  );
}
