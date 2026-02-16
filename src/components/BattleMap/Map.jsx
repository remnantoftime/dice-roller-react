import React, { useEffect, useRef, useState, useCallback } from "react";
import { db } from "../../configs/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import styles from "../../pages/Map.module.css";

const VIEWPORT_SIZE = 1500;
const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;

export default function Map({
  roomName,
  strokes,
  characters,
  setCharacters,
  tool,
  colour,
  size,
  onScaleChange,
}) {
  const canvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const cursorRef = useRef(null);
  const startPointRef = useRef(null);
  const dragListenersRef = useRef(null);
  const currentStrokeRef = useRef([]);
  const lastMousePos = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [characterImages, setCharacterImages] = useState({});
  const [draggedToken, setDraggedToken] = useState(null);
  const [scale, setScale] = useState(1);
  const [showCursor, setShowCursor] = useState(false);
  const [viewOffset, setViewOffset] = useState({ x: 700, y: 700 });
  const [viewZoom, setViewZoom] = useState(1500);
  const [isDraggingMap, setIsDraggingMap] = useState(false);

  const zoomScale = VIEWPORT_SIZE / viewZoom;

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
    const cellSize = 100;
    for (let i = 0; i <= 30; i++) {
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, MAP_HEIGHT);
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(MAP_WIDTH, i * cellSize);
    }
    ctx.stroke();
  };

  // Load character images
  useEffect(() => {
    characters.forEach((char) => {
      if (!char.image) return;

      const existingImg = characterImages[char.id];
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

  // Clamp viewOffset when zooming to prevent whitespace
  useEffect(() => {
    setViewOffset((prev) => {
      const visibleWidth = viewZoom;
      const maxX = Math.max(0, MAP_WIDTH - visibleWidth);
      const maxY = Math.max(0, MAP_HEIGHT - visibleWidth);
      return {
        x: Math.max(0, Math.min(prev.x, maxX)),
        y: Math.max(0, Math.min(prev.y, maxY)),
      };
    });
  }, [viewZoom]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        if (rect.width > 0) {
          const newScale = canvasRef.current.width / rect.width;
          setScale(newScale);
          if (onScaleChange) onScaleChange(newScale);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup drag listeners
  useEffect(() => {
    return () => {
      if (dragListenersRef.current) {
        window.removeEventListener("mousemove", dragListenersRef.current.move);
        window.removeEventListener("mouseup", dragListenersRef.current.up);
      }
    };
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.scale(zoomScale, zoomScale);
      ctx.translate(-viewOffset.x, -viewOffset.y);
      
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      strokes.forEach((stroke) => {
        drawStroke(ctx, stroke);
      });

      if (isDrawing && currentStrokeRef.current.length > 0) {
        drawStroke(ctx, {
          points: currentStrokeRef.current,
          color: colour,
          size: size,
          tool: tool,
        });
      }
      ctx.restore();
    }

    const gridCanvas = gridCanvasRef.current;
    if (gridCanvas) {
      const ctx = gridCanvas.getContext("2d");
      ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

      ctx.save();
      ctx.scale(zoomScale, zoomScale);
      ctx.translate(-viewOffset.x, -viewOffset.y);

      drawGrid(ctx);

      characters.forEach((char) => {
        if (draggedToken && draggedToken.char.id === char.id) return;
        if (char.x === null || char.y === null) return;
        if (!characterImages[char.id]) return;

        const cellSize = 100;
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

      if (draggedToken && characterImages[draggedToken.char.id]) {
        const cellSize = 100;
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
      ctx.restore();
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
    viewOffset,
    zoomScale,
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    
    return {
      x: (screenX / zoomScale) + viewOffset.x,
      y: (screenY / zoomScale) + viewOffset.y,
    };
  };

  const draw = (e) => {
    if (cursorRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scale = canvasRef.current.width / rect.width;
      const screenSize = (size * zoomScale) / scale;

      cursorRef.current.style.left = `${e.clientX}px`;
      cursorRef.current.style.top = `${e.clientY}px`;
      cursorRef.current.style.width = `${screenSize}px`;
      cursorRef.current.style.height = `${screenSize}px`;
    }

    if (draggedToken) {
      return;
    }

    if (isDraggingMap) return;

    if (!isDrawing) return;
    const coords = getCoordinates(e);
    const prevPoint = currentStrokeRef.current[currentStrokeRef.current.length - 1];

    if (tool === "line") {
      currentStrokeRef.current = [startPointRef.current, coords];
      redrawCanvas();
    } else {
      currentStrokeRef.current.push(coords);
      // We need to draw on the transformed context
      const ctx = canvasRef.current.getContext("2d");
      ctx.save();
      ctx.scale(zoomScale, zoomScale);
      ctx.translate(-viewOffset.x, -viewOffset.y);
      
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
      
      ctx.restore();
    }
  };

  const stopDrawing = useCallback(() => {
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
  }, [roomName, colour, size, tool]);

  useEffect(() => {
    if (!isDrawing && !isDraggingMap) return;

    const handleGlobalMouseUp = () => {
      if (isDrawing) stopDrawing();
      setIsDraggingMap(false);
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDrawing, isDraggingMap, stopDrawing]);

  const startDrawing = (e) => {
    if (tool === "cursor") {
      const coords = getCoordinates(e);
      const cellSize = 100;

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
        
        setDraggedToken({ char: clickedChar, x: coords.x - offsetX, y: coords.y - offsetY });

        const handleWindowMouseMove = (moveEvent) => {
          const newCoords = getCoordinates(moveEvent);
          setDraggedToken({
            char: clickedChar,
            x: newCoords.x - offsetX,
            y: newCoords.y - offsetY,
          });
        };

        const handleWindowMouseUp = (upEvent) => {
          window.removeEventListener("mousemove", handleWindowMouseMove);
          window.removeEventListener("mouseup", handleWindowMouseUp);
          dragListenersRef.current = null;

          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const isOutside =
            upEvent.clientX < rect.left ||
            upEvent.clientX > rect.right ||
            upEvent.clientY < rect.top ||
            upEvent.clientY > rect.bottom;

          if (isOutside) {
            setCharacters((prev) =>
              prev.map((char) =>
                char.id === clickedChar.id ? { ...char, x: null, y: null } : char
              )
            );
            const charRef = doc(db, "characters", clickedChar.id);
            setDoc(charRef, { ...clickedChar, x: null, y: null });
            setDraggedToken(null);
            return;
          }

          const finalCoords = getCoordinates(upEvent);
          const finalX = finalCoords.x - offsetX;
          const finalY = finalCoords.y - offsetY;

          let gridX = Math.round(finalX / cellSize);
          let gridY = Math.round(finalY / cellSize);

          if (gridX < 0 || gridX >= 30 || gridY < 0 || gridY >= 30) {
            gridX = null;
            gridY = null;
          }

          setCharacters((prev) =>
            prev.map((char) =>
              char.id === clickedChar.id ? { ...char, x: gridX, y: gridY } : char
            )
          );

          const charRef = doc(db, "characters", clickedChar.id);
          setDoc(charRef, {
            ...clickedChar,
            x: gridX,
            y: gridY,
          });

          setDraggedToken(null);
        };

        window.addEventListener("mousemove", handleWindowMouseMove);
        window.addEventListener("mouseup", handleWindowMouseUp);
        dragListenersRef.current = {
          move: handleWindowMouseMove,
          up: handleWindowMouseUp,
        };
      } else {
        // Drag map
        setIsDraggingMap(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        const handleWindowMouseMove = (moveEvent) => {
          const dx = moveEvent.clientX - lastMousePos.current.x;
          const dy = moveEvent.clientY - lastMousePos.current.y;
          lastMousePos.current = { x: moveEvent.clientX, y: moveEvent.clientY };

          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const cssToInternal = canvas.width / rect.width;

          const worldDx = (dx * cssToInternal) / zoomScale;
          const worldDy = (dy * cssToInternal) / zoomScale;

          setViewOffset((prev) => ({
            x: Math.max(0, Math.min(prev.x - worldDx, MAP_WIDTH - viewZoom)),
            y: Math.max(0, Math.min(prev.y - worldDy, MAP_HEIGHT - viewZoom)),
          }));
        };

        const handleWindowMouseUp = () => {
          setIsDraggingMap(false);
          window.removeEventListener("mousemove", handleWindowMouseMove);
          window.removeEventListener("mouseup", handleWindowMouseUp);
        };

        window.addEventListener("mousemove", handleWindowMouseMove);
        window.addEventListener("mouseup", handleWindowMouseUp);
      }
      return;
    }

    setIsDrawing(true);
    const coords = getCoordinates(e);
    currentStrokeRef.current = [coords];
    startPointRef.current = coords;

    if (tool !== "line") {
      const ctx = canvasRef.current.getContext("2d");
      ctx.save();
      ctx.scale(zoomScale, zoomScale);
      ctx.translate(-viewOffset.x, -viewOffset.y);
      
      ctx.beginPath();
      ctx.lineWidth = size;
      ctx.strokeStyle = colour;
      ctx.globalCompositeOperation =
        tool === "eraser" ? "destination-out" : "source-over";
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      
      ctx.restore();
    }
  };

  const handleDropOnCanvas = async (e) => {
    e.preventDefault();
    const charId = e.dataTransfer.getData("charId");
    if (!charId) return;

    const coords = getCoordinates(e);
    const cellSize = 100;
    const gridX = Math.floor(coords.x / cellSize);
    const gridY = Math.floor(coords.y / cellSize);

    const charRef = doc(db, "characters", charId);
    const charSnap = await getDoc(charRef);
    
    if (charSnap.exists()) {
      await setDoc(charRef, { ...charSnap.data(), x: gridX, y: gridY });
    }
  };

  const handleZoomIn = () => {
    setViewZoom((prev) => Math.max(500, prev - 200));
  };

  const handleZoomOut = () => {
    setViewZoom((prev) => Math.min(3000, prev + 200));
  };

  return (
    <div className={styles.canvasContainer} style={{ display: "grid", position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={VIEWPORT_SIZE}
        height={VIEWPORT_SIZE}
        className={styles.canvas}
        style={{
          cursor: tool === "cursor" ? (isDraggingMap ? "grabbing" : "grab") : "none",
          gridArea: "1 / 1",
          zIndex: 1,
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={(e) => {
          setShowCursor(false);
        }}
        onMouseEnter={() => setShowCursor(true)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropOnCanvas}
      />
      <canvas
        ref={gridCanvasRef}
        width={VIEWPORT_SIZE}
        height={VIEWPORT_SIZE}
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
      <div className={styles.zoomControls}>
        <button onClick={handleZoomIn} className={styles.zoomButton}>+</button>
        <button onClick={handleZoomOut} className={styles.zoomButton}>-</button>
      </div>
    </div>
  );
}