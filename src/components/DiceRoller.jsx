const getRoll = (generator, faces) => (generator.random_int() % faces) + 1;

function rollDice(generator, numberOfFaces, isFirst) {
  const roll = getRoll(generator, numberOfFaces);
  const text = isFirst ? `${roll}` : `, ${roll}`;
  return [roll, text];
}

function rollDiceExplodeOnce(generator, numberOfFaces, isFirst) {
  let roll = getRoll(generator, numberOfFaces);
  let text = isFirst ? `${roll}` : `, ${roll}`;

  if (roll === numberOfFaces) {
    const nextRoll = getRoll(generator, numberOfFaces);
    roll += nextRoll;
    text += `, ${nextRoll}`;
  } else if (roll === 1) {
    const nextRoll = getRoll(generator, numberOfFaces);
    roll -= nextRoll;
    text += `, -${nextRoll}`;
  }
  return [roll, text];
}

export function handleDiceRoll(generator, system, diceNumbers, bonus, rollFortune = "none") {
  const calculateRoll = () => {
    let total = 0;
    const rolls = [];
    const bonusValue = parseInt(bonus || 0);

    diceNumbers.forEach((dice) => {
      if (dice.number === 0) {
        return;
      }
      const numberOfFaces = parseInt(dice.id.slice(1));
      const diceConfig = system[dice.id];
      let diceTotal = 0;
      let diceRoll = `${dice.id}: `;

      for (let i = 0; i < dice.number; i++) {
        let rollTotal = 0;
        let rollText = "";

        switch (diceConfig.type) {
          case "explode-once":
            [rollTotal, rollText] = rollDiceExplodeOnce(generator, numberOfFaces, i === 0);
            break;
          case "normal":
          default:
            [rollTotal, rollText] = rollDice(generator, numberOfFaces, i === 0);
            break;
        }

        diceTotal += rollTotal;
        diceRoll += rollText;
      }
      total += diceTotal;
      rolls.push(diceRoll);
    });

    total += bonusValue;
    if (bonusValue > 0) {
      rolls.push(`+ ${bonusValue}`);
    } else if (bonusValue < 0) {
      rolls.push(`- ${Math.abs(bonusValue)}`);
    }

    return [total, rolls];
  };

  if (rollFortune === "advantage" || rollFortune === "disadvantage") {
    const [total1, rolls1] = calculateRoll();
    const [total2, rolls2] = calculateRoll();

    const roll1Str = `${rolls1.join(" | ")}`;
    const roll2Str = `${rolls2.join(" | ")}`;

    const isAdvantage = rollFortune === "advantage";
    const roll1IsBetter = isAdvantage ? total1 >= total2 : total1 <= total2;

    if (roll1IsBetter) {
      return [total1, [`**${roll1Str}** : ${roll2Str}`]];
    } else {
      return [total2, [`${roll1Str} : **${roll2Str}**`]];
    }
  }

  return calculateRoll();
}
