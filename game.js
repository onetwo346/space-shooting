const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const pauseButton = document.getElementById('pauseButton');
const restartButton = document.getElementById('restartButton');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Ship properties
const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    speed: 5,
    angle: 0
};

// Debris array
const debris = [];
const debrisCount = 10;
let score = 0;
let isPaused = false;
let animationFrameId;

// Spawn initial debris
function spawnDebris() {
    for (let i = 0; i < debrisCount; i++) {
        debris.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 10,
            speed: 1
        });
    }
}

spawnDebris();

// Handle input (touch/mouse)
let targetX = ship.x;
let targetY = ship.y;

canvas.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    targetX = e.touches[0].clientX;
    targetY = e.touches[0].clientY;
}, { passive: false });

// Pause/Play functionality
pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Play' : 'Pause';
    if (!isPaused) update();
});

// Restart functionality
restartButton.addEventListener('click', () => {
    isPaused = false;
    pauseButton.textContent = 'Pause';
    score = 0;
    scoreDisplay.textContent = `Debris: ${score}`;
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    targetX = ship.x;
    targetY = ship.y;
    debris.length = 0;
    spawnDebris();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    update();
});

// Game loop
function update() {
    if (isPaused) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Move ship toward target
    const dx = targetX - ship.x;
    const dy = targetY - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > ship.speed) {
        ship.x += (dx / distance) * ship.speed;
        ship.y += (dy / distance) * ship.speed;
    }
    ship.angle = Math.atan2(dy, dx);

    // Draw ship (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle + Math.PI / 2);
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(ship.size / 2, ship.size);
    ctx.lineTo(-ship.size / 2, ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Update and draw debris
    for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.y += d.speed;
        if (d.y > canvas.height) d.y = -d.size;

        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();

        // Collision detection
        const distToShip = Math.sqrt((ship.x - d.x) ** 2 + (ship.y - d.y) ** 2);
        if (distToShip < ship.size + d.size) {
            debris.splice(i, 1);
            score++;
            scoreDisplay.textContent = `Debris: ${score}`;
            debris.push({
                x: Math.random() * canvas.width,
                y: -d.size,
                size: 10,
                speed: 1
            });
        }
    }

    animationFrameId = requestAnimationFrame(update);
}

update();

// Resize canvas on window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    targetX = ship.x;
    targetY = ship.y;
});
