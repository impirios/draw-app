// =============================================================================
// Configuration
// =============================================================================

const GRID_CELL_SIZE = 3; // Tailwind width/height units for each pixel cell
const GRID_ROWS = 64; // Number of rows in the drawing grid
const GRID_COLUMN_WIDTH_PX = 12; // Approximate pixel width per column (for calculating column count)
const PALETTE_SWATCH_SIZE = 8; // Tailwind width/height units for palette color swatches
const COLOR_VARIANT_COUNT = 7; // Number of shade variants (100–700) to show per color

const PALETTE_COLORS = ["black", "white", "red", "blue", "green", "orange", "pink"];
const COLORS_WITHOUT_VARIANTS = ["black", "white"];

// =============================================================================
// State
// =============================================================================

let selectedColor = "black";
let isDrawing = false;

// =============================================================================
// Utility
// =============================================================================

function getRandomInteger(max) {
  return Math.floor(Math.random() * max);
}

function setBackgroundClass(element, bgClass) {
  const filteredClasses = Array.from(element.classList).filter(
    (cls) => !cls.startsWith("bg-"),
  );
  element.className = [...filteredClasses, bgClass].join(" ");
}

/** Paint a single grid cell with the currently selected color. */
function paintCell(cell) {
  const grid = document.getElementById("drawing-grid");
  if (!cell || !grid.contains(cell)) return;
  cell.className = `bg-${selectedColor} w-${GRID_CELL_SIZE} h-${GRID_CELL_SIZE}`;
}

/**
 * Given a touch event, find the grid cell element under the finger.
 * Uses document.elementFromPoint with the touch coordinates.
 */
function getCellFromTouch(e) {
  const touch = e.touches[0];
  return document.elementFromPoint(touch.clientX, touch.clientY);
}

// =============================================================================
// Screenshot / Capture
// =============================================================================

function initCaptureButton() {
  document.getElementById("capture-button").addEventListener("click", () => {
    const canvas = document.getElementById("drawing-grid");

    html2canvas(canvas).then((renderedCanvas) => {
      renderedCanvas.toBlob((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `your-art-${getRandomInteger(1000)}.png`;
        link.click();
      }, "image/png");
    });
  });
}

// =============================================================================
// Palette
// =============================================================================

function createPaletteSwatch(color, { size, isParentColor = false }) {
  const hasVariants = !COLORS_WITHOUT_VARIANTS.includes(color);
  const bgSuffix = isParentColor && hasVariants ? "-400" : "";

  const swatch = document.createElement("div");
  swatch.className = `bg-${color}${bgSuffix} w-${size} h-${size} border border-black cursor-pointer`;

  swatch.addEventListener("click", () => {
    // Parent colors with variants default to the -400 shade (e.g., "red" → "red-400")
    selectedColor = isParentColor && hasVariants ? `${color}-400` : color;
    setBackgroundClass(document.getElementById("palette-preview"), `bg-${selectedColor}`);

    if (isParentColor && hasVariants) {
      renderVariantStrip(color);
    }
  });

  return swatch;
}

function renderVariantStrip(baseColor) {
  const container = document.getElementById("palette-variants");
  container.innerHTML = "";
  container.className = "flex flex-wrap justify-center";

  for (let i = 1; i <= COLOR_VARIANT_COUNT; i++) {
    const shade = `${baseColor}-${i * 100}`;
    const swatch = createPaletteSwatch(shade, { size: PALETTE_SWATCH_SIZE });
    container.appendChild(swatch);
  }
}

function initPalette() {
  const paletteContainer = document.getElementById("palette");
  paletteContainer.className = "flex flex-wrap";

  for (const color of PALETTE_COLORS) {
    const swatch = createPaletteSwatch(color, {
      size: PALETTE_SWATCH_SIZE,
      isParentColor: true,
    });
    paletteContainer.appendChild(swatch);
  }
}

// =============================================================================
// Drawing Grid
// =============================================================================

function createGridCell(color, id) {
  const cell = document.createElement("div");
  cell.className = `bg-${color} w-${GRID_CELL_SIZE} h-${GRID_CELL_SIZE}`;
  cell.id = id;

  // Desktop: paint on mouse hover while button is held
  cell.addEventListener("mouseenter", () => {
    if (isDrawing) paintCell(cell);
  });

  return cell;
}

function renderGrid(color1 = "white", color2 = "white") {
  const grid = document.getElementById("drawing-grid");
  grid.innerHTML = "";
  grid.className = "flex";

  // --- Mouse events (desktop) ---
  // mousedown starts on the grid, but mouseup/mouseleave listen globally
  // so releasing or leaving the window always stops drawing.
  grid.addEventListener("mousedown", () => { isDrawing = true; });
  document.addEventListener("mouseup", () => { isDrawing = false; });

  // --- Touch events (mobile) ---
  grid.addEventListener("touchstart", (e) => {
    e.preventDefault(); // prevent scrolling while drawing
    isDrawing = true;
    const cell = getCellFromTouch(e);
    if (cell) paintCell(cell);
  }, { passive: false });

  grid.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const cell = getCellFromTouch(e);
    if (cell) paintCell(cell);
  }, { passive: false });

  document.addEventListener("touchend", () => { isDrawing = false; });
  document.addEventListener("touchcancel", () => { isDrawing = false; });

  // --- Build the grid ---
  const columnCount = Math.floor(document.documentElement.clientWidth / GRID_COLUMN_WIDTH_PX) - 1;

  for (let col = 0; col < columnCount; col++) {
    const column = document.createElement("div");
    column.className = "flex flex-col";

    for (let row = 0; row < GRID_ROWS; row++) {
      const color = (col + row) % 2 === 0 ? color1 : color2;
      column.appendChild(createGridCell(color, `${col}-${row}`));
    }

    grid.appendChild(column);
  }
}

// =============================================================================
// Initialization
// =============================================================================

document.addEventListener("DOMContentLoaded", () => {
  initCaptureButton();
  initPalette();
  renderGrid();
});
