import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import styles from "./Map.module.css";
import { db } from "../configs/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  writeBatch,
  setDoc,
  getDoc,
} from "firebase/firestore";
import ColourMode from "../components/ColourMode";
import SignOut from "../components/SignOut";

const MAP_WIDTH = 1500;
const MAP_HEIGHT = 1500;

const drawStroke = (ctx, stroke) => {
  if (!stroke.points || stroke.points.length < 1) return;

  ctx.beginPath();
  ctx.lineWidth = stroke.size;
  ctx.strokeStyle = stroke.colour || stroke.color || "#000000";
  ctx.globalCompositeOperation =
    stroke.tool === "eraser" ? "destination-out" : "source-over";

  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
};

const drawGrid = (ctx) => {
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ccc";
  const cellSize = MAP_WIDTH / 15;
  for (let i = 0; i <= 15; i++) {
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, MAP_HEIGHT);
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(MAP_WIDTH, i * cellSize);
  }
  ctx.stroke();
};

const BrushIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 0 0-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 0 0 0-1.41z" />
  </svg>
);

const EraserIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.77-.78 2.04 0 2.83L5.17 20.1c.78.78 2.05.78 2.83 0l11.03-11.03c.79-.79.79-2.04 0-2.83l-2.58-2.58c-.39-.4-.9-.59-1.41-.59z" />
  </svg>
);

const LineIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M3.5 18.49l1.5 1.5L21 4.5 19.5 3z" />
  </svg>
);

const UndoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
  </svg>
);

const ClearIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);

const CursorIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M13.64 21.97C13.14 22.21 12.54 22.03 12.28 21.5L10.13 17.24L6.4 21C5.9 21.5 5.1 21.5 4.6 21L3 19.4C2.5 18.9 2.5 18.1 3 17.6L6.74 13.87L2.5 11.72C1.97 11.46 1.79 10.86 2.03 10.36C2.2 9.97 2.6 9.74 3 9.75L21 2.25L14.25 20.25C14.05 20.73 13.47 20.95 13 20.75L13.64 21.97Z" />
  </svg>
);

const Size1Icon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <rect x="8" y="8" width="8" height="8" rx="1" />
  </svg>
);

const Size2Icon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <rect x="3" y="8" width="8" height="8" rx="1" />
    <rect x="13" y="8" width="8" height="8" rx="1" />
  </svg>
);

const Size3Icon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <rect x="1" y="8" width="6" height="8" rx="1" />
    <rect x="9" y="8" width="6" height="8" rx="1" />
    <rect x="17" y="8" width="6" height="8" rx="1" />
  </svg>
);

export default function Map() {
  const params = useParams();
  const roomName = useMemo(
    () => params.room.replaceAll(" ", "-").replaceAll("%20", "-").toLowerCase(),
    [params.room]
  );

  useEffect(() => {
    localStorage.setItem("room", roomName);
  }, [roomName]);

  const canvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const cursorRef = useRef(null);
  const startPointRef = useRef(null);
  const dragListenersRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [colour, setColour] = useState(
    localStorage.getItem("map_colour") || "#000000"
  );
  const [tool, setTool] = useState("cursor");
  const [size, setSize] = useState(10);
  const [strokes, setStrokes] = useState([]);
  const currentStrokeRef = useRef([]);
  const [showCursor, setShowCursor] = useState(false);
  const [scale, setScale] = useState(1);
  const [characters, setCharacters] = useState([]);
  const [characterImages, setCharacterImages] = useState({});
  const [newCharName, setNewCharName] = useState("");
  const [newCharSize, setNewCharSize] = useState(1);
  const [newCharColor, setNewCharColor] = useState("#000000");
  const [newCharImage, setNewCharImage] = useState(null);
  const [draggedToken, setDraggedToken] = useState(null);
  const [isAddingCharacter, setIsAddingCharacter] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("map_colour", colour);
  }, [colour]);

  // Cleanup drag listeners on unmount
  useEffect(() => {
    return () => {
      if (dragListenersRef.current) {
        window.removeEventListener("mousemove", dragListenersRef.current.move);
        window.removeEventListener("mouseup", dragListenersRef.current.up);
      }
    };
  }, []);

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

  // Load character images
  useEffect(() => {
    characters.forEach((char) => {
      if (!char.image) return;

      const existingImg = characterImages[char.id];
      // Check if image needs loading (new or changed)
      if (!existingImg || existingImg.originalSrc !== char.image) {
        const img = new Image();
        img.src = char.image;
        img.originalSrc = char.image;
        img.onload = () => {
          setCharacterImages((prev) => ({ ...prev, [char.id]: img }));
        };
      }
    });
  }, [characters, characterImages]);

  // Calculate scale factor on resize to ensure preview matches grid appearance
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        if (rect.width > 0) {
          setScale(canvasRef.current.width / rect.width);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      strokes.forEach((stroke) => {
        drawStroke(ctx, stroke);
      });

      // Also redraw the current stroke being drawn to prevent it disappearing on DB updates
      if (isDrawing && currentStrokeRef.current.length > 0) {
        drawStroke(ctx, {
          points: currentStrokeRef.current,
          color: colour,
          size: size,
          tool: tool,
        });
      }
    }

    const gridCanvas = gridCanvasRef.current;
    if (gridCanvas) {
      const ctx = gridCanvas.getContext("2d");
      ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

      drawGrid(ctx);

      // Draw characters
      characters.forEach((char) => {
        // Skip if this is the token being dragged (it will be drawn at mouse pos)
        if (draggedToken && draggedToken.char.id === char.id) return;
        if (char.x === null || char.y === null) return;
        if (!characterImages[char.id]) return;

        const cellSize = MAP_WIDTH / 15;
        const x = char.x * cellSize;
        const y = char.y * cellSize;
        const size = char.size * cellSize;
        const radius = size / 2;
        const centerX = x + radius;
        const centerY = y + radius;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(characterImages[char.id], x, y, size, size);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.lineWidth = 5;
        ctx.strokeStyle = char.color || "#000000";
        ctx.stroke();
      });

      // Draw dragged token
      if (draggedToken && characterImages[draggedToken.char.id]) {
        const cellSize = MAP_WIDTH / 15;
        const size = draggedToken.char.size * cellSize;
        const radius = size / 2;
        const centerX = draggedToken.x + radius;
        const centerY = draggedToken.y + radius;

        ctx.globalAlpha = 0.7;
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(
          characterImages[draggedToken.char.id],
          draggedToken.x,
          draggedToken.y,
          size,
          size
        );
        ctx.restore();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.lineWidth = 5;
        ctx.strokeStyle = draggedToken.char.color || "#000000";
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }
  }, [
    strokes,
    characters,
    characterImages,
    draggedToken,
    isDrawing,
    colour,
    size,
    tool,
  ]);

  // Redraw canvas when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const draw = (e) => {
    // Update cursor position
    if (cursorRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scale = canvasRef.current.width / rect.width;
      const screenSize = size / scale;

      cursorRef.current.style.left = `${e.clientX}px`;
      cursorRef.current.style.top = `${e.clientY}px`;
      cursorRef.current.style.width = `${screenSize}px`;
      cursorRef.current.style.height = `${screenSize}px`;
    }

    // If we are dragging a token via the window listeners, we don't need to do anything here
    // except perhaps update the cursor, but the token position is handled by handleWindowMouseMove.
    // We return early to prevent drawing lines while dragging a token.
    if (draggedToken) {
      return;
    }

    if (!isDrawing) return;
    const coords = getCoordinates(e);
    const prevPoint = currentStrokeRef.current[currentStrokeRef.current.length - 1];

    if (tool === "line") {
      // Update state with just start and end points
      currentStrokeRef.current = [startPointRef.current, coords];
      redrawCanvas();
    } else {
      currentStrokeRef.current.push(coords);
      const ctx = canvasRef.current.getContext("2d");
      ctx.lineWidth = size;
      ctx.strokeStyle = colour;
      ctx.globalCompositeOperation =
        tool === "eraser" ? "destination-out" : "source-over";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      if (prevPoint) {
        ctx.moveTo(prevPoint.x, prevPoint.y);
      }
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStrokeRef.current.length > 0) {
      const newStroke = {
        room: roomName,
        points: currentStrokeRef.current,
        colour: colour,
        size: size,
        tool: tool,
        timestamp: serverTimestamp(),
      };
      addDoc(collection(db, "map-strokes"), newStroke);
    }
    currentStrokeRef.current = [];
  };

  const startDrawing = (e) => {
    if (tool === "cursor") {
      const coords = getCoordinates(e);
      const cellSize = MAP_WIDTH / 15;

      // Find clicked character (reverse to pick top-most if overlapping)
      const clickedChar = [...characters].reverse().find((char) => {
        if (char.x === null || char.y === null) return false;
        const charX = char.x * cellSize;
        const charY = char.y * cellSize;
        const charSize = char.size * cellSize;
        return (
          coords.x >= charX &&
          coords.x <= charX + charSize &&
          coords.y >= charY &&
          coords.y <= charY + charSize
        );
      });

      if (clickedChar) {
        const offsetX = coords.x - clickedChar.x * cellSize;
        const offsetY = coords.y - clickedChar.y * cellSize;
        
        // Set initial drag state
        setDraggedToken({ char: clickedChar, x: coords.x - offsetX, y: coords.y - offsetY });

        // Define window listeners for smooth dragging off-canvas
        const handleWindowMouseMove = (moveEvent) => {
          const newCoords = getCoordinates(moveEvent);
          setDraggedToken({
            char: clickedChar,
            x: newCoords.x - offsetX,
            y: newCoords.y - offsetY,
          });
        };

        const handleWindowMouseUp = (upEvent) => {
          // Remove listeners
          window.removeEventListener("mousemove", handleWindowMouseMove);
          window.removeEventListener("mouseup", handleWindowMouseUp);
          dragListenersRef.current = null;

          const finalCoords = getCoordinates(upEvent);
          const finalX = finalCoords.x - offsetX;
          const finalY = finalCoords.y - offsetY;

          // Snap to grid
          let gridX = Math.round(finalX / cellSize);
          let gridY = Math.round(finalY / cellSize);

          // If dropped off the grid, remove from map (set x/y to null)
          if (gridX < 0 || gridX >= 15 || gridY < 0 || gridY >= 15) {
            gridX = null;
            gridY = null;
          }

          // Optimistically update local state to prevent ghosting
          setCharacters((prev) =>
            prev.map((char) =>
              char.id === clickedChar.id ? { ...char, x: gridX, y: gridY } : char
            )
          );

          // Update Firestore
          const charRef = doc(db, "characters", clickedChar.id);
          setDoc(charRef, {
            ...clickedChar,
            x: gridX,
            y: gridY,
          });

          setDraggedToken(null);
        };

        // Attach listeners to window
        window.addEventListener("mousemove", handleWindowMouseMove);
        window.addEventListener("mouseup", handleWindowMouseUp);
        dragListenersRef.current = {
          move: handleWindowMouseMove,
          up: handleWindowMouseUp,
        };
      }
      return;
    }

    setIsDrawing(true);
    const coords = getCoordinates(e);
    currentStrokeRef.current = [coords];
    startPointRef.current = coords;

    // Draw immediately for local feedback
    if (tool !== "line") {
      const ctx = canvasRef.current.getContext("2d");
      ctx.beginPath();
      ctx.lineWidth = size;
      ctx.strokeStyle = colour;
      ctx.globalCompositeOperation =
        tool === "eraser" ? "destination-out" : "source-over";
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

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
        size: parseInt(newCharSize),
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

  const handleDropOnCanvas = async (e) => {
    e.preventDefault();
    const charId = e.dataTransfer.getData("charId");
    if (!charId) return;

    const coords = getCoordinates(e);
    const cellSize = MAP_WIDTH / 15;
    const gridX = Math.floor(coords.x / cellSize);
    const gridY = Math.floor(coords.y / cellSize);

    const charRef = doc(db, "characters", charId);
    const charSnap = await getDoc(charRef);
    
    if (charSnap.exists()) {
      await setDoc(charRef, { ...charSnap.data(), x: gridX, y: gridY });
    }
  };

  return (
    <div className={styles.pageContainer}>
      <section className={styles.header}>
        <SignOut />
        <ColourMode />
      </section>
      <h1 className={styles.mapHeader}>Battle Map: {roomName.replaceAll("-", " ")}</h1>
      <div className={styles.mainContent}>
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label
              htmlFor="colourPicker"
              className={styles.colorPreviewLabel}
              title="Click to change color"
            >
              <div className={styles.sizePreviewContainer}>
                <div
                  className={styles.sizePreview}
                  style={{
                    width: size / scale,
                    height: size / scale,
                    backgroundColor: tool === "eraser" ? "#fff" : colour,
                  }}
                />
              </div>
            </label>
            <input
              id="colourPicker"
              type="color"
              value={colour}
              onChange={(e) => {
                setColour(e.target.value);
                if (tool === "eraser") setTool("brush");
              }}
              className={styles.hiddenColorInput}
            />
          </div>
          <div className={styles.toolGrid}>
            <button
              className={`${styles.iconButton} ${
                tool === "cursor" ? styles.active : ""
              }`}
              onClick={() => setTool("cursor")}
              title="Select / Move"
            >
              <CursorIcon />
            </button>
            <button
              className={`${styles.iconButton} ${
                tool === "brush" ? styles.active : ""
              }`}
              onClick={() => setTool("brush")}
              title="Brush"
            >
              <BrushIcon />
            </button>
            <button
              className={`${styles.iconButton} ${
                tool === "eraser" ? styles.active : ""
              }`}
              onClick={() => setTool("eraser")}
              title="Eraser"
            >
              <EraserIcon />
            </button>
            <button
              className={`${styles.iconButton} ${
                tool === "line" ? styles.active : ""
              }`}
              onClick={() => setTool("line")}
              title="Line"
            >
              <LineIcon />
            </button>
          </div>
          <div className={styles.controlGroup}>
            <input
              id="sizeSlider"
              type="range"
              min="10"
              max="200"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className={styles.sizeSlider}
            />
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.iconButton} onClick={undoLastStroke} title="Undo">
              <UndoIcon />
            </button>
            <button className={styles.iconButton} onClick={clearMap} title="Clear Map">
              <ClearIcon />
            </button>
          </div>
        </div>
        <div className={styles.canvasContainer} style={{ display: "grid" }}>
          <canvas
            ref={canvasRef}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            className={styles.canvas}
            style={{
              cursor: tool === "cursor" ? "default" : "none",
              gridArea: "1 / 1",
              zIndex: 1,
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={(e) => {
              stopDrawing();
              setShowCursor(false);
            }}
            onMouseEnter={() => setShowCursor(true)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnCanvas}
          />
          <canvas
            ref={gridCanvasRef}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            className={styles.canvas}
            style={{
              gridArea: "1 / 1",
              zIndex: 2,
              pointerEvents: "none",
              backgroundColor: "transparent",
            }}
          />
          {showCursor && tool !== "cursor" && (
            <div
              ref={cursorRef}
              className={styles.cursor}
              style={{
                borderColor: tool === "eraser" ? "#000" : colour,
                backgroundColor:
                  tool === "eraser" ? "rgba(255,255,255,0.5)" : "transparent",
              }}
            />
          )}
        </div>
        <div className={styles.sidebar}>
          <h2>Characters</h2>
          {isAddingCharacter ? (
            <div className={styles.addCharacterMenu}>
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "0.5rem" }}>
                <button
                  onClick={() => setIsAddingCharacter(false)}
                  style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "inherit", padding: 0 }}
                >
                  ×
                </button>
              </div>
              <form onSubmit={addCharacter} className={styles.characterForm}>
                <div className={styles.tokenPreviewContainer}>
                  <div
                    className={styles.tokenPreview}
                    style={{ borderColor: newCharColor }}
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to upload image"
                  >
                    {newCharImage ? (
                      <img
                        src={newCharImage}
                        alt="Preview"
                        className={styles.tokenImage}
                      />
                    ) : (
                      <span className={styles.addIcon}>+</span>
                    )}
                  </div>
                </div>
                <div className={styles.controlsRow}>
                  <input
                    type="color"
                    value={newCharColor}
                    onChange={(e) => setNewCharColor(e.target.value)}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.sizeButtonGroup}>
                  <button
                    type="button"
                    className={`${styles.sizeButton} ${newCharSize === 1 ? styles.active : ""}`}
                    onClick={() => setNewCharSize(1)}
                    title="Normal (1x1)"
                  >
                    <Size1Icon />
                  </button>
                  <button
                    type="button"
                    className={`${styles.sizeButton} ${newCharSize === 2 ? styles.active : ""}`}
                    onClick={() => setNewCharSize(2)}
                    title="Large (2x2)"
                  >
                    <Size2Icon />
                  </button>
                  <button
                    type="button"
                    className={`${styles.sizeButton} ${newCharSize === 3 ? styles.active : ""}`}
                    onClick={() => setNewCharSize(3)}
                    title="Huge (3x3)"
                  >
                    <Size3Icon />
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={styles.hiddenFileInput}
                  ref={fileInputRef}
                />
                <button type="submit" className={styles.addButton}>Add</button>
              </form>
            </div>
          ) : (
            <div className={styles.reserveGrid}>
              {characters
                .filter((c) => c.x === null || c.y === null)
                .map((char) => (
                  <div
                    key={char.id}
                    className={styles.tokenWrapper}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("charId", char.id);
                      const tokenCircle = e.currentTarget.children[0];
                      if (tokenCircle) {
                        e.dataTransfer.setDragImage(tokenCircle, 25, 25);
                      }
                    }}
                    title={char.name}
                  >
                    <div className={styles.tokenCircle} style={{ borderColor: char.color || "#000" }}>
                      <img
                        src={char.image}
                        alt={char.name}
                        className={styles.tokenImage}
                        draggable={false}
                      />
                    </div>
                    <button
                      onClick={() => deleteCharacter(char.id)}
                      className={styles.deleteTokenButton}
                    >
                      ×
                    </button>
                  </div>
                ))}
              <div
                className={styles.tokenWrapper}
                onClick={() => setIsAddingCharacter(true)}
                title="Add Character"
                style={{ cursor: "pointer" }}
              >
                <div className={styles.tokenCircle} style={{ borderColor: "#ccc", borderStyle: "dashed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "24px", color: "#ccc", fontWeight: "bold" }}>?</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
