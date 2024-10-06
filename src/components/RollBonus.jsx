import styles from "./css/RollBonus.module.css";

export const RollBonus = ({ rollBonus, setRollBonus }) => {
  // When the minus button is clicked, lower the value by 1, to a min of -100
  function decrement() {
    const value = parseInt(rollBonus);
    if (isNaN(value)) {
      // Set value to -1 if no value exists
      setRollBonus("-1");
    } else if (value > -100) {
      setRollBonus((value - 1).toString());
    }
  }

  // When the plus button is clicked, increase the value by 1, to a max of 100
  function increment() {
    const value = parseInt(rollBonus);
    if (isNaN(value)) {
      // Set value to 1 if no value exists
      setRollBonus("1");
    } else if (value < 100) {
      setRollBonus((value + 1).toString());
    }
  }

  // When the value is changed through keyboard input, set the value as long as
  // it is between -100 and 100
  function onChange(input) {
    const value = parseInt(input.target.value);
    if (isNaN(value)) {
      // Set value to empty if no value exists
      setRollBonus("");
      return;
    }
    if (value <= 100 && value >= -100) {
      setRollBonus(value);
    }
  }

  return (
    <div className={styles.roll_bonus}>
      <input type="button" className={styles.roll_bonus_minus} value="-" onClick={decrement} />
      <input
        type="number"
        className={styles.roll_bonus_input}
        value={rollBonus}
        onChange={onChange}
      />
      <input type="button" className={styles.roll_bonus_plus} value="+" onClick={increment} />
    </div>
  );
};
