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
  serverTimestamp,
} from "firebase/firestore";

export default function Room() {
  // Set up and redirect if the url contains a system that doesn't exit
  const params = useParams();
  localStorage.setItem("room", params.room.replaceAll(" ", "-").replaceAll("%20", "-").toLowerCase());

  // Create the random number generator based on the user's seed and the current time
  const [generator, setGenerator] = useState();
  useEffect(() => {
    setGenerator(new MersenneTwister(localStorage.getItem("seed")));
  }, []);

  // Define the character name state
  const characterKey = "character-" + localStorage.getItem("room");
  const [characterName, setCharacterName] = useState(localStorage.getItem(characterKey) || "");
  useEffect(() => {
    localStorage.setItem(characterKey, characterName);
  }, [characterKey, characterName]);

  // Define the system that is currently being used
  const localSystemKey = "system-" + localStorage.getItem("room");
  const [system, setSystem] = useState(localStorage.getItem(localSystemKey) || "d20");

  // Define the dice being used for the system and its setting function
  const defaultDice = Object.keys(systemsJson[system])
    .filter((key) => key !== "hasFortune")
    .map((dice) => ({ id: dice, number: 0 }));
  const [diceNumbers, setDiceNumbers] = useState(defaultDice);
  const handleDiceNumbersChange = (newDiceNumbers) => {
    setDiceNumbers(newDiceNumbers);
  };

  // Set the new system, and in turn, the dice tray
  const handleSystemChange = (newSystem) => {
    setSystem(newSystem);
    localStorage.setItem(localSystemKey, newSystem);
    setDiceNumbers(
      Object.keys(systemsJson[newSystem])
        .filter((key) => key !== "hasFortune")
        .map((dice) => ({ id: dice, number: 0 }))
    );
    setRollFortune("none");
  };

  // Define the roll bonus and its setting function
  const [rollBonus, setRollBonus] = useState(0);
  const handleSetRollBonus = (value) => {
    setRollBonus(value);
  };

  // Define the advantage/disadvantage state
  const [rollFortune, setRollFortune] = useState("none"); // 'none', 'advantage', 'disadvantage'
  const handleRollFortuneClick = (fortune) => {
    setRollFortune((prev) => (prev === fortune ? "none" : fortune));
  };

  // Define the dice roll history and set it to be the last 15 rolls for the room
  const [diceRollHistory, setDiceRollHistory] = useState([]);

  // Use a snapshot listener to refresh the history when an update occurs
  useEffect(() => {
    const diceRollQuery = query(
      collection(db, "dice-rolls"),
      where("room", "==", localStorage.getItem("room")),
      orderBy("timestamp", "desc"),
      limit(15)
    );

    onSnapshot(diceRollQuery, (snapshot) =>
      setDiceRollHistory(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })))
    );
  }, []);

  // Roll the dice specified in the room and create a document in the database for the roll
  function rollDice() {
    const [diceTotal, diceRolls] = handleDiceRoll(
      generator,
      systemsJson[system],
      diceNumbers,
      rollBonus,
      rollFortune
    );
    const diceRollsCombined = Array.isArray(diceRolls) ? diceRolls.join(" | ") : diceRolls;
    const diceRoll = {
      character: characterName,
      total: diceTotal,
      diceRoll: diceRollsCombined,
      timestamp: serverTimestamp(),
      room: localStorage.getItem("room"),
      fortune: rollFortune,
    };
    addDoc(collection(db, "dice-rolls"), diceRoll);
    setRollFortune("none");
  }

  return (
    <div className={styles.pageContainer}>
      <section className={styles.header}>
        <SignOut />
        <System system={system} setSystem={handleSystemChange} />
        <ColourMode />
      </section>
      <h1 className={styles.roomHeader}>{localStorage.getItem("room").replaceAll("-", " ")}</h1>
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
          <div className={styles.bonusRow}>
            {systemsJson[system].hasFortune && (
              <button
                className={`${styles.fortuneButton} ${styles.advantage} ${
                  rollFortune === "advantage" ? styles.active : ""
                }`}
                onClick={() => handleRollFortuneClick("advantage")}
              >
                A
              </button>
            )}
            <RollBonus rollBonus={rollBonus} setRollBonus={handleSetRollBonus} />
            {systemsJson[system].hasFortune && (
              <button
                className={`${styles.fortuneButton} ${styles.disadvantage} ${
                  rollFortune === "disadvantage" ? styles.active : ""
                }`}
                onClick={() => handleRollFortuneClick("disadvantage")}
              >
                D
              </button>
            )}
          </div>
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
                  {roll.diceRoll.split(" : ").map((part, i) => {
                    const isHighlighted = part.startsWith("**") && part.endsWith("**");
                    const text = isHighlighted ? part.slice(2, -2) : part;
                    const highlightClass =
                      roll.fortune === "advantage"
                        ? styles.highlightedRollAdvantage
                        : roll.fortune === "disadvantage"
                        ? styles.highlightedRollDisadvantage
                        : styles.notHighlighted;
                    return (
                      <div key={i} className={isHighlighted ? highlightClass : styles.notHighlighted}>
                        <AutoTextSize mode="box">{text}</AutoTextSize>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
