import styles from "./css/DiceTray.module.css";
import { useTheme } from "../context/ThemeContext";

// Get the dice images
const imagesLight = {
  d4: require("../assets/dice/d4-light.png"),
  d6: require("../assets/dice/d6-light.png"),
  d8: require("../assets/dice/d8-light.png"),
  d10: require("../assets/dice/d10-light.png"),
  d12: require("../assets/dice/d12-light.png"),
  d20: require("../assets/dice/d20-light.png"),
  d100: require("../assets/dice/d100-light.png"),
};
const imagesDark = {
  d4: require("../assets/dice/d4-dark.png"),
  d6: require("../assets/dice/d6-dark.png"),
  d8: require("../assets/dice/d8-dark.png"),
  d10: require("../assets/dice/d10-dark.png"),
  d12: require("../assets/dice/d12-dark.png"),
  d20: require("../assets/dice/d20-dark.png"),
  d100: require("../assets/dice/d100-dark.png"),
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
