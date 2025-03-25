const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const pauseButton = document.getElementById('pauseButton');
const restartButton = document.getElementById('restartButton');

// Game Configuration
const GAME_CONFIG = {
    DIFFICULTY_LEVELS: {
        EASY: { 
            debrisSpeed: 1, 
            maxDebris: 10,
            spawnRate: 60,
            shipSpeed: 4,
            shipSize: 25
        },
        MEDIUM: { 
            debrisSpeed: 1.5, 
            maxDebris: 15,
            spawnRate: 45,
            shipSpeed: 5,
            shipSize: 20
        },
        HARD: { 
            debrisSpeed: 2, 
            maxDebris: 20,
            spawnRate: 30,
            shipSpeed: 6,
            shipSize: 15
        }
    }
};

// Game State
let gameState = {
    score: 0,
    isPaused: false,
    difficulty: 'MEDIUM',
    frameCount: 0,
    health: 100
};

// Ship properties
const ship = {
    x: 0,
    y: 0,
    size: 20,
    speed: 5,
    angle: 0
};

// Debris array
const debris = [];

// Powerups array
const powerUps = [];

// Initialize game
function initGame() {
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Reset ship position
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    ship.size = GAME_CONFIG.DIFFICULTY_LEVELS[gameState.difficulty].shipSize;
    ship.speed = GAME_CONFIG.DIFFICULTY_LEVELS[gameState.difficulty].shipSpeed;

    // Reset game state
    gameState.score = 0;
    gameState.health = 100;
    gameState.isPaused = false;
    gameState.frameCount = 0;

    // Clear existing debris and powerups
    debris.length = 0;
    powerUps.length = 0;

    // Spawn initial debris
    spawnInitialDebris();

    // Update score display
    updateScoreDisplay();
}

// Spawn initial debris based on difficulty
function spawnInitialDebris() {
    const config = GAME_CONFIG.DIFFICULTY_LEVELS[gameState.difficulty];
    
    for (let i = 0; i < config.maxDebris; i++) {
        spawnDebris();
    }
}

// Spawn individual debris
function spawnDebris() {
    const config = GAME_CONFIG.DIFFICULTY_LEVELS[gameState.difficulty];
    
    debris.push({
        x: Math.random() * canvas.width,
        y: -50,
        size: 10 + Math.random() * 10,
        speed: config.debrisSpeed * (0.5 + Math.random()),
        color: getRandomDebrisColor()
    });
}

// Generate random debris color
function getRandomDebrisColor() {
    const colors = ['#ffaa00', '#ff6600', '#ff3300', '#ff9900'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Spawn powerups occasionally
function spawnPowerUp() {
    const powerUpTypes = ['health', 'shield', 'speed'];
    powerUps.push({
        x: Math.random() * canvas.width,
        y: -50,
        type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
        size: 15,
        speed: 2
    });
}

// Input handling
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

// Update score display
function updateScoreDisplay() {
    scoreDisplay.textContent = `Debris: ${gameState.score} | Health: ${gameState.health}`;
}

// Pause/Play functionality
pauseButton.addEventListener('click', () => {
    gameState.isPaused = !gameState.isPaused;
    pauseButton.textContent = gameState.isPaused ? 'Play' : 'Pause';
    
    if (!gameState.isPaused) {
        requestAnimationFrame(update);
    }
});

// Restart functionality
restartButton.addEventListener('click', () => {
    cancelAnimationFrame(animationFrameId);
    initGame();
    update();
});

// Game over handling
function gameOver() {
    // Clear canvas with semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw game over text
    ctx.fillStyle = 'red';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 50);
}

// Main game loop
let animationFrameId;
function update() {
    // Check if game is paused
    if (gameState.isPaused) return;
    
    // Check for game over
    if (gameState.health <= 0) {
        gameOver();
        return;
    }

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
    
    // Change ship color based on health
    ctx.fillStyle = gameState.health > 50 ? 'cyan' : 'red';
    
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
        
        // Wrap around or reset
        if (d.y > canvas.height) {
            debris.splice(i, 1);
            spawnDebris();
        }
        
        // Draw debris
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Collision detection
        const distToShip = Math.sqrt((ship.x - d.x) ** 2 + (ship.y - d.y) ** 2);
        if (distToShip < ship.size + d.size) {
            // Reduce health on collision
            gameState.health -= 10;
            debris.splice(i, 1);
            spawnDebris();
            updateScoreDisplay();
        }
    }

    // Spawn additional debris and powerups periodically
    gameState.frameCount++;
    const config = GAME_CONFIG.DIFFICULTY_LEVELS[gameState.difficulty];
    
    if (gameState.frameCount % config.spawnRate === 0) {
        spawnDebris();
        if (Math.random() < 0.3) {
            spawnPowerUp();
        }
    }

    // Update score display
    updateScoreDisplay();

    // Continue game loop
    animationFrameId = requestAnimationFrame(update);
}

// Resize canvas on window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    targetX = ship.x;
    targetY = ship.y;
});

// Initialize and start the game
initGame();
update();
