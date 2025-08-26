const CANVAS_HEIGHT = 0.3;
const SNOWFLAKE_AMOUNT = 50;
const SNOWFLAKE_SIZE = { min: 1, max: 4 };
const SNOWFLAKE_SPEED = { min: 0.8, max: 1.2 };
const CANVAS_SELECTOR = ".snowoverlay";

let animationFrame;
let snowflakes = [];

// Utilidades
const setupCanvas = () => {
  const canvas = document.querySelector(CANVAS_SELECTOR);
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const setCanvasSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * CANVAS_HEIGHT;
  };
  setCanvasSize();
  window.addEventListener("resize", setCanvasSize);

  return { canvas, ctx };
};

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const createSnowflakes = (amount, width, height) => {
  const flakes = [];
  for (let i = 0; i < amount; i++) {
    flakes.push({
      x: randomBetween(0, width),
      y: randomBetween(0, height),
      radius: randomBetween(SNOWFLAKE_SIZE.min, SNOWFLAKE_SIZE.max),
      speed: randomBetween(SNOWFLAKE_SPEED.min, SNOWFLAKE_SPEED.max),
      drift: randomBetween(-0.5, 0.5)
    });
  }
  return flakes;
};

const animateSnow = ({ canvas, ctx }) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  snowflakes.forEach(flake => {
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.closePath();

    flake.y += flake.speed;
    flake.x += flake.drift;

    if (flake.y > canvas.height) {
      flake.y = -flake.radius;
      flake.x = randomBetween(0, canvas.width);
    }
    if (flake.x > canvas.width) flake.x = 0;
    if (flake.x < 0) flake.x = canvas.width;
  });

  animationFrame = requestAnimationFrame(() => animateSnow({ canvas, ctx }));
};

window.addEventListener("DOMContentLoaded", () => {
  const setup = setupCanvas();
  if (!setup) return;
  snowflakes = createSnowflakes(
    SNOWFLAKE_AMOUNT,
    setup.canvas.width,
    setup.canvas.height
  );
  animateSnow(setup);
});