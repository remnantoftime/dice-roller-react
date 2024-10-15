function rollDice(generator, numberOfFaces, isFirst) {
  const roll = (generator.random_int() % numberOfFaces) + 1;
  const text = isFirst ? `${roll}` : `, ${roll}`;
  return [roll, text];
}

function rollDiceExplodeOnce(generator, numberOfFaces, isFirst) {
  var roll = (generator.random_int() % numberOfFaces) + 1;
  var text = isFirst ? `${roll}` : `, ${roll}`;

  if (roll === numberOfFaces) {
    const nextRoll = (generator.random_int() % numberOfFaces) + 1;
    roll += nextRoll;
    text += `, ${nextRoll}`;
  } else if (roll === 1) {
    const nextRoll = (generator.random_int() % numberOfFaces) + 1;
    roll -= nextRoll;
    text += `, -${nextRoll}`;
  }
  return [roll, text];
}

export function handleDiceRoll(generator, system, diceNumbers, bonus) {
  var total = 0;
  var rolls = [];

  diceNumbers.forEach((dice) => {
    if (dice.number === 0) {
      return;
    }
    const numberOfFaces = parseInt(dice.id.replace("d", ""));
    const diceConfig = system[dice.id];
    var diceTotal = 0;
    var diceRoll = `${dice.id}: `;

    for (var i = 0; i < dice.number; i++) {
      var rollTotal = 0;
      var rollText = "";

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

  total += parseInt(bonus || 0);
  if (bonus > 0) {
    rolls.push(`+ ${bonus}`);
  } else if (bonus < 0) {
    rolls.push(`- ${Math.abs(bonus)}`);
  }

  return [total, rolls];
}
