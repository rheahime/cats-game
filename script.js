// Get all necessary elements from the DOM
const mainMenu = document.querySelector('.main-menu');
const menuButtons = document.querySelectorAll('.menu-button');
const gameContainers = document.querySelectorAll('.game-container');
const iconButtons = document.querySelectorAll('.icon-button');
const creditsButton = document.querySelector('.icon-buttons .icon-button:nth-child(1)');
const creditsPage = document.getElementById('creditsPage');
const mainMenuCat = document.querySelector('.animated-cat');
const kittyRunCat = document.querySelector('.kitty-run-cat');
const universalPauseButton = document.getElementById('universalPauseButton');
const kittyRunGame = document.getElementById('kittyRunGame');
const creditsSettingsButton = document.getElementById('creditsSettingsButton');
const donateSettingsButton = document.getElementById('donateSettingsButton');
const thanksSection = document.getElementById('thanks');
const donateSection = document.getElementById('donate');
const musicToggle = document.getElementById('musicToggle');
const sfxToggle = document.getElementById('sfxToggle');
const noLivesModal = document.getElementById('noLivesModal');
const lifeCountdownDisplay = document.getElementById('lifeCountdownDisplay');
const watchAdButton = document.getElementById('watchAdButton');
const modalOkButton = document.getElementById('modalOkButton');
const closeButton = document.querySelector('.close-button');
const continueButton = document.getElementById('continueButton');
const pauseBackButton = document.getElementById('pauseBackButton');

// --- Audio Elements and Logic ---
const catSound = new Audio('sounds/cat.flac');
const jumpSound = new Audio('sounds/jump.wav');
const powerUpSound = new Audio('sounds/power.wav');
const destroySound = new Audio('sounds/destroy.wav');
const sonataMusic = new Audio('sounds/sonata no.11 k.331 - iii. alla turca.mp3');
const nutcrackerMusic = new Audio('sounds/the nutcracker suite act 1 no. 6 - chinese dance.mp3');
const sugarPlumMusic = new Audio('sounds/dance of the sugar plum fairy.mp3');
const clickSound = new Audio('sounds/click.mp3');
const gameOverMusic = new Audio('sounds/12 variations on a french nursery theme.mp3');

let catSoundIntervalId;
let gameOverMusicTimeoutId;

// --- All Functions Go Here ---

// Function to show a specific settings section and hide others
function showSettingsSection(sectionToShow) {
    thanksSection.classList.add('hidden');
    donateSection.classList.add('hidden');
    sectionToShow.classList.remove('hidden');
}

// Function to update the volume and playback based on the toggle state
function updateAudioState() {
    // --- Music Logic ---
    stopBackgroundMusic(); // Stops game music
    sugarPlumMusic.pause();
    sugarPlumMusic.currentTime = 0;
    gameOverMusic.pause();
    gameOverMusic.currentTime = 0;

    if (musicToggle.checked) {
        if (gameState.current === 'menu') {
            sugarPlumMusic.volume = 0.5;
            sugarPlumMusic.loop = true;
            sugarPlumMusic.play().catch(e => console.error("Sugar Plum playback failed:", e));
        } else if (gameState.current === 'kittyRun') {
            startBackgroundMusic();
        }
    }
    // --- Sound Effects Logic ---
    const sfxVolume = sfxToggle.checked ? 1.0 : 0.0;
    catSound.volume = sfxVolume;
    jumpSound.volume = sfxVolume;
    powerUpSound.volume = sfxVolume;
    destroySound.volume = sfxVolume;
    clickSound.volume = sfxVolume;
    
    if (sfxToggle.checked) {
        // Only start cat sounds on the main menu
        if (gameState.current === 'menu') {
            startCatSounds();
        }
    } else {
        stopCatSounds();
    }
}

// Save the audio settings to local storage whenever a toggle is changed
function saveAudioSettings() {
    localStorage.setItem('musicEnabled', musicToggle.checked);
    localStorage.setItem('sfxEnabled', sfxToggle.checked);
}

// Load audio settings from local storage on page load
function loadAudioSettings() {
    const musicEnabled = localStorage.getItem('musicEnabled');
    const sfxEnabled = localStorage.getItem('sfxEnabled');
    
    if (musicEnabled !== null) {
        musicToggle.checked = musicEnabled === 'true';
    }
    if (sfxEnabled !== null) {
        sfxToggle.checked = sfxEnabled === 'true';
    }
    updateAudioState();
}


function playClickSound() {
    clickSound.currentTime = 0;
    clickSound.play().catch(e => console.error("Click sound playback failed:", e));
}

function showPauseButton() {
    universalPauseButton.classList.remove('hidden');
}

// New functions to manage the game music
function startBackgroundMusic() {
    sonataMusic.volume = 0.5;
    nutcrackerMusic.volume = 0.5;

    // Start with the first song
    sonataMusic.play().catch(e => console.error("Sonata playback failed:", e));

    // When the first song ends, play the second one
    sonataMusic.onended = () => {
        nutcrackerMusic.play().catch(e => console.error("Nutcracker playback failed:", e));
    };

    // When the second song ends, restart the sequence
    nutcrackerMusic.onended = () => {
        sonataMusic.play().catch(e => console.error("Sonata playback failed:", e));
    };
}
function stopBackgroundMusic() {
    sonataMusic.pause();
    sonataMusic.currentTime = 0;
    nutcrackerMusic.pause();
    nutcrackerMusic.currentTime = 0;
}

function playCatSound() {
    if (sfxToggle.checked && gameState.current === 'menu') {
        catSound.currentTime = 0;
        catSound.play().catch(e => console.error("Audio playback failed:", e));
    }
}

function fadeOut(audioElement) {
    const fadeInterval = setInterval(() => {
        if (audioElement.volume > 0.1) {
            audioElement.volume -= 0.1;
        } else {
            audioElement.pause();
            audioElement.volume = 1; // Reset volume for next play
            clearInterval(fadeInterval);
        }
    }, 100);
}

function startCatSounds() {
    // Start the interval for random cat sounds
    catSoundIntervalId = setInterval(() => {
        // Play sound at a random interval between 20 and 40 seconds
        setTimeout(playCatSound, Math.random() * 20000);
    }, 40000);
}

function stopCatSounds() {
    clearInterval(catSoundIntervalId);
    fadeOut(catSound);
}

// --- Universal Game Variables ---
const MAX_LIVES = 5;
let playerLives = parseInt(localStorage.getItem('playerLives')) || MAX_LIVES;
let gameState = {
    current: 'menu', // 'menu', 'kittyRun', 'credits'
    isPaused: false,
};
let highestScore = localStorage.getItem('highestScore') || 0;

// --- Life Regeneration Logic ---
// Get the last time a life was lost from local storage, or default to 0
let lastLifeLostTimestamp = localStorage.getItem('lastLifeLost') || 0;
let countdownRemaining;



function checkAndRegenLife() {
    const twentyMinutes = 20 * 60 * 1000; // 20 minutes in milliseconds
    const timeSinceLastLoss = Date.now() - lastLifeLostTimestamp;

    if (playerLives < MAX_LIVES && timeSinceLastLoss >= twentyMinutes) {
        playerLives = Math.min(playerLives + 1, MAX_LIVES);
        localStorage.setItem('lastLifeLost', Date.now()); // Reset the timer
        localStorage.setItem('playerLives', playerLives);
        console.log("A new life has been regenerated!");
    }
}
function showNoLivesModal() {
    // Hide all other game pages and the main menu
    mainMenu.style.display = 'none';
    gameContainers.forEach(container => container.style.display = 'none');
    creditsPage.style.display = 'none';

    noLivesModal.classList.remove('hidden');
    noLivesModal.style.display = 'flex'; // Use flex to center the content

    // Start a timer to update the countdown display
    updateLifeCountdown(); // Initial update
    const countdownInterval = setInterval(() => {
        updateLifeCountdown();
        if (countdownRemaining === 0) {
            clearInterval(countdownInterval);
            // Hide the ad button and show a "Play Now" button if you wish
            watchAdButton.classList.add('hidden');
        }
        lifeCountdownDisplay.textContent = formatTime(countdownRemaining);
    }, 1000);
}

function handleNoLives() {
    // Hide all other pages
    mainMenu.style.display = 'none';
    gameContainers.forEach(container => container.style.display = 'none');
    creditsPage.style.display = 'none';
    
    // Show the modal
    noLivesModal.style.display = 'flex';
    
    // Start the countdown
    updateLifeCountdown();
    const countdownInterval = setInterval(() => {
        updateLifeCountdown();
        if (countdownRemaining === 0) {
            clearInterval(countdownInterval);
        }
        lifeCountdownDisplay.textContent = formatTime(countdownRemaining);
    }, 1000);
}

// New function to format the time remaining
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
    return `${formattedMinutes}:${formattedSeconds}`;
}

// New function to update the countdown
function updateLifeCountdown() {
    const twentyMinutes = 20 * 60 * 1000;
    checkAndRegenLife(); // Check and regen life every second

    if (playerLives < MAX_LIVES) {
        const timeSinceLastLoss = Date.now() - lastLifeLostTimestamp;
        countdownRemaining = twentyMinutes - timeSinceLastLoss;
        if (countdownRemaining < 0) {
            countdownRemaining = 0;
        }
    } else {
        countdownRemaining = null; // No countdown if lives are full
    }
}

// --- Kitty Run Specific Variables ---
let gameRunning = false;
let score = 0;
let kitty;
let obstacles = [];
let particles = [];
let gameLoopId;
let powerUpCount = 0;
let powerUpAuraTimer = 0;
let spriteSizeMultiplier = 1.5; 
let bgX1 = 0;
let bgX2;


// Get the canvas and its 2D context
const canvas = document.getElementById('kittyRunCanvas');
const ctx = canvas.getContext('2d');

// --- Game Assets (images) ---
const stoneImage = new Image();
const yarnImage = new Image();
const spaceshipImage = new Image();
const stone2Image = new Image();
const yarn2Image = new Image();
const spaceship2Image = new Image();
const bgImage = new Image();

// This Promise ensures all images are loaded before the game starts.
const loadAssets = () => {
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalAssets = 7;

        const onAssetLoad = () => {
            loadedCount++;
            if (loadedCount === totalAssets) {
                resolve();
            }
        };

        stoneImage.onload = onAssetLoad;
        yarnImage.onload = onAssetLoad;
        spaceshipImage.onload = onAssetLoad;
        stone2Image.onload = onAssetLoad;
        yarn2Image.onload = onAssetLoad;
        spaceship2Image.onload = onAssetLoad;
        bgImage.onload = onAssetLoad;

        stoneImage.src = 'assets/stone.png';
        yarnImage.src = 'assets/yarn.png';
        spaceshipImage.src = 'assets/spaceship.png';
        stone2Image.src = 'assets/stone2.png';
        yarn2Image.src = 'assets/yarn2.png';
        spaceship2Image.src = 'assets/spaceship2.png';
        bgImage.src = 'assets/kitty-run-bg-1.svg';
    });
};

// Game constants (now as variables for difficulty scaling)
const JUMP_SPEED = 12;
const GRAVITY = 0.5;
let OBSTACLE_SPEED = 5;
let OBSTACLE_SPAWN_INTERVAL = 1000; // milliseconds
let lastObstacleSpawnTime = 0;

// --- Helper Functions ---
function showPage(page) {
    stopCatSounds();

    mainMenu.style.display = 'none';
    gameContainers.forEach(container => container.style.display = 'none');
    creditsPage.style.display = 'none';
    page.style.display = 'flex';
}

function showMainMenu() {
   ctx.clearRect(0, 0, canvas.width, canvas.height);
 mainMenu.style.display = 'flex';
    gameContainers.forEach(container => container.style.display = 'none');
    creditsPage.style.display = 'none';
    iconButtons.forEach(button => button.style.display = 'flex');
    gameRunning = false;
    cancelAnimationFrame(gameLoopId);

    kittyRunGame.classList.remove('game-active');

    universalPauseButton.classList.add('hidden');

    clearTimeout(gameOverMusicTimeoutId);
    
    mainMenuCat.style.display = 'block';
    kittyRunCat.style.display = 'none';

    gameState.current = 'menu';
    // Call the central music handler
    updateAudioState();
}
// Global variable for responsive scaling
let scaleFactor = 1;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (canvas.width < canvas.height) {
        // Portrait mode: make elements larger for touchscreens
        spriteSizeMultiplier = 2.0;
    } else {
        // Landscape mode: use a standard multiplier
        spriteSizeMultiplier = 1.5;
    }
    
    let baseWidth = 1920;
    let baseHeight = 1080;
    let minScale = 0.4;

    if (window.innerWidth < 768) {
        baseWidth = 720;
        baseHeight = 1280;
        minScale = 0.8;
    }
    
    const widthRatio = canvas.width / baseWidth;
    const heightRatio = canvas.height / baseHeight;
    scaleFactor = Math.min(widthRatio, heightRatio);
    scaleFactor = Math.max(scaleFactor, minScale);

    bgX1 = 0;
    bgX2 = canvas.width;
    
    if (kitty) {
        kitty.width = (77 * scaleFactor) * spriteSizeMultiplier;
        kitty.height = (55 * scaleFactor) * spriteSizeMultiplier;
        kitty.originalHeight = kitty.height;
        kitty.y = canvas.height - kitty.height;
    }
    updateAudioState();
}

function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();
}

// --- Game Logic ---
function Kitty() {

    this.width = (77 * scaleFactor) * spriteSizeMultiplier;
    this.height = (55 * scaleFactor) * spriteSizeMultiplier;
    this.originalHeight = this.height; // Use the new, larger height here
    
    // The x position is fine as it is
    this.x = 50 * scaleFactor;
    // The y position automatically adjusts with the new height
    this.y = canvas.height - this.height;
    
    this.yVelocity = 0;
    this.isJumping = false;
    this.isDucking = false;
    this.jumpsRemaining = 2;

    this.svgElement = document.querySelector('.kitty-run-cat');
    this.svgElement.style.position = 'absolute';

    this.draw = function() {
        this.svgElement.style.left = this.x + 'px';
        this.svgElement.style.top = this.y + 'px';
        this.svgElement.style.width = this.width + 'px';
        this.svgElement.style.height = this.height + 'px';
    };

    this.jump = function() {
        if (this.jumpsRemaining > 0) {
            jumpSound.currentTime = 0; // Reset sound for instant playback
            jumpSound.play();
            this.isJumping = true;
            this.yVelocity = -JUMP_SPEED * scaleFactor;
            this.jumpsRemaining--;
        }
    };

    this.duck = function() {
        if (!this.isDucking) {
            this.isDucking = true;
            this.height = this.originalHeight * 0.6;
            this.y = canvas.height - this.height;
        }
    };

    this.unduck = function() {
        if (this.isDucking) {
            this.isDucking = false;
            this.height = this.originalHeight;
            this.y = canvas.height - this.height;
        }
    };

    this.usePowerUp = function() {
        if (powerUpCount > 0) {
            destroySound.currentTime = 0;
            destroySound.play();
            powerUpCount--;
            let closestObstacleIndex = -1;
            let minDistance = Infinity;

            for (let i = 0; i < obstacles.length; i++) {
                if (obstacles[i].x + obstacles[i].width > this.x) {
                    let distance = obstacles[i].x - this.x;
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestObstacleIndex = i;
                    }
                }
            }

            if (closestObstacleIndex !== -1) {
                // Spawn particles at the location of the obstacle before removing it
                spawnParticles(obstacles[closestObstacleIndex].x, obstacles[closestObstacleIndex].y);
                obstacles.splice(closestObstacleIndex, 1);
            }
        }
    };

    this.update = function() {
        if (!this.isDucking) {
            this.yVelocity += GRAVITY * scaleFactor;
            this.y += this.yVelocity;

            if (this.y >= canvas.height - this.height) {
                this.y = canvas.height - this.height;
                this.isJumping = false;
                this.yVelocity = 0;
                this.jumpsRemaining = 2;
            }
        }
    };
}

// Function to create game obstacles and power-ups
function Obstacle(type) {
    this.type = type;
    this.x = canvas.width;
    this.width = 20;
    this.height = 20;
    this.y = canvas.height - this.height;
    
    // Add the new 'collected' property
    this.collected = false;

    let image;

    if (this.type === 'stone') {
        image = stoneImage;
        this.width = (44 * scaleFactor) * spriteSizeMultiplier;
        this.height = (39 * scaleFactor) * spriteSizeMultiplier;
        this.y = canvas.height - this.height;
    } else if (this.type === 'stone2') {
        image = stone2Image;
        this.width = (50 * scaleFactor) * spriteSizeMultiplier;
        this.height = (45 * scaleFactor) * spriteSizeMultiplier;
        this.y = canvas.height - this.height - (kitty.originalHeight * 0.5);
    } else if (this.type === 'yarn') {
        image = yarnImage;
        this.width = (33 * scaleFactor) * spriteSizeMultiplier;
        this.height = (33 * scaleFactor) * spriteSizeMultiplier;
        this.y = canvas.height - this.height;
    } else if (this.type === 'yarn2') {
        image = yarn2Image;
        this.width = (40 * scaleFactor) * spriteSizeMultiplier;
        this.height = (40 * scaleFactor) * spriteSizeMultiplier;
        this.y = canvas.height - this.height - (kitty.originalHeight * 0.3);
    } else if (this.type === 'spaceship') {
        image = spaceshipImage;
        const isLow = Math.random() < 0.5;
        this.width = (66 * scaleFactor) * spriteSizeMultiplier;
        this.height = (44 * scaleFactor) * spriteSizeMultiplier;
        if (isLow) {
            this.y = canvas.height - this.height;
        } else {
            this.y = canvas.height - this.height - (kitty.originalHeight * 0.9);
        }
    } else if (this.type === 'spaceship2') {
        image = spaceship2Image;
        const isLow = Math.random() < 0.5;
        this.width = (75 * scaleFactor) * spriteSizeMultiplier;
        this.height = (50 * scaleFactor) * spriteSizeMultiplier;
        if (isLow) {
            this.y = canvas.height - this.height;
        } else {
            this.y = canvas.height - this.height - (kitty.originalHeight * 1.1);
        }
    }

    this.update = function() {
        this.x -= OBSTACLE_SPEED * scaleFactor;
    };
    
    // Replace your existing 'draw' method with this updated version
    this.draw = function() {
        // Don't draw the obstacle if it has been collected
        if (this.collected) {
            return;
        }
        
        ctx.drawImage(image, this.x, this.y, this.width, this.height);

        // Check if it's a power-up and draw text above it
        if (this.type === 'yarn' || this.type === 'yarn2') {
            ctx.save();
            ctx.font = "16px 'Gamja Flower'";
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 5;
            
            // Position the text slightly above the obstacle
            const textX = this.x + this.width / 2;
            const textY = this.y - 10;
            ctx.fillText("Power-Up!", textX, textY);
            
            ctx.restore();
        }
    };
}

// --- Particle System Logic ---
function Particle(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 5 + 1;
    this.velocity = {
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 5
    };
    this.alpha = 1; // opacity

    this.update = function() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.03; // Fade out over time
    };

    this.draw = function() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
    };
}

function spawnParticles(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y));
    }
}

function updateAndDrawParticles() {
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    // Remove particles that have fully faded away
    particles = particles.filter(particle => particle.alpha > 0);
}

function restartCatAnimation() {
    const animatedElements = document.querySelectorAll('.kitty-run-cat .cat-tail, .kitty-run-cat .front-leg, .kitty-run-cat .back-leg, .kitty-run-cat .brow');
    
    animatedElements.forEach(element => {
        const originalStyle = element.style.animation;
        element.style.animation = 'none';
        void element.offsetWidth; // This line forces a DOM reflow
        element.style.animation = originalStyle;
    });
}

function initKittyRun() {
    loadAssets().then(() => {
    // Reset difficulty variables
    OBSTACLE_SPEED = 5;
    OBSTACLE_SPAWN_INTERVAL = 1000;
        
    gameRunning = true;
    score = 0;
    obstacles = [];
    particles = [];
    powerUpAuraTimer = 0;
    lastObstacleSpawnTime = performance.now();

  powerUpCount = 0; 
    gameState.isPaused = false;
        
    resizeCanvas();
    bgX2 = canvas.width;
    kitty = new Kitty();
    kittyRunGame.classList.add('game-active');

    mainMenuCat.style.display = 'none';
    kittyRunCat.style.display = 'block';
    restartCatAnimation();

    document.getElementById('runRestartButton').style.display = 'none';
    document.getElementById('runBackButton').style.display = 'none';

    iconButtons.forEach(button => button.style.display = 'flex');
    universalPauseButton.classList.remove('hidden');
        
    gameState.current = 'kittyRun';
    updateAudioState();

    // The game loop is only started here
    gameLoopId = requestAnimationFrame(gameLoop);
    });
}

function spawnObstacle() {
  const isPowerUp = Math.random() < 0.15; // 15% chance to spawn a power-up
  let randomType;
  if (isPowerUp) {
    const powerUpTypes = ['yarn', 'yarn2'];
    randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  } else {
    // The rest are regular obstacles
    const obstacleTypes = ['stone', 'stone', 'stone2', 'spaceship', 'spaceship2'];
    randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  }
  obstacles.push(new Obstacle(randomType));
}

function checkCollision() {
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        if (
            kitty.x < obstacle.x + obstacle.width &&
            kitty.x + kitty.width > obstacle.x &&
            kitty.y < obstacle.y + obstacle.height &&
            kitty.y + kitty.height > obstacle.y
        ) {
            if (obstacle.type === 'yarn' || obstacle.type === 'yarn2') {
                powerUpSound.currentTime = 0; // Play the power-up sound
                powerUpSound.play();
                powerUpCount++;
                powerUpAuraTimer = 60; // Start the aura timer for 60 frames
                obstacles.splice(i, 1);
                return false;
            } else {
                return true;
            }
        }
    }
    return false;
}

function gameLoop(timestamp) {
    // This is the core check. The loop will only run if the state is 'kittyRun'.
    if (gameState.current !== 'kittyRun') {
        gameLoopId = requestAnimationFrame(gameLoop);
        return;
    }

    // --- PAUSED STATE CHECK ---
    if (gameState.isPaused) {
        // Draw the semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // We still need to call the next frame to check for a resume click
        gameLoopId = requestAnimationFrame(gameLoop);
        return;
    }

    // --- ALL GAME LOGIC AND DRAWING HAPPENS BELOW THIS LINE ---

    // Background scrolling
    const bgScrollSpeed = OBSTACLE_SPEED * 0.5 * scaleFactor;
    bgX1 -= bgScrollSpeed;
    bgX2 -= bgScrollSpeed;
    if (bgX1 <= -canvas.width) {
        bgX1 = bgX2 + canvas.width;
    }
    if (bgX2 <= -canvas.width) {
        bgX2 = bgX1 + canvas.width;
    }

    // Obstacle spawning and updates
    if (timestamp - lastObstacleSpawnTime > OBSTACLE_SPAWN_INTERVAL) {
        spawnObstacle();
        lastObstacleSpawnTime = timestamp;
    }
    obstacles.forEach(obstacle => {
        obstacle.update();
    });
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);

    // Kitty position update
    kitty.update();

    // Check for collision
    if (checkCollision()) {
        gameOver();
        return;
    }

    // --- All drawing happens here, after the logic ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.drawImage(bgImage, Math.round(bgX1), 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(Math.round(bgX2 + canvas.width - 1), 0);
    ctx.scale(-1, 1);
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw all game elements
    kitty.draw();
    obstacles.forEach(obstacle => {
        obstacle.draw();
    });
    updateAndDrawParticles();

    // Draw HUD
    const column1X = 5;
    const column2X = 160;
    const rectWidth = 140;
    const rectHeight = 30;
    const rectRadius = 5;
    const textIndent = 10;
    const textYOffset = 20;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    drawRoundedRect(column1X, 5, rectWidth, rectHeight, rectRadius);
    ctx.font = "20px 'Gamja Flower'";
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, column1X + textIndent, 5 + textYOffset);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    drawRoundedRect(column1X, 40, rectWidth, rectHeight, rectRadius);
    ctx.fillStyle = '#000';
    ctx.font = "20px 'Gamja Flower'";
    ctx.fillText('Highest: ' + highestScore, column1X + textIndent, 40 + textYOffset);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    drawRoundedRect(column2X, 5, rectWidth, rectHeight, rectRadius);
    ctx.fillStyle = '#000';
    ctx.font = "20px 'Gamja Flower'";
    let livesText = `Lives: ${playerLives}`;
    if (playerLives < MAX_LIVES && countdownRemaining !== null) {
        livesText += ` (${formatTime(countdownRemaining)})`;
    }
    ctx.fillText(livesText, column2X + textIndent, 5 + textYOffset);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    drawRoundedRect(column2X, 40, rectWidth, rectHeight, rectRadius);
    ctx.fillStyle = '#000';
    ctx.font = "20px 'Gamja Flower'";
    ctx.fillText('Power-ups: ' + powerUpCount, column2X + textIndent, 40 + textYOffset);
    
    if (powerUpAuraTimer > 0) {
      ctx.save();
      const glowRadius = kitty.width / 2 + (1 - powerUpAuraTimer / 60) * 10;
      const glowAlpha = (powerUpAuraTimer / 60) * 0.6;
      ctx.beginPath();
      ctx.arc(kitty.x + kitty.width / 2, kitty.y + kitty.height / 2, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `rgba(255, 215, 0, ${glowAlpha})`;
      ctx.fill();
      ctx.restore();
      powerUpAuraTimer--;
    }
    
    // Adjust difficulty and score
    score++;
    if (score % 500 === 0) {
        OBSTACLE_SPEED = Math.min(OBSTACLE_SPEED + 0.5, 10);
        OBSTACLE_SPAWN_INTERVAL = Math.max(OBSTACLE_SPAWN_INTERVAL - 50, 400);
    }
    
    // This must be the very last line of the game loop
    gameLoopId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    // Hide the game-specific buttons first
    document.getElementById('runRestartButton').style.display = 'none';
    document.getElementById('runBackButton').style.display = 'none';

    // --- Step 1: Update lives immediately ---
    playerLives--;
    localStorage.setItem('lastLifeLost', Date.now());
    localStorage.setItem('playerLives', playerLives);

    // --- Step 2: Change the game state and handle sounds ---
    gameState.current = "gameOver";
    stopBackgroundMusic();
    playClickSound();
    if (musicToggle.checked) {
        gameOverMusic.currentTime = 0;
        gameOverMusic.play().catch(e => console.error("Game over music playback failed:", e));
    }

    // --- Step 3: Draw the game over screen directly ---
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "30px 'Gamja Flower'";
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px 'Gamja Flower'";
    ctx.fillStyle = '#fff';
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 10);
    
    // --- Step 4: Display the correct buttons and UI ---
    kittyRunCat.style.display = 'none';
    mainMenuCat.style.display = 'block';
    universalPauseButton.classList.add('hidden');

    if (playerLives > 0) {
        document.getElementById('runRestartButton').style.display = 'inline-block';
        document.getElementById('runBackButton').style.display = 'inline-block';
    } else {
        setTimeout(handleNoLives, 3000);
    }
    
    // --- Step 5: Update scores (after the check) ---
    if (score > highestScore) {
        highestScore = score;
        localStorage.setItem('highestScore', highestScore);
    }
}

// --- All Event Listeners Go Here ---

musicToggle.addEventListener('change', () => {
    playClickSound();
    updateAudioState();
    saveAudioSettings();
});

sfxToggle.addEventListener('change', () => {
    playClickSound();
    updateAudioState();
    saveAudioSettings();
});
menuButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const buttonText = event.target.textContent;
        switch (buttonText) {
            case 'Kitty Run':
                // Check if the player has lives
                if (playerLives > 0) {
                    showPage(document.getElementById('kittyRunGame'));
                    initKittyRun();
                } else {
                    // Call a dedicated function for the 'no lives' state
                    handleNoLives();
                }
                break;
        }
    });
});

document.getElementById('runBackButton').addEventListener('click', showMainMenu);

creditsButton.addEventListener('click', () => {
    showPage(creditsPage);
    
    // Explicitly hide the icon buttons container
    iconButtons.forEach(button => button.style.display = 'none');
});

document.getElementById('creditsBackButton').addEventListener('click', showMainMenu);

document.getElementById('runRestartButton').addEventListener('click', () => {
    if (playerLives > 0) {
        // Stop the game over music and reset its position
        gameOverMusic.pause();
        gameOverMusic.currentTime = 0;

        showPage(document.getElementById('kittyRunGame'));
        initKittyRun();
    } else {
        alert('You have no lives left! ' + formatTime(20 * 60 * 1000) + '.');
    }
});

// --- Ad for extra life (conceptual implementation) ---
// This requires a native Android bridge. This is a placeholder.
// You would need to add a button in your HTML for this to work.
window.onRewardedAdCompleted = () => {
    playerLives = Math.min(playerLives + 1, MAX_LIVES);
    alert('You have earned an extra life!');
};

function showRewardedAd() {
    // This function must call your native Android code to show the ad.
    // For example, in an Android WebView, you might use something like:
    // Android.showAd();
    // The native code would then call window.onRewardedAdCompleted() upon success.
    console.log("Attempting to show a rewarded ad...");
}

function togglePause() {
    const pauseMenu = document.querySelector('.pause-menu');

    // We only want to pause if a game is currently running
    if (gameState.current === 'kittyRun') {
        gameState.isPaused = !gameState.isPaused;

        if (gameState.isPaused) {
            // Draw the semi-transparent overlay directly on the canvas
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Pause the game and show the new menu
            cancelAnimationFrame(gameLoopId);
            stopBackgroundMusic();
            universalPauseButton.classList.add('hidden');
            pauseMenu.classList.remove('hidden'); // Show the pause menu
        } else {
            // Resume the game and hide the menu
            gameLoopId = requestAnimationFrame(gameLoop);
            updateAudioState();
            universalPauseButton.classList.remove('hidden');
            pauseMenu.classList.add('hidden'); // Hide the pause menu
        }
    }
}

// Keyboard controls
document.addEventListener('keydown', (event) => {
    if (gameState.current === 'kittyRun' && !gameState.isPaused) {
        if (event.code === 'Space') {
            kitty.jump();
        } else if (event.code === 'ArrowDown') {
            kitty.duck();
        } else if (event.code === 'KeyZ') {
            kitty.usePowerUp();
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (gameState.current === 'kittyRun' && !gameState.isPaused && event.code === 'ArrowDown') {
        kitty.unduck();
    }
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;
let isSwiping = false;

canvas.addEventListener('touchstart', (event) => {
    if (gameState.current === 'kittyRun' && !gameState.isPaused) {
        event.preventDefault();
        
        // Use a power-up on a two-finger tap
        if (event.touches.length >= 2) {
            kitty.usePowerUp();
            return;
        }

        isSwiping = false;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
});

canvas.addEventListener('touchmove', (event) => {
    if (gameState.current === 'kittyRun' && !gameState.isPaused) {
        event.preventDefault();
        const touchCurrentY = event.touches[0].clientY;
        const deltaY = touchCurrentY - touchStartY;
        const deltaX = Math.abs(event.touches[0].clientX - touchStartX);
        
        // We only care about vertical movement
        if (deltaY > 30 && deltaX < 30) { 
            kitty.duck();
            isSwiping = true;
        } else if (isSwiping && deltaY < -10) {
            // This prevents an immediate unduck if the swipe reverses a little
            // You can adjust this logic as needed
        }
    }
});

canvas.addEventListener('touchend', () => {
    if (gameState.current === 'kittyRun' && !gameState.isPaused) {
        // If the player was not swiping, this is a tap
        if (!isSwiping && kitty.isJumping === false && kitty.isDucking === false) {
            kitty.jump();
        }
        // Always unduck when the touch ends
        if (kitty.isDucking) {
            kitty.unduck();
        }
    }
});


document.addEventListener('click', (event) => {
    // Check if the clicked element or its parent is a button
    const target = event.target.closest('button, .menu-button, .icon-button');
    if (target) {
        playClickSound();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // This is the main container for your settings buttons and content.
    const settingsContainer = document.getElementById('creditsPage');

    // Get the content containers once
    const donateContent = document.getElementById('donate');
    const creditsContent = document.getElementById('thanks');
    
    // Check if the elements exist to prevent errors
    if (!settingsContainer || !donateContent || !creditsContent) {
        console.error("One or more elements are missing from the DOM.");
        return;
    }

    // A function to hide all content blocks
    function hideAllContent() {
        donateContent.classList.add('hidden');
        creditsContent.classList.add('hidden');
    }

    // Add a single click listener to the parent container
    settingsContainer.addEventListener('click', (event) => {
        // Find the button that was clicked
        const clickedButton = event.target.closest('button');

        // If a button was clicked and it has an ID, proceed
        if (clickedButton && (clickedButton.id === 'donateSettingsButton' || clickedButton.id === 'creditsSettingsButton')) {
            // Prevent the default button behavior
            event.preventDefault();

            // Determine which content to toggle based on the button's ID
            let targetContent;
            if (clickedButton.id === 'donateSettingsButton') {
                targetContent = donateContent;
            } else if (clickedButton.id === 'creditsSettingsButton') {
                targetContent = creditsContent;
            }

            // Toggle the 'hidden' class
            if (targetContent) {
                if (targetContent.classList.contains('hidden')) {
                    hideAllContent();
                    targetContent.classList.remove('hidden');
                } else {
                    targetContent.classList.add('hidden');
                }
            }
        }
    });
});

// Event listener for the modal's "OK" button
modalOkButton.addEventListener('click', () => {
    // Hide the modal by setting its display property
    noLivesModal.style.display = 'none'; 
    // This returns the player to the main menu
    showMainMenu();
});

// Event listener for the modal's close 'X' button
closeButton.addEventListener('click', () => {
    // Hide the modal by setting its display property
    noLivesModal.style.display = 'none';
    // This returns the player to the main menu
    showMainMenu();
});

document.getElementById('continueButton').addEventListener('click', () => {
    togglePause(); // Resume the game
});

document.getElementById('pauseBackButton').addEventListener('click', () => {
    // Reset all game state before going back to the menu
    cancelAnimationFrame(gameLoopId);
    stopBackgroundMusic();
    gameState.current = 'menu';
    gameRunning = false;
    obstacles = [];
    particles = [];
    powerUpAuraTimer = 0;
    
    // Hide the pause menu and show the main menu
    document.querySelector('.pause-menu').classList.add('hidden');
    showMainMenu();
});

universalPauseButton.addEventListener('click', () => {
    playClickSound();
    togglePause();
});

// Resize and initial load
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
    resizeCanvas();
    updateLifeCountdown();
    setInterval(updateLifeCountdown, 1000);
    mainMenuCat.addEventListener('click', playCatSound);
    mainMenuCat.addEventListener('touchstart', playCatSound);
    showMainMenu();
    loadAudioSettings();
});