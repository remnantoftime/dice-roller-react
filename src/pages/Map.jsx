import React, { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import styles from "../components/BattleMap/BattleMap.module.css";
import ColourMode from "../components/ColourMode";
import SignOut from "../components/SignOut";
import BattleMap from "../components/BattleMap/BattleMap";

export default function MapPage() {
  const params = useParams();
  const roomName = useMemo(
    () => params.room.replaceAll(" ", "-").replaceAll("%20", "-").toLowerCase(),
    [params.room]
  );

  useEffect(() => {
    localStorage.setItem("room", roomName);
  }, [roomName]);

  return (
    <div className={styles.pageContainer}>
      <section className={styles.header}>
        <SignOut />
        <ColourMode />
      </section>
      <BattleMap roomName={roomName} />
    </div>
  );
}
