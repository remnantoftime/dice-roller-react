import React from "react";
import styles from "./BattleMap.module.css";
import { useTheme } from "../../context/ThemeContext";
import brushLight from "../../assets/map/brush-light.png";
import brushDark from "../../assets/map/brush-dark.png";
import cursorLight from "../../assets/map/cursor-light.png";
import cursorDark from "../../assets/map/cursor-dark.png";
import deleteLight from "../../assets/map/delete-light.png";
import deleteDark from "../../assets/map/delete-dark.png";
import eraserLight from "../../assets/map/eraser-light.png";
import eraserDark from "../../assets/map/eraser-dark.png";
import lineLight from "../../assets/map/line-light.png";
import lineDark from "../../assets/map/line-dark.png";
import undoLight from "../../assets/map/undo-light.png";
import undoDark from "../../assets/map/undo-dark.png";
import size1Light from "../../assets/map/size1-light.png";
import size1Dark from "../../assets/map/size1-dark.png";
import size2Light from "../../assets/map/size2-light.png";
import size2Dark from "../../assets/map/size2-dark.png";
import size3Light from "../../assets/map/size3-light.png";
import size3Dark from "../../assets/map/size3-dark.png";

const imagesLight = {
  brush: brushLight,
  cursor: cursorLight,
  delete: deleteLight,
  eraser: eraserLight,
  line: lineLight,
  undo: undoLight,
  size1: size1Light,
  size2: size2Light,
  size3: size3Light,
};
const imagesDark = {
  brush: brushDark,
  cursor: cursorDark,
  delete: deleteDark,
  eraser: eraserDark,
  line: lineDark,
  undo: undoDark,
  size1: size1Dark,
  size2: size2Dark,
  size3: size3Dark,
};

const MapTool = ({
      colour,
      setColour,
      tool,
      setTool,
      size,
      setSize,
      scale,
      undoLastStroke,
      clearMap,
      isAddingCharacter,
      setIsAddingCharacter,
      newCharName,
      setNewCharName,
      newCharSize,
      setNewCharSize,
      newCharColor,
      setNewCharColor,
      newCharImage,
      addCharacter,
      fileInputRef,
      handleImageUpload,
      characters,
      deleteCharacter,
      handleDragStart,
      handleDrag,
      handleDragEnd,
}) => {
    const { theme } = useTheme();
    const images = theme === "light" ? imagesLight : imagesDark;

    return (
      <>
      <div className={styles.topBar}>
        <div className={styles.mapControls}>
          <div className={styles.brushControls}>
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
            <input
              id="sizeSlider"
              type="range"
              min="10"
              max="100"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className={styles.sizeSlider}
            />
          </div>
          <div className={styles.toolAndActions}>
            <div className={styles.toolGrid}>
              <button
                className={`${styles.iconButton} ${
                  tool === "cursor" ? styles.active : ""
                }`}
                onClick={() => setTool("cursor")}
                title="Select / Move"
              >
                <img src={images.cursor} alt="Cursor" width="24" height="24" />
              </button>
              <button
                className={`${styles.iconButton} ${
                  tool === "brush" ? styles.active : ""
                }`}
                onClick={() => setTool("brush")}
                title="Brush"
              >
                <img src={images.brush} alt="Brush" width="24" height="24" />
              </button>
              <button
                className={`${styles.iconButton} ${
                  tool === "eraser" ? styles.active : ""
                }`}
                onClick={() => setTool("eraser")}
                title="Eraser"
              >
                <img src={images.eraser} alt="Eraser" width="24" height="24" />
              </button>
              <button
                className={`${styles.iconButton} ${
                  tool === "line" ? styles.active : ""
                }`}
                onClick={() => setTool("line")}
                title="Line"
              >
                <img src={images.line} alt="Line" width="24" height="24" />
              </button>
            </div>
            <div className={styles.actionButtons}>
              <button
                className={styles.iconButton}
                onClick={undoLastStroke}
                title="Undo"
              >
                <img src={images.undo} alt="Undo" width="24" height="24" />
              </button>
              <button
                className={styles.iconButton}
                onClick={clearMap}
                title="Clear Map"
              >
                <img src={images.delete} alt="Clear" width="24" height="24" />
              </button>
            </div>
          </div>
        </div>
        <div className={styles.characterControls}>
          <div className={styles.reserveGrid}>
            <div
              className={styles.tokenWrapper}
              onClick={() => setIsAddingCharacter(true)}
              title="Add Character"
              style={{ cursor: "pointer" }}
            >
              <div
                className={styles.tokenCircle}
                style={{
                  borderColor: "#ccc",
                  borderStyle: "dashed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "24px",
                    color: "#ccc",
                    fontWeight: "bold",
                  }}
                >
                  +
                </span>
              </div>
            </div>
            {characters
              .filter((c) => c.x === null || c.y === null)
              .map((char) => (
                <div
                  key={char.id}
                  className={styles.tokenWrapper}
                  draggable
                  onDragStart={(e) => handleDragStart(e, char)}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  title={char.name}
                >
                  <div
                    className={styles.tokenCircle}
                    style={{ borderColor: char.color || "#000" }}
                  >
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
          </div>
        </div>
      </div>
      {isAddingCharacter && (
        <div className={styles.addCharacterModalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsAddingCharacter(false); }}>
          <div className={styles.addCharacterMenu}>
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
              <div className={styles.characterFormInputs}>
                <div className={styles.controlsRow}>
                  <input
                    type="color"
                    value={newCharColor}
                    onChange={(e) => setNewCharColor(e.target.value)}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    placeholder="Character Name"
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.controlsRow}>
                  <div className={styles.sizeButtonGroup}>
                    <button
                      type="button"
                      className={`${styles.sizeButton} ${
                        newCharSize === 1 ? styles.active : ""
                      }`}
                      onClick={() => setNewCharSize(1)}
                      title="Normal (1x1)"
                    >
                      <img src={images.size1} alt="Size 1" width="24" height="24" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.sizeButton} ${
                        newCharSize === 2 ? styles.active : ""
                      }`}
                      onClick={() => setNewCharSize(2)}
                      title="Large (2x2)"
                    >
                      <img src={images.size2} alt="Size 2" width="24" height="24" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.sizeButton} ${
                        newCharSize === 3 ? styles.active : ""
                      }`}
                      onClick={() => setNewCharSize(3)}
                      title="Huge (3x3)"
                    >
                      <img src={images.size3} alt="Size 3" width="24" height="24" />
                    </button>
                  </div>
                  <button type="submit" className={styles.addButton}>
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCharacter(false)}
                    className={styles.closeButton}
                    title="Cancel"
                  >
                    ×
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={styles.hiddenFileInput}
                  ref={fileInputRef}
                />
              </div>
            </form>
          </div>
        </div>
      )}
      </>
    );
};

export default MapTool;
