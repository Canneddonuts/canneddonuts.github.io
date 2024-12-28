/*
* bullethell-js
* Author ~ exit0ne
* License ~ BSD Clause 3
* Date ~ Nov26-Dec23 2024
*/

// Constants
const MAX_LIVES = 3;
const PLYR_SPD = 5;
const PLYR_SLOW_SPD = 3;
const PLYR_IFRAMES = 120; // 120 frames that is

// Sprites
const shipSprite = new Image();
const enemySprite = new Image();
const bulSprite = new Image();
const hudSprite = new Image();
const spaceSprite = new Image();
const titleSprite = new Image();
const plyrshotSprite = new Image();
shipSprite.src = "assets/gfx/ship.png";
bulSprite.src = "assets/gfx/bul.png";
hudSprite.src = "assets/gfx/hud.png";
spaceSprite.src = "assets/gfx/space.png";
titleSprite.src = "assets/gfx/title.png";
plyrshotSprite.src = "assets/gfx/plyrshot.png";
enemySprite.src = "assets/gfx/enemy.png";

const canvas = document.getElementById('rect');
const ctx = canvas.getContext('2d');
// Game globals
const gameScreens = {
  TITLE: 0,
  GAMEPLAY: 1,
};

var isPause = false;
var isGameOver = false;
var isGameWon = false;
var frames = 0;
var gameWidth = canvas.width-100;
var gameHeight = canvas.height;
var currentScreen = gameScreens.TITLE;
var nextScreen = null;
var isTransition = false;

const keyState = {
    Up: false,
    Left: false,
    Right: false,
    Down: false,
    Shift: false,
    Fire: false,
};

const keyMappings = {
    'ArrowUp': 'Up',
    'ArrowLeft': 'Left',
    'ArrowDown': 'Down',
    'ArrowRight': 'Right',
    'Shift': 'Shift',
    'z': 'Fire',
    'Z': 'Fire',
};
// Event Listeners and DOM stuff
document.onkeydown = function(evt) {
    evt = evt || window.event;
    const keyCode = evt.keyCode;

    // Prevent default action for arrow keys and space bar
    if ((keyCode >= 37 && keyCode <= 40) || keyCode === 32) {
        evt.preventDefault();
        return false;
    }
};

function startTransition() {
  isTransition = true;

  canvas.style.transition = 'opacity 0.4s ease-in-out';
  canvas.style.opacity = 0;

  setTimeout(() => {
    currentScreen = nextScreen;
    canvas.style.opacity = 1;
    setTimeout(() => {
      isTransition = false;
    }, 400);
  }, 400);
}

document.addEventListener('keydown', function(event) {
    switch (currentScreen) {
    case gameScreens.TITLE:
        if (event.key === 'Enter') {
          initGame();
          nextScreen = gameScreens.GAMEPLAY;
          isTransition = true;
          startTransition();
        }    
        break;
    case gameScreens.GAMEPLAY:
        if (event.key === 'Enter') {
          if (isGameOver) {
            initGame();
          } else {
            isPause = !isPause;
          }
        }

        if (event.key === 'r' || event.key === 'R')
          initGame();

        if (event.key === 'q' || event.key === 'Q') {
          nextScreen = gameScreens.TITLE;
          isTransition = true;
          startTransition();      
        }

        const mappedKey = keyMappings[event.key];
        if (mappedKey !== undefined)
          keyState[mappedKey] = true;
    break;
    default:
    }
});

document.addEventListener('keyup', function(event) {
    const mappedKey = keyMappings[event.key];
    if (mappedKey !== undefined) {
        keyState[mappedKey] = false;
    }
});

// Shape classes
class Rect {
    constructor(x, y, w, h, color) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
    }

    draw() {
        ctx.strokeStyle = this.color;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = 'black';
    }
}

class Circle {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeStyle = "black";
    }
}

class Player extends Rect {
    constructor(x, y, w, h, color) {
        super(x, y, w, h, color);
        this.speed = PLYR_SPD;
        this.dx = 0;
        this.dy = 0;
        this.lives = 3;
        this.inv = false;
        this.invT = 0;
        this.invDur = PLYR_IFRAMES;
        this.fireCooldown = 100; // 100ms
        this.lastFireTime = 0;   // Time of last shot
    }

    update() {
        if (this.lives < 1)
          isGameOver = true;
        this.dx = 0;
        this.dy = 0;

        if (keyState.Up) this.dy--;
        if (keyState.Left) this.dx--;
        if (keyState.Down) this.dy++;
        if (keyState.Right) this.dx++;

        // if shift is down than move slower 
        this.speed = keyState.Shift ? PLYR_SLOW_SPD : PLYR_SPD;

        if (keyState.Fire)
            this.fire();

        // Normalize delta x and y 
        // This ensures movement is at the same speed in all directions
        if (this.dx !== 0 && this.dy !== 0) {
            const length = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            this.dx /= length; 
            this.dy /= length;
        }

        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;

        this.handleInv();

        this.applyScreenBounds();
    }

    handleInv() {
      if (this.inv) {
          this.invT++;
          if (this.invT >= this.invDur) {
              this.inv = false; // End invincibility
              this.invT = 0; // Reset timer
          }
      }
    }

    applyScreenBounds() {
        if ((this.x + this.w) >= gameWidth)
            this.x = gameWidth - this.w;
        else if (this.x <= 0)
            this.x = 0;

        if ((this.y + this.h) >= gameHeight)
            this.y = gameHeight - this.h;
        else if (this.y <= 0)
            this.y = 0;
    }

    fire() {
      const currentTime = performance.now();
      const numProjectiles = 2;
      if (currentTime - this.lastFireTime >= this.fireCooldown) {
        for (let i = 0; i < numProjectiles; ++i) {
            const speed = 7;
            const dx = 0;
            const dy = -speed;
            projectileManager.addProjectile((this.x + this.w - 13) + i * 15, this.y, dx, dy, 7, 'red', 'player');
            this.lastFireTime = currentTime;              
        }
      }
    }

    damage() {
        if (!this.inv) {
            this.lives--;
            this.inv = true;
            this.invT = 0;
        }
    }

    draw() {
      if (this.inv) {
        if (frames % 2 === 0) {
          ctx.drawImage(shipSprite, this.x - 11, this.y - 9);
        }
      } else {
        ctx.drawImage(shipSprite, this.x - 11, this.y - 9);
      }
    }
  
    init() {
      this.lives = MAX_LIVES;
      this.inv = false;
      this.x = 190;
      this.y = gameHeight - 25;
    }
}

class Projectile extends Circle {
    constructor(x, y, dx, dy, radius, color, type) {
        super(x, y, radius, color);
        this.dx = dx;
        this.dy = dy;
        this.dead = false;
        this.type = type;  // Type can be "player" or "enemy"
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.isOOB()) {
            this.dead = true;
        }

        if (this.type === "player") {
            this.handlePlayerProjectileCollision();
        } else if (this.type === "enemy") {
            this.handleEnemyProjectileCollision();
        }
    }

    isOOB() {
        return this.x < 0 || this.x > gameWidth || this.y < 0 || this.y > gameHeight;
    }

    handlePlayerProjectileCollision() {
        // Check for collisions with enemies
        for (let i = 0; i < enemyManager.enemies.length; ++i) {
            if (isCircleCircleCollision(enemyManager.enemies[i], this)) {
                enemyManager.enemies[i].damage();
                this.dead = true;
            }
        }
    }

    handleEnemyProjectileCollision() {
        // Check for collisions with the player
        if (isRectCircleCollision(plyr, this)) {
            plyr.damage();
            this.dead = true;
        }
    }

    draw() {
        if (this.type === "player") {
          ctx.drawImage(plyrshotSprite, this.x - 16, this.y - 20);  // Custom draw for player projectiles
        } else if (this.type === "enemy") {
          ctx.drawImage(bulSprite, this.x - 16, this.y - 15);  // Custom draw for enemy projectiles
        }
    }
}

class ProjectileManager {
    constructor() {
        this.projectiles = [];
    }

    addProjectile(x, y, dx, dy, size, color, type) {
        this.projectiles.push(new Projectile(x, y, dx, dy, size, color, type));
    }

    update() {
        for (let i = 0; i < this.projectiles.length; ++i) {
            const proj = this.projectiles[i];
            proj.update();
            if (proj.dead) {
                this.projectiles.splice(i, 1);
                i--; // Adjust the index after removal
            }
        }
    }

    draw() {
        this.projectiles.forEach(proj => proj.draw());
    }

    init() {
        this.projectiles = [];
    }
}


class EnemyManager {
    constructor() {
      this.enemies = [];
    }

    addEnemy(x, y, radius, health, behavior, flipped) {
      /* White as default color for debug */
      this.enemies.push(new Enemy(x, y, radius, 'white', health, behavior, flipped));
    }

    update() {
      this.enemies.forEach((enemy, index) => {
        enemy.update();
        if (enemy.dead) {
          this.enemies.splice(index, 1);
        }
      });
    }

    draw() {
      this.enemies.forEach(enemy => enemy.draw());
    }

    isAllDead() {
      return (this.enemies.length < 1);
    }

    init() {
      this.enemies = [];
    }
}

class Enemy extends Circle {
    constructor(x, y, radius, color, health, behavior, flipped) {
        super(x, y, radius, color);
        this.health = health;
        this.behavior = behavior; // e.g., 'burst' or 'spiral'
        this.angle = 0;
        this.dead = false;
        this.flipped = flipped;
    }

    update() {
      if (this.health < 1) 
        this.dead = true;

      switch (this.behavior) {
      case 'sprial':
          if (frames % 5 === 0) {
            this.spawnSpiralProjectiles();
          }
      break;
      case 'burst':
          if (frames % 60 === 0) {
            this.spawnBurstProjectiles();
          }
      break;
      case 'homing':
          if (frames % 30 === 0) {
            this.spawnHomingProjectiles();
          }
      break;
      default:
          console.log('Not a behavor');
      }
    }

    spawnBurstProjectiles() {
        const numProjectiles = 20; // Number of projectiles in burst
        for (let i = 0; i < numProjectiles; i++) {
            const angle = (i / numProjectiles) * 2 * Math.PI;
            const speed = 4;
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;
            projectileManager.addProjectile(this.x, this.y, dx, dy, 5, 'red', 'enemy');
        }
    }

    spawnSpiralProjectiles() {
      const speed = 4;
      const dx = Math.cos(this.angle) * speed;
      const dy = Math.sin(this.angle) * speed;
      projectileManager.addProjectile(this.x, this.y, dx, dy, 5, 'red', 'enemy');
      if (this.flipped) {
        this.angle -= Math.PI / 10; // step
      } else {
        this.angle += Math.PI / 10; // step
      }
    }

    spawnHomingProjectiles() {
      const speed = 4;
      const angle = Math.atan2(plyr.y - this.y, plyr.x - this.x);
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      projectileManager.addProjectile(this.x, this.y, dx, dy, 5, 'red', 'enemy');
    }

    damage() {
      this.health--;
    }

    draw() {
      ctx.drawImage(enemySprite, this.x - 16, this.y - 16);
      drawText(`HP: ${this.health}`, this.x - this.radius, this.y - 20, 'white', '15px');
    }
}

const plyr = new Player(190, gameHeight-25, 10, 10, 'green');
const enemyManager = new EnemyManager();
const projectileManager = new ProjectileManager();

function isRectCircleCollision(rect, circle) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle.radius;
}

function isCircleCircleCollision(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle1.radius + circle2.radius;
}

function drawText(str, x, y, color, size) {
    ctx.font =`${size} Times New Roman`;
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
}

function initGame() {
    frames = 0;
    isGameWon = false;
    isGameOver = false;
    isPause = false;
    plyr.init();
    enemyManager.init(); // Remove all enemies
    projectileManager.init(); // Remove all projectiles
}

function stageOne() {
    if (frames === 1) {
      enemyManager.addEnemy(20, 120, 10, 10, 'homing', false);
      enemyManager.addEnemy(220, 120, 10, 10, 'homing', false);
      enemyManager.addEnemy(420, 120, 10, 10, 'homing', false);
    }

    if (frames === 600) {
      enemyManager.addEnemy(220, 120, 10, 60, 'sprial', false);
    }

    if (frames === 1000) {
      enemyManager.addEnemy(120, 120, 10, 30, 'burst', false);
      enemyManager.addEnemy(320, 120, 10, 30, 'burst', false);
    }

    if (frames > 1000 && enemyManager.isAllDead()) {
      isGameWon = true;
    }
}

function updateTitle() {
  // TO-DO add easing for a title screen
}

function drawTitle() {
  ctx.fillStyle = "#007ca4"; // color of the hud btw
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(titleSprite, (canvas.width/2)-210, 2);
  drawText("ENTER TO START", (canvas.width/2)-80, canvas.height/2+20, 'white', '20px');
}

function updateGameplay() {
  if (!isPause && !isGameOver) {
    frames++;

    stageOne();
    plyr.update();
    enemyManager.update();
    projectileManager.update();
  }
}

function drawGameplay() {
  ctx.drawImage(spaceSprite, 0, 0);
  plyr.draw();
  enemyManager.draw();
  projectileManager.draw(); 
  ctx.drawImage(hudSprite, gameWidth, 0);
  drawText(`${plyr.lives}`, gameWidth + 35, 30, 'white', '20px');
  ctx.drawImage(shipSprite, gameWidth + 5, 10);
  if (isGameOver) {
    drawText("GAME OVER", gameWidth/2-35, gameHeight/2, 'white', '20px');
    drawText(`PRESS`, gameWidth + 15, 60, 'white', '20px');
    drawText(`ENTER`, gameWidth + 15, 80, 'white', '20px');
  }
  if (isPause)
    drawText("PAUSED", gameWidth/2-20, gameHeight/2, 'white', '20px');
  if (isGameWon)
    drawText("YOU WON", gameWidth/2-120, gameHeight/2, 'yellow', '60px');
}


function update() {
  switch (currentScreen) {
  case gameScreens.TITLE:
      updateTitle();
  break;
  case gameScreens.GAMEPLAY:
      updateGameplay();
  break;
  default:
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  switch (currentScreen) {
  case gameScreens.TITLE:
      drawTitle();
  break;
  case gameScreens.GAMEPLAY:
      drawGameplay();
  break;
  default:
  }
}

function updateDrawFrame() {
  update();
  draw();
  window.requestAnimationFrame(updateDrawFrame);
}

updateDrawFrame();
