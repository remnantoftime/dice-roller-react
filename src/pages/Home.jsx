import styles from "./Home.module.css";
import { useNavigate } from "react-router-dom";
import ColourMode from "../components/ColourMode";
import SignOut from "../components/SignOut";

export default function Home() {
  const navigate = useNavigate();

  const handleRoom = (r) => {
    r.preventDefault();
    const room = r.target[0].value.toLowerCase().replaceAll(" ", "-");
    navigate(`/${room}`);
  };

  return (
    <div className={styles.pageContainer}>
      <section id="Header" className={styles.header}>
        <SignOut />
        <ColourMode />
      </section>
      <div className={styles.container}>
        <h1 className={styles.headerTitle}>Adyn's Dice à la carte</h1>
        <form action="" className={styles.joinRoomForm} onSubmit={handleRoom}>
          <input
            className={styles.roomInput}
            type="text"
            name="Room Name"
            id="Room Name"
            placeholder="Room Name"
            required
          />
          <input className="hoverButton" type="submit" value="Join Room" />
        </form>
        <p>
          Enter a room name and join the room to start rolling dice. Once in a room, you will be
          able to click the icon in the middle of the header to change dice system.
        </p>
        <p>
          You can share rooms with other people by either telling them the room name so that they
          can join from this page, or sending them the link to the room directly.
        </p>
        <p>Only logged in users will be able to access the dice roller itself.</p>
      </div>
    </div>
  );
}
