import styles from "./Room.module.css";
import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import systemsJson from "../assets/systems/SystemDice.json";
import { DiceTray } from "../components/DiceTray";
import MersenneTwister from "mersenne-twister";
import { handleDiceRoll } from "../components/DiceRoller";
import { RollBonus } from "../components/RollBonus";
import { AutoTextSize } from "auto-text-size";
import ColourMode from "../components/ColourMode";
import { System } from "../components/System";
import SignOut from "../components/SignOut";
import { db } from "../configs/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  Timestamp,
} from "firebase/firestore";

export default function Room() {
  // Set up and redirect if the url contains a system that doesn't exit
  const params = useParams();
  const roomName = params.room.replaceAll(" ", "-").replaceAll("%20", "-").toLowerCase();

  // Create the random number generator based on the user's seed and the current time
  const [generator, setGenerator] = useState();
  useEffect(() => {
    setGenerator(new MersenneTwister(localStorage.getItem("seed")));
  }, []);

  // Define the character name state
  const characterKey = "character-" + roomName;
  const [characterName, setCharacterName] = useState(localStorage.getItem(characterKey) || "");
  useEffect(() => {
    localStorage.setItem(characterKey, characterName);
  }, [characterKey, characterName]);

  // Define the system that is currently being used
  const localSystemKey = `system-${roomName}`;
  const [system, setSystem] = useState(localStorage.getItem(localSystemKey) || "d20");

  // Define the dice being used for the system and its setting function
  const defaultDice = Object.keys(systemsJson[system]).map((dice) => ({ id: dice, number: 0 }));
  const [diceNumbers, setDiceNumbers] = useState(defaultDice);
  const handleDiceNumbersChange = (newDiceNumbers) => {
    setDiceNumbers(newDiceNumbers);
  };

  // Set the new system, and in turn, the dice tray
  const handleSystemChange = (newSystem) => {
    setSystem(newSystem);
    localStorage.setItem(localSystemKey, newSystem);
    setDiceNumbers(Object.keys(systemsJson[newSystem]).map((dice) => ({ id: dice, number: 0 })));
  };

  // Define the roll bonus and its setting function
  const [rollBonus, setRollBonus] = useState(0);
  const handleSetRollBonus = (value) => {
    setRollBonus(value);
  };

  // Define the dice roll history and set it to be the last 15 rolls for the room
  const [diceRollHistory, setDiceRollHistory] = useState([]);
  const diceRollQuery = query(
    collection(db, "dice-rolls"),
    where("room", "==", roomName),
    orderBy("timestamp", "desc"),
    limit(15)
  );

  // Use a snapshot listener to refresh the history when an update occurs
  useEffect(
    () =>
      onSnapshot(diceRollQuery, (snapshot) =>
        setDiceRollHistory(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })))
      ),
    []
  );

  // Roll the dice specified in the room and create a document in the database for the roll
  function rollDice() {
    const [diceTotal, diceRolls] = handleDiceRoll(
      generator,
      systemsJson[system],
      diceNumbers,
      rollBonus
    );
    const diceRollsCombined = diceRolls.join(" | ");
    const diceRoll = {
      character: characterName,
      total: diceTotal,
      diceRoll: diceRollsCombined,
      timestamp: Timestamp.now(),
      room: roomName,
    };
    addDoc(collection(db, "dice-rolls"), diceRoll);
  }

  return (
    <div className={styles.pageContainer}>
      <section className={styles.header}>
        <SignOut />
        <System system={system} setSystem={handleSystemChange} />
        <ColourMode />
      </section>
      <h1 className={styles.roomHeader}>{roomName.replaceAll("-", " ")}</h1>
      <div className={styles.dice_input}>
        <input
          type="text"
          placeholder="Character Name"
          className={styles.characterSelect}
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
        />
        <DiceTray diceNumbers={diceNumbers} setDiceNumbers={handleDiceNumbersChange} />
        <div className={styles.roller}>
          <RollBonus rollBonus={rollBonus} setRollBonus={handleSetRollBonus} />
          <input className={styles.roll_button} type="submit" value="Roll" onClick={rollDice} />
        </div>
      </div>
      <div className={styles.diceRolls}>
        {diceRollHistory.map((roll, index) => {
          return (
            <div key={index} className={styles.rollBanner}>
              <div className={styles.rollCharacter}>
                <AutoTextSize mode="box" maxFontSizePx="25" className={styles.characterFont}>
                  {roll.character}
                </AutoTextSize>
              </div>
              <div className={styles.rollDetails}>
                <div className={styles.rollTotal}>
                  <AutoTextSize mode="box">Total: {roll.total}</AutoTextSize>
                </div>
                <div className={styles.rollParts}>
                  <AutoTextSize mode="box">{roll.diceRoll}</AutoTextSize>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
