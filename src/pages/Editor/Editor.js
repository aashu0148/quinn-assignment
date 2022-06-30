import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { colors, corners, shapeTypes } from "../../constants.js";

import styles from "./Editor.module.css";

const shapes = [];
let context = "";
let canvasHeight = "";
let canvasWidth = "";
let offsetX = "";
let offsetY = "";
let [draggingStartX, draggingStartY] = [-1, -1];
let editingMode = false;
const scale = 4;
function Editor(props) {
  const navigate = useNavigate();

  const canvasRef = useRef();
  const canvasContainerRef = useRef();
  const extraInputRef = useRef();

  const [selectedElement, setSelectedElement] = useState("");
  const [selectedShape, setSelectedShape] = useState("");

  const handleSelectedElementChange = (type) => {
    setSelectedElement({
      type,
      text: type,
      fontSize: 18,
      height: 40,
      width: 80,
      color: colors.black,
      backgroundColor: colors.white,
      borderColor: colors.black,
      isSelected: false,
      isDragging: false,
      isResizing: false,
      resizingCorner: "",
    });
  };

  function handleShapeFieldChange(field, value) {
    if (
      !field ||
      typeof selectedShape !== "object" ||
      Object.keys(selectedShape).length < 1 ||
      selectedShape.index < 0
    )
      return;

    shapes[selectedShape.index][field] = value;
    setSelectedShape({ ...selectedShape, [field]: value });
    draw();
  }

  const handleMouseEnterOnCanvasContainer = () => {
    if (
      typeof selectedElement === "object" &&
      Object.keys(selectedElement).length > 0
    ) {
      const shape = {
        ...selectedElement,
        x: 0,
        y: 0,
        isDragging: true,
        isSelected: true,
      };
      shapes.forEach((item) => {
        item.isSelected = false;
        item.isDragging = false;
      });
      shapes.push(shape);
      setSelectedShape({ ...shape, index: shapes.length - 1 });
      draw();
      setSelectedElement("");
    }
  };

  const handleMouseLeaveOnCanvasContainer = () => {
    const draggingShapeIndex = shapes.findIndex((item) => item.isDragging);
    const resizingShapeIndex = shapes.findIndex((item) => item.isResizing);

    if (draggingShapeIndex > -1) {
      shapes.splice(draggingShapeIndex, 1);
      setSelectedShape("");
    }
    if (resizingShapeIndex > -1) {
      shapes[resizingShapeIndex].isResizing = false;
      shapes[resizingShapeIndex].isSelected = false;
      setSelectedShape("");
    }

    draw();
  };

  function initCanvas(canvas) {
    context = canvas.getContext("2d");
    canvasHeight = canvas.height;
    canvasWidth = canvas.width;
    offsetX = canvas.getBoundingClientRect().left;
    offsetY = canvas.getBoundingClientRect().top;

    context.scale(4, 4);
    draw();
  }

  function isShapeClicked(shape, clientX, clientY) {
    if (
      clientX > shape.x &&
      clientX <= shape.x + shape.width &&
      clientY > shape.y &&
      clientY <= shape.y + shape.height
    )
      return true;
    return false;
  }

  function getClickedCorner(shape, clientX, clientY) {
    if (
      clientX >= shape.x - 1 &&
      clientY >= shape.y - 1 &&
      clientX <= shape.x + 5 &&
      clientY <= shape.y + 5
    )
      return corners.topLeft;
    else if (
      clientX >= shape.x + shape.width - 5 &&
      clientY >= shape.y - 1 &&
      clientX <= shape.x + shape.width + 1 &&
      clientY <= shape.y + 5
    )
      return corners.topRight;
    else if (
      clientX >= shape.x - 1 &&
      clientY >= shape.y + shape.height - 5 &&
      clientX <= shape.x + 5 &&
      clientY <= shape.y + shape.height + 1
    )
      return corners.bottomLeft;
    else if (
      clientX >= shape.x + shape.width - 5 &&
      clientY >= shape.y + shape.height - 5 &&
      clientX <= shape.x + shape.width + 1 &&
      clientY <= shape.y + shape.height + 1
    )
      return corners.bottomRight;

    return undefined;
  }

  function hideExtraInput(doNotBlur = false) {
    editingMode = false;
    extraInputRef.current.style.zIndex = -10;
    extraInputRef.current.value = "";
    if (!doNotBlur) extraInputRef.current.blur();
    extraInputRef.current.style.top = "2px";
    extraInputRef.current.style.left = "2px";
    extraInputRef.current.style.width = "5px";
    extraInputRef.current.style.height = "5px";
  }

  function handleCanvasMouseDown(event) {
    event.preventDefault();

    const clientX = parseInt(event.pageX - offsetX);
    const clientY = parseInt(event.pageY - offsetY);

    let newlySelectedShapeIndex = -1;
    for (let i = shapes.length - 1; i >= 0; --i) {
      const shape = shapes[i];
      const clickedCorner = getClickedCorner(shape, clientX, clientY);
      if (shape.isSelected && clickedCorner) {
        shape.isResizing = true;
        shape.isDragging = false;
        shape.resizingCorner = clickedCorner;
        draggingStartX = clientX;
        draggingStartY = clientY;
        if (editingMode) hideExtraInput();
        break;
      } else if (
        isShapeClicked(shape, clientX, clientY) &&
        newlySelectedShapeIndex < 0
      ) {
        shape.isSelected = true;
        shape.isDragging = true;
        newlySelectedShapeIndex = i;
        draggingStartX = clientX;
        draggingStartY = clientY;
      } else {
        shape.isSelected = false;

        if (editingMode) hideExtraInput();
      }
    }

    const isAnyShapeSelected = shapes.some((item) => item.isSelected);
    if (newlySelectedShapeIndex >= 0) {
      // to make selected share come to top while moving
      const shape = shapes[newlySelectedShapeIndex];
      shapes.splice(newlySelectedShapeIndex, 1);
      shapes.push(shape);
      setSelectedShape({ ...shape, index: shapes.length - 1 });
    } else if (!isAnyShapeSelected) setSelectedShape("");

    draw();
  }

  function handleShapeResize(shape, dx, dy) {
    let [newX, newY] = [shape.x, shape.y];
    let [newWidth, newHeight] = [shape.width, shape.height];
    if (shape.resizingCorner === corners.topLeft) {
      newX += dx;
      newY += dy;
      newWidth = Math.abs(newWidth - dx) || 2;
      newHeight = Math.abs(newHeight - dy) || 2;
    } else if (shape.resizingCorner === corners.topRight) {
      newWidth = Math.abs(newWidth + dx) || 2;
      newHeight = Math.abs(newHeight - dy) || 2;
      newY += dy;
    } else if (shape.resizingCorner === corners.bottomLeft) {
      newX += dx;
      newWidth = Math.abs(newWidth - dx) || 2;
      newHeight = Math.abs(newHeight + dy) || 2;
    } else if (shape.resizingCorner === corners.bottomRight) {
      newWidth = Math.abs(newWidth + dx) || 2;
      newHeight = Math.abs(newHeight + dy) || 2;
    }

    if (newWidth < 60) shape.width = 60;
    else {
      shape.x = newX;
      shape.width = newWidth;
    }
    if (newHeight < 30) shape.height = 30;
    else {
      shape.y = newY;
      shape.height = newHeight;
    }
  }

  function handleCanvasMouseMove(event) {
    event.preventDefault();

    const clientX = parseInt(event.pageX - offsetX);
    const clientY = parseInt(event.pageY - offsetY);
    const selectedDraggingShape = shapes.find(
      (item) => item.isSelected && item.isDragging
    );
    const selectedResizingShape = shapes.find(
      (item) => item.isSelected && item.isResizing
    );
    if (!selectedDraggingShape && !selectedResizingShape) return;

    const dx = clientX - draggingStartX;
    const dy = clientY - draggingStartY;

    if (selectedDraggingShape) {
      const newX = selectedDraggingShape.x + dx;
      const newY = selectedDraggingShape.y + dy;
      if (newX > 0) selectedDraggingShape.x = newX;
      else selectedDraggingShape.x = 0;
      if (newY > 0) selectedDraggingShape.y = newY;
      else selectedDraggingShape.y = 0;
    } else if (selectedResizingShape) {
      handleShapeResize(selectedResizingShape, dx, dy);
    }

    draggingStartX = clientX;
    draggingStartY = clientY;
    draw();
  }

  function handleCanvasDoubleClick(event) {
    event.preventDefault();

    if (
      typeof selectedShape !== "object" ||
      Object.keys(selectedShape).length < 1
    )
      return;

    editingMode = true;
    extraInputRef.current.value = selectedShape.text;
    extraInputRef.current.focus();
    extraInputRef.current.style.zIndex = 100;
    extraInputRef.current.style.color = selectedShape.color;
    extraInputRef.current.style.fontSize = selectedShape.fontSize + "px";
    extraInputRef.current.style.lineHeight = selectedShape.fontSize + "px";
    extraInputRef.current.style.top = selectedShape.y + offsetY - 1 + "px";
    extraInputRef.current.style.left = selectedShape.x + offsetX - 1 + "px";
    extraInputRef.current.style.width = selectedShape.width + 3 + "px";
    extraInputRef.current.style.height =
      canvasHeight - selectedShape.y + 3 + "px";
    draw();
  }

  function handleCanvasMouseUp(event) {
    event.preventDefault();

    draggingStartX = -1;
    draggingStartY = -1;
    shapes.forEach((shape) => {
      shape.isDragging = false;
      shape.isResizing = false;
      shape.resizingCorner = "";
    });

    draw();
  }

  function drawRect(
    {
      x,
      y,
      width,
      height,
      color,
      backgroundColor,
      text,
      borderColor,
      fontSize = 0,
    },
    { isSelected = false, addText = false } = {}
  ) {
    context.beginPath();
    context.fillStyle = isSelected ? colors.highlight : borderColor;
    context.rect(x, y, width, height);
    context.fill();
    context.closePath();

    context.beginPath();
    context.fillStyle = backgroundColor || colors.white;
    context.rect(x + 1, y + 1, width - 2, height - 2);
    context.fill();
    context.closePath();

    context.beginPath();
    context.textAlign = "center";
    context.textBaseline = "middle";
    if (addText) {
      context.fillStyle = color || colors.black;
      context.font = `normal ${fontSize}px sans-serif`;
      const textWidth = context.measureText(text).width;
      const textWidthRatio = textWidth / width;

      if (textWidthRatio < 1)
        context.fillText(text, x + width / 2, y + fontSize);
      else {
        const charPerString = parseInt(text.length / textWidthRatio);
        for (
          let i = 0, lineCounter = 1;
          i < text.length;
          i += charPerString, ++lineCounter
        ) {
          context.fillText(
            text.slice(i, i + charPerString),
            x + width / 2,
            y + fontSize * lineCounter
          );
        }
      }
    }
    context.closePath();

    if (isSelected) {
      drawRect({
        x: x - 1,
        y: y - 1,
        width: 6,
        height: 6,
        backgroundColor: colors.white,
        borderColor: colors.highlight,
      });
      drawRect({
        x: x + width - 5,
        y: y - 1,
        width: 6,
        height: 6,
        backgroundColor: colors.white,
        borderColor: colors.highlight,
      });
      drawRect({
        x: x + width - 5,
        y: y + height - 5,
        width: 6,
        height: 6,
        backgroundColor: colors.white,
        borderColor: colors.highlight,
      });
      drawRect({
        x: x - 1,
        y: y + height - 5,
        width: 6,
        height: 6,
        backgroundColor: colors.white,
        borderColor: colors.highlight,
      });
    }
  }

  function draw(drawOnWhite = false) {
    if (drawOnWhite) {
      context.beginPath();
      context.fillStyle = colors.white;
      context.rect(0, 0, canvasWidth, canvasHeight);
      context.fill();
      context.closePath();
    } else context.clearRect(0, 0, canvasWidth, canvasHeight);

    shapes.forEach((shape) => {
      drawRect(shape, {
        isSelected: shape.isSelected,
        addText: shape.isSelected && editingMode ? false : true,
      });
    });
  }

  function handleFinalize() {
    shapes.forEach((item) => (item.isSelected = false));
    draw(true);
    const imageSrc = canvasRef.current.toDataURL("image/jpeg");
    props.onFinalize(imageSrc);
    navigate("/final");
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasContainer = canvasContainerRef.current;

    const width = canvasContainer.clientWidth;
    const height = 500;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    window.addEventListener("mouseup", () => {
      setSelectedElement("");
    });
    canvas.addEventListener("mouseup", handleCanvasMouseUp);
    canvas.addEventListener("mousedown", handleCanvasMouseDown);
    canvas.addEventListener("mousemove", handleCanvasMouseMove);

    initCanvas(canvas);
  }, []);

  return (
    <div className={styles.container}>
      <textarea
        ref={extraInputRef}
        className={styles.extraInput}
        style={{
          paddingTop: "9px",
          left: "0",
          height: "5px",
          width: "5px",
        }}
        onKeyDown={(event) =>
          event.key == "Enter" ? event.preventDefault() : ""
        }
        onChange={(event) => handleShapeFieldChange("text", event.target.value)}
        onBlur={(event) => {
          editingMode = false;
          event.target.style.zIndex = -10;
          event.target.value = "";
          event.target.style.top = "2px";
          event.target.style.left = "2px";
          event.target.style.width = "5px";
          event.target.style.height = "5px";
          draw();
        }}
      />
      <div className={styles.leftSidebar}>
        <p className={styles.heading}>Elements</p>
        <div className={styles.list}>
          <p
            className={styles.item}
            onMouseDown={() => handleSelectedElementChange(shapeTypes.button)}
          >
            Button
          </p>
          <p
            className={styles.item}
            onMouseDown={() => handleSelectedElementChange(shapeTypes.text)}
          >
            Text
          </p>
        </div>
        <span
          style={{
            fontSize: "14px",
            padding: "0 10px",
            textAlign: "center",
          }}
        >
          (Drag the elements on the canvas)
        </span>
      </div>
      <div className={styles.main}>
        <div
          className={styles.canvasContainer}
          ref={canvasContainerRef}
          onMouseEnter={handleMouseEnterOnCanvasContainer}
          onMouseLeave={handleMouseLeaveOnCanvasContainer}
        >
          <canvas
            ref={canvasRef}
            style={{ border: "1px solid black" }}
            onDoubleClick={handleCanvasDoubleClick}
          />
        </div>

        {shapes.length > 0 && (
          <button onClick={handleFinalize}>Finalize</button>
        )}
      </div>
      <div className={styles.rightSidebar}>
        <p className={styles.heading}>Inspect</p>
        {typeof selectedShape === "object" &&
        Object.keys(selectedShape).length > 0 ? (
          <div className={styles.list}>
            <div className={styles.item}>
              <p className={styles.title}>Text</p>
              <input
                value={selectedShape?.text}
                placeholder="Enter text"
                onChange={(event) =>
                  handleShapeFieldChange("text", event.target.value)
                }
              />
            </div>
            <div className={styles.item}>
              <p className={styles.title}>Text size</p>
              <input
                value={selectedShape?.fontSize}
                placeholder="Enter text"
                type="number"
                max={60}
                onChange={(event) => {
                  const value = parseInt(event.target.value) || 0;
                  if (value <= 80)
                    handleShapeFieldChange("fontSize", value || "");
                }}
              />
            </div>
            <div className={styles.item}>
              <p className={styles.title}>Background color</p>
              <input
                type="color"
                value={selectedShape?.backgroundColor}
                onChange={(event) =>
                  handleShapeFieldChange("backgroundColor", event.target.value)
                }
              />
            </div>
            <div className={styles.item}>
              <p className={styles.title}>Color</p>
              <input
                type="color"
                value={selectedShape?.color}
                onChange={(event) =>
                  handleShapeFieldChange("color", event.target.value)
                }
              />
            </div>
            <div className={styles.item}>
              <p className={styles.title}>Border color</p>
              <input
                type="color"
                value={selectedShape?.borderColor}
                onChange={(event) =>
                  handleShapeFieldChange("borderColor", event.target.value)
                }
              />
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

export default Editor;
