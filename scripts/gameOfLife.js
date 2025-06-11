// Export the main function for modular import
export function startGameOfLife(canvas, options = {}) {
    const ctx = canvas.getContext('2d');
    const cellSize = options.cellSize || 10;
    let cols, rows;
    let grid;
  
    // Drag state for mouse/touch interaction
    let isDragging = false;
    let dragAction = null;
    let touchedCells = new Set();
  
    // Bright random HSL color for live cells
    function getRandomColor() {
      const hue = Math.floor(Math.random() * 360);
      return `hsl(${hue}, 100%, 70%)`;
    }
  
    // Resize canvas and initialize a new grid
    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cols = Math.floor(canvas.width / cellSize);
      rows = Math.floor(canvas.height / cellSize);
      grid = createGrid();
    }
  
    // Generate a 2D grid of cells with random live/dead values and colors
    function createGrid() {
      return new Array(cols).fill(null).map(() =>
        new Array(rows).fill(null).map(() => ({
          alive: Math.random() < 0.35 ? 1 : 0, // Probability cell begins alive or dead
          color: getRandomColor(),
          fade: 0, // used for trailing glow effect
        }))
      );
    }
  
    // Draw the current grid with glowing live cells and faded dead cells
    function drawGrid() {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          const cell = grid[x][y];
  
          if (cell.alive) {
            ctx.fillStyle = cell.color;
            ctx.shadowColor = cell.color;
            ctx.shadowBlur = 8;
  
            ctx.beginPath();
            ctx.arc(
              x * cellSize + cellSize / 2,
              y * cellSize + cellSize / 2,
              cellSize / 2,
              0,
              2 * Math.PI
            );
            ctx.fill();
          } else if (cell.fade > 0) {
            // Draw fading glow for recently dead cells
            const alpha = cell.fade / 10;
            ctx.fillStyle = cell.color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 6;
  
            ctx.beginPath();
            ctx.arc(
              x * cellSize + cellSize / 2,
              y * cellSize + cellSize / 2,
              cellSize / 2,
              0,
              2 * Math.PI
            );
            ctx.fill();
  
            cell.fade -= 1;
          }
        }
      }
  
      ctx.shadowBlur = 0; // Clear shadow for next frame
    }
  
    // Apply Conway's Game of Life rules to update the grid
    function updateGrid() {
      const next = grid.map(arr => arr.map(cell => ({ ...cell }))); // deep clone
  
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          const neighbors = countNeighbors(x, y);
          const cell = grid[x][y];
  
          if (cell.alive === 1) {
            if (neighbors < 2 || neighbors > 3) {
              next[x][y].alive = 0;
              next[x][y].fade = 10;
            }
          } else {
            if (neighbors === 3) {
              next[x][y].alive = 1;
              next[x][y].color = getRandomColor();
              next[x][y].fade = 0;
            }
          }
        }
      }
  
      grid = next;
    }
  
    // Count live neighbors (with edge wrapping)
    function countNeighbors(x, y) {
      let sum = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const col = (x + i + cols) % cols;
          const row = (y + j + rows) % rows;
          sum += grid[col][row].alive;
        }
      }
      return sum;
    }
  
    // Toggle a cell on click or drag
    function toggleCell(event) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
  
      const col = Math.floor((x / canvas.width) * cols);
      const row = Math.floor((y / canvas.height) * rows);
      const key = `${col},${row}`;
  
      if (col >= 0 && col < cols && row >= 0 && row < rows && !touchedCells.has(key)) {
        touchedCells.add(key);
  
        if (dragAction === null) {
          dragAction = grid[col][row].alive ? 'remove' : 'add';
        }
  
        if (dragAction === 'add') {
          grid[col][row].alive = 1;
          grid[col][row].color = getRandomColor();
          grid[col][row].fade = 0;
        } else {
          grid[col][row].alive = 0;
          grid[col][row].fade = 10;
        }
      }
    }
  
    // Animation timing control for FPS
    let lastUpdateTime = 0;
    const updateInterval = 50; // Lower number => higher FPS
  
    function gameLoop(timestamp) {
      if (!lastUpdateTime) lastUpdateTime = timestamp;
      const elapsed = timestamp - lastUpdateTime;
  
      if (elapsed >= updateInterval) {
        updateGrid();             // Rate-limited
        lastUpdateTime = timestamp;
      }
  
      drawGrid();
      requestAnimationFrame(gameLoop);
    }
  
    // Mouse input handlers
    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      touchedCells.clear();
      toggleCell(e);
    });
  
    canvas.addEventListener('mousemove', (e) => {
      if (isDragging) toggleCell(e);
    });
  
    canvas.addEventListener('mouseup', () => {
      isDragging = false;
      dragAction = null;
      touchedCells.clear();
    });
  
    // Touch input handlers for mobile interaction
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      touchedCells.clear();
      toggleCell(e.touches[0]);
    });
  
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (isDragging) toggleCell(e.touches[0]);
    });
  
    canvas.addEventListener('touchend', () => {
      isDragging = false;
      dragAction = null;
      touchedCells.clear();
    });
  
    // Initialize and launch simulation
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    requestAnimationFrame(gameLoop);
  }
  