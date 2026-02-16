export const MAP_WIDTH = 3000;
export const MAP_HEIGHT = 3000;

export const drawStroke = (ctx, stroke) => {
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

export const drawGrid = (ctx) => {
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
