import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import styles from "./BattleMap.module.css";
import { db } from "../../configs/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  writeBatch,
  setDoc,
} from "firebase/firestore";
import MapTool from "./MapTool";

const Map = lazy(() => import("./Map"));

export default function BattleMap({ roomName }) {
  const [colour, setColour] = useState(
    localStorage.getItem("map_colour") || "#000000"
  );
  const [tool, setTool] = useState("cursor");
  const [size, setSize] = useState(10);
  const [strokes, setStrokes] = useState([]);
  const [scale, setScale] = useState(1);
  const [characters, setCharacters] = useState([]);
  const [newCharName, setNewCharName] = useState("");
  const [newCharSize, setNewCharSize] = useState(1);
  const [newCharColor, setNewCharColor] = useState("#000000");
  const [newCharImage, setNewCharImage] = useState(null);
  const [isAddingCharacter, setIsAddingCharacter] = useState(false);
  const fileInputRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const topBarRef = useRef(null);
  const [controlsHeight, setControlsHeight] = useState(0);
  const [draggedToken, setDraggedToken] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!topBarRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setControlsHeight(entry.target.offsetHeight);
      }
    });
    observer.observe(topBarRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    localStorage.setItem("map_colour", colour);
  }, [colour]);

  // Subscribe to strokes from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "map-strokes"),
      where("room", "==", roomName),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newStrokes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStrokes(newStrokes);
      },
      (error) => {
        console.error("Error fetching map strokes:", error);
      }
    );

    return () => unsubscribe();
  }, [roomName]);

  // Subscribe to characters
  useEffect(() => {
    const q = query(
      collection(db, "characters"),
      where("room", "==", roomName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newCharacters = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCharacters(newCharacters);
    });

    return () => unsubscribe();
  }, [roomName]);

  const undoLastStroke = async () => {
    if (strokes.length === 0) return;
    const lastStroke = strokes[strokes.length - 1];
    try {
      await deleteDoc(doc(db, "map-strokes", lastStroke.id));
    } catch (error) {
      console.error("Error undoing stroke:", error);
    }
  };

  const clearMap = async () => {
    if (strokes.length === 0) return;

    // Firestore batches allow up to 500 operations
    const batchSize = 500;
    const chunks = [];
    for (let i = 0; i < strokes.length; i += batchSize) {
      chunks.push(strokes.slice(i, i + batchSize));
    }

    try {
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((stroke) => {
          const ref = doc(db, "map-strokes", stroke.id);
          batch.delete(ref);
        });
        await batch.commit();
      }
    } catch (error) {
      console.error("Error clearing map:", error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Firestore doc limit is 1MB. Base64 adds ~33% overhead.
      if (file.size > 750 * 1024) {
        alert("Image is too large. Please use an image under 750KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCharImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addCharacter = async (e) => {
    e.preventDefault();
    if (!newCharName || !newCharImage) {
      alert("Please provide a name and an image.");
      return;
    }

    try {
      const charId = `${roomName}_${newCharName.replaceAll(" ", "-")}`;
      const newChar = {
        name: newCharName,
        size: newCharSize,
        image: newCharImage,
        color: newCharColor,
        room: roomName,
        x: null,
        y: null,
      };

      await setDoc(doc(db, "characters", charId), newChar);
      setNewCharName("");
      setNewCharImage(null);
      setIsAddingCharacter(false);
    } catch (error) {
      console.error("Error adding character:", error);
      alert("Failed to add character. The image might be too large (max 1MB).");
    }
  };

  const deleteCharacter = async (charId) => {
    await deleteDoc(doc(db, "characters", charId));
  };

  const handleDragStart = (e, char) => {
    e.dataTransfer.setData("charId", char.id);
    e.dataTransfer.effectAllowed = "copyMove";

    // Create a transparent image to hide the default ghost
    const img = new Image();
    img.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(img, 0, 0);

    setDragPosition({ x: e.clientX, y: e.clientY });
    setDraggedToken(char);
  };

  const handleDrag = (e) => {
    if (e.clientX === 0 && e.clientY === 0) return;
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => {
    setDraggedToken(null);
    setDragPosition({ x: 0, y: 0 });
  };

  return (
    <div className={styles.mainContent}>
      <MapTool
        ref={topBarRef}
        showControls={showControls}
        setShowControls={setShowControls}
        controlsHeight={controlsHeight}
        colour={colour}
        setColour={setColour}
        tool={tool}
        setTool={setTool}
        size={size}
        setSize={setSize}
        scale={scale}
        undoLastStroke={undoLastStroke}
        clearMap={clearMap}
        isAddingCharacter={isAddingCharacter}
        setIsAddingCharacter={setIsAddingCharacter}
        newCharName={newCharName}
        setNewCharName={setNewCharName}
        newCharSize={newCharSize}
        setNewCharSize={setNewCharSize}
        newCharColor={newCharColor}
        setNewCharColor={setNewCharColor}
        newCharImage={newCharImage}
        addCharacter={addCharacter}
        fileInputRef={fileInputRef}
        handleImageUpload={handleImageUpload}
        characters={characters}
        deleteCharacter={deleteCharacter}
        handleDragStart={handleDragStart}
        handleDrag={handleDrag}
        handleDragEnd={handleDragEnd}
      />
      <div className={styles.mapWrapper}>
        <Suspense fallback={<div>Loading Map...</div>}>
          <Map
            roomName={roomName}
            strokes={strokes}
            characters={characters}
            setCharacters={setCharacters}
            tool={tool}
            colour={colour}
            size={size}
            onScaleChange={setScale}
          />
        </Suspense>
      </div>
      {draggedToken && (
        <div
          style={{
            position: "fixed",
            left: dragPosition.x,
            top: dragPosition.y,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 10000,
            width: "50px",
            height: "50px",
          }}
        >
          <div
            className={styles.tokenCircle}
            style={{ borderColor: draggedToken.color || "#000" }}
          >
            <img
              src={draggedToken.image}
              alt={draggedToken.name}
              className={styles.tokenImage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
