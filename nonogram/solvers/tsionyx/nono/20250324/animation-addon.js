// animation-addon.js
// This addon injects a speed slider and overrides the renderPuzzleCells function
// to animate drawing the solved puzzle cell-by-cell.

(function() {
  // Create a container for the animation controls.
  const controlsDiv = document.createElement('div');
  controlsDiv.id = "animationControls";
  controlsDiv.style.margin = "20px";
  controlsDiv.innerHTML = `
    <label for="speedSlider">Animation Delay (ms per cell): </label>
    <input type="range" id="speedSlider" min="10" max="1000" value="100">
    <span id="speedDisplay">100</span> ms
  `;

  // Insert the controls after the Solve! button.
  const solveButton = document.getElementById("solve");
  if (solveButton) {
    solveButton.parentNode.insertBefore(controlsDiv, solveButton.nextSibling);
  } else {
    // Fallback: append to body if solve button is not found.
    document.body.appendChild(controlsDiv);
  }

  // Update the displayed speed when the slider is moved.
  const speedSlider = document.getElementById('speedSlider');
  const speedDisplay = document.getElementById('speedDisplay');
  speedSlider.addEventListener('input', function(e) {
    speedDisplay.textContent = e.target.value;
  });

  // Ensure the original render function exists.
  // The original function is defined in index.js.
  if (typeof renderPuzzleCells !== 'function') {
    console.warn("renderPuzzleCells function not found. Animation addon disabled.");
    return;
  }

  // Store a reference to the original function if needed later.
  const originalRenderPuzzleCells = renderPuzzleCells;

  // Override renderPuzzleCells with an animated version.
  window.renderPuzzleCells = function(desc) {
    const speed = parseInt(speedSlider.value);
    const CELL_SIZE = window.CELL_SIZE || 20; // Default to 20 if not set globally.
    const height = desc.fullHeight;
    const width = desc.fullWidth;
    const rowsNumber = desc.rowsNumber;
    const colsNumber = desc.colsNumber;
    const rowsSideSize = width - colsNumber;
    const colsHeaderSize = height - rowsNumber;
    const cells = desc.cellsAsColors;
    const whiteColorCode = desc.whiteColorCode;

    // Calculate sizes based on CELL_SIZE.
    const gap = 1;
    const whiteDotSize = CELL_SIZE / 10;
    const whiteDotOffset = (CELL_SIZE - whiteDotSize) / 2;

    // Get the canvas context.
    const canvas = document.querySelector('#nonoCanvas');
    const ctx = canvas.getContext('2d');

    // Clear the canvas and redraw the grid.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (typeof drawGrid === 'function') {
      drawGrid(ctx, rowsSideSize, colsHeaderSize, width, height);
    }

    let i = 0;
    const totalCells = rowsNumber * colsNumber;

    // Function to animate drawing one cell at a time.
    function drawNextCell() {
      if (i >= totalCells) {
        ctx.stroke();
        return;
      }
      const row = Math.floor(i / colsNumber);
      const col = i % colsNumber;
      const y = colsHeaderSize + row;
      const x = rowsSideSize + col;
      const intColor = cells[i];

      if (intColor >= 0) {
        const blockColor = '#' + intColor.toString(16).padStart(6, '0');
        ctx.fillStyle = blockColor;
        ctx.fillRect(x * (CELL_SIZE + gap) + gap, y * (CELL_SIZE + gap) + gap, CELL_SIZE, CELL_SIZE);
      } else if (intColor === whiteColorCode) {
        ctx.fillStyle = 'black';
        ctx.fillRect(x * (CELL_SIZE + gap) + gap + whiteDotOffset,
                     y * (CELL_SIZE + gap) + gap + whiteDotOffset,
                     whiteDotSize, whiteDotSize);
      }
      i++;
      setTimeout(drawNextCell, speed);
    }
    drawNextCell();
  };

  console.log("Animation addon loaded. Animated rendering is now active.");
})();
