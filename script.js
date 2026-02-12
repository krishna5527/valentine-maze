const mazeContainer = document.getElementById("maze-container");

const size = 21;
let maze = generateMaze(size);

let playerPosition = { x: 0, y: 0 };
let previousPosition = { x: 0, y: 0 };

let canPlay = true;
let gameWon = false;
let hasStartedMoving = false;
let currentDirection = "right";
let isReacting = false;
let slowMode = false;

/* ================= AUDIO ================= */
const walkAudio = new Audio("bubuwalkingaudio.mp3");
walkAudio.loop = true;
walkAudio.volume = 0.6;

const meetHugAudio = new Audio("meethug.mp3");
meetHugAudio.loop = false;
meetHugAudio.volume = 0.8;


/* ================= INIT ================= */
renderMaze();
document.addEventListener("keydown", movePlayer);

/* ================= MAZE ================= */
function generateMaze(size) {
  const maze = Array.from({ length: size }, () => Array(size).fill(15));
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const walls = [];

  function addWalls(x, y) {
    if (x > 0 && !visited[y][x - 1]) walls.push({ x, y, d: "L" });
    if (x < size - 1 && !visited[y][x + 1]) walls.push({ x, y, d: "R" });
    if (y > 0 && !visited[y - 1][x]) walls.push({ x, y, d: "U" });
    if (y < size - 1 && !visited[y + 1][x]) walls.push({ x, y, d: "D" });
  }

  let x = 0, y = 0;
  visited[y][x] = true;
  addWalls(x, y);

  while (walls.length) {
    const { x, y, d } = walls.splice(Math.random() * walls.length | 0, 1)[0];
    let nx = x, ny = y;

    if (d === "L") nx--;
    if (d === "R") nx++;
    if (d === "U") ny--;
    if (d === "D") ny++;

    if (nx >= 0 && ny >= 0 && nx < size && ny < size && !visited[ny][nx]) {
      visited[ny][nx] = true;

      if (d === "L") { maze[y][x] &= ~1; maze[ny][nx] &= ~4; }
      if (d === "R") { maze[y][x] &= ~4; maze[ny][nx] &= ~1; }
      if (d === "U") { maze[y][x] &= ~2; maze[ny][nx] &= ~8; }
      if (d === "D") { maze[y][x] &= ~8; maze[ny][nx] &= ~2; }

      addWalls(nx, ny);
    }
  }

  return maze;
}

/* ================= RENDER ================= */
function renderMaze() {
  mazeContainer.style.gridTemplateColumns = `repeat(${size}, 28px)`;
  mazeContainer.innerHTML = "";

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = x;
      cell.dataset.y = y;

      applyWalls(cell, maze[y][x]);

      if (x === 0 && y === 0) {
        cell.innerHTML += `<img src="bubu.gif" class="bubu">`;
      }

      if (x === size - 1 && y === size - 1) {
        cell.innerHTML += `<img src="dudu1.gif" class="dudu" id="dudu">`;
      }

      mazeContainer.appendChild(cell);
	  
	  const message = document.getElementById("game-message");
const mazeRect = mazeContainer.getBoundingClientRect();

message.style.top = mazeRect.top + mazeRect.height / 2 + "px";
message.style.left = mazeRect.left - message.offsetWidth - 20 + "px";
message.style.transform = "translateY(-50%)";
    }
  }
}

function applyWalls(cell, v) {
  if (v & 1) cell.classList.add("left");
  if (v & 2) cell.classList.add("top");
  if (v & 4) cell.classList.add("right");
  if (v & 8) cell.classList.add("bottom");
}

/* ================= MOVEMENT ================= */
function movePlayer(e) {
  if (!canPlay) return;

  const dirs = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0]
  };

  if (!dirs[e.key]) return;

  const [dx, dy] = dirs[e.key];
  const nx = playerPosition.x + dx;
  const ny = playerPosition.y + dy;

  if (
    nx >= 0 && ny >= 0 && nx < size && ny < size &&
    canMove(maze[playerPosition.y][playerPosition.x], dx, dy)
  ) {

    if (!hasStartedMoving) {
      hasStartedMoving = true;
      walkAudio.play();
    }

    if (e.key === "ArrowLeft") currentDirection = "left";
    if (e.key === "ArrowRight") currentDirection = "right";

    previousPosition = { ...playerPosition };
    playerPosition = { x: nx, y: ny };

    updatePlayer();
    checkEffects();
  }
}

function canMove(val, dx, dy) {
  if (dx === 1 && !(val & 4)) return true;
  if (dx === -1 && !(val & 1)) return true;
  if (dy === 1 && !(val & 8)) return true;
  if (dy === -1 && !(val & 2)) return true;
  return false;
}

/* ================= PLAYER ================= */
function updatePlayer() {
  const prevCell = document.querySelector(
    `.cell[data-x="${previousPosition.x}"][data-y="${previousPosition.y}"]`
  );
  if (prevCell) prevCell.innerHTML = "";

  const cell = document.querySelector(
    `.cell[data-x="${playerPosition.x}"][data-y="${playerPosition.y}"]`
  );

  const bubu = document.createElement("img");
  bubu.src = "bubu.gif";
  bubu.className = "bubu";

  if (currentDirection === "left") {
    bubu.style.transform = "translate(-50%, -50%) scaleX(-1)";
  } else {
    bubu.style.transform = "translate(-50%, -50%) scaleX(1)";
  }

  cell.appendChild(bubu);

  if (
    playerPosition.x === size - 1 &&
    playerPosition.y === size - 1 &&
    !gameWon
  ) {
    gameWon = true;
    canPlay = false;
    walkAudio.pause();
    playMeetThenHug();
  }
}

/* ================= EFFECTS ================= */
function checkEffects() {
  const dx = Math.abs(playerPosition.x - (size - 1));
  const dy = Math.abs(playerPosition.y - (size - 1));
  const distance = dx + dy;

  const dudu = document.getElementById("dudu");

  if (distance <= 5 && !isReacting) {
    isReacting = true;
    dudu.src = "dudureacts.gif";
  }

  if (distance > 5 && isReacting) {
    isReacting = false;
    dudu.src = "dudu1.gif";
  }

  if (distance <= 2) spawnHearts();
}

/* ================= MEET → ZOOM HUG ================= */
function playMeetThenHug() {
  const duduCell = document.querySelector(
    `.cell[data-x="${size - 1}"][data-y="${size - 1}"]`
  );

  duduCell.innerHTML = `<img src="meet.gif" class="dudu" id="meetGif">`;

  const meetGif = document.getElementById("meetGif");

  // 🔊 Play meet-hug audio
  meetHugAudio.currentTime = 0;
  meetHugAudio.play();

  setTimeout(() => {

    const rect = meetGif.getBoundingClientRect();
    meetGif.remove();

    /* === DARK OVERLAY === */
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0, 0, 0, 0)";
    overlay.style.transition = "background 1.8s ease-in-out";
    overlay.style.zIndex = "9998";
    document.body.appendChild(overlay);

    /* === HUG GIF === */
    const hug = document.createElement("img");
    hug.src = "hug.gif";
    hug.style.position = "fixed";
    hug.style.left = rect.left + "px";
    hug.style.top = rect.top + "px";
    hug.style.width = "50px";
    hug.style.height = "50px";
    hug.style.transform = "translate(0,0) scale(1)";
    hug.style.transition = "transform 1.8s ease-in-out";
    hug.style.zIndex = "9999";

    document.body.appendChild(hug);
    hug.getBoundingClientRect();

    const centerX = window.innerWidth / 2 - rect.left - 25;
    const centerY = window.innerHeight / 2 - rect.top - 25;

    overlay.style.background = "rgba(0, 0, 0, 0.75)";
    hug.style.transform =
      `translate(${centerX}px, ${centerY}px) scale(6)`;

    /* === AFTER HUG COMPLETE === */
    /* === AFTER HUG COMPLETE === */
setTimeout(() => {

  hug.remove();

  const together = document.createElement("img");
  together.src = "together.gif";
  together.style.position = "fixed";
  together.style.left = "50%";
  together.style.top = "50%";
  together.style.transform = "translate(-50%, -50%) scaleX(-1)";
  together.style.width = "350px";
  together.style.transition = "transform 4s ease-in-out";
  together.style.zIndex = "9999";

  document.body.appendChild(together);

  // Slow walk to right
  setTimeout(() => {
    together.style.transform =
      "translate(120vw, -50%) scaleX(-1)";
  }, 200);

  // Slowly darken background after they start walking
  setTimeout(() => {
    overlay.style.transition = "background 3s ease-in-out";
    overlay.style.background = "rgba(0,0,0,1)";
  }, 1500);

  // Final redirect (after full cinematic exit)
  setTimeout(() => {
    meetHugAudio.pause();
    meetHugAudio.currentTime = 0;
    window.location.href = "proposal.html";
  }, 5000);

}, 2200);


  }, 2500); // meet.gif duration
}




/* ================= HEARTS ================= */
function spawnHearts() {
  for (let i = 0; i < 3; i++) {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.innerHTML = "❤️";
    heart.style.left = Math.random() * window.innerWidth + "px";
    heart.style.top = window.innerHeight - 100 + "px";
    document.body.appendChild(heart);

    setTimeout(() => heart.remove(), 2000);
  }
}
