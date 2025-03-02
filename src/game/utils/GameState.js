// A singleton class to manage global game state
class GameState {
  constructor() {
    if (GameState.instance) {
      return GameState.instance;
    }
    
    // Initialize game state
    this._state = {
      score: 0,
      highScore: this.loadHighScore(),
      level: 1,
      playerHealth: 100,
      maxHealth: 100,
      playerWeapon: 1,
      gameOver: false,
      paused: false,
      enemies: {
        defeated: 0,
        total: 0
      },
      items: {
        collected: 0
      }
    };
    
    // Save the instance
    GameState.instance = this;
  }

  // Getters
  get score() { return this._state.score; }
  get highScore() { return this._state.highScore; }
  get level() { return this._state.level; }
  get playerHealth() { return this._state.playerHealth; }
  get maxHealth() { return this._state.maxHealth; }
  get playerWeapon() { return this._state.playerWeapon; }
  get gameOver() { return this._state.gameOver; }
  
  setGameOver(value) {
    this._state.gameOver = value;
    return this._state.gameOver;
  }
  
  get paused() { return this._state.paused; }
  get enemies() { return this._state.enemies; }
  get items() { return this._state.items; }
  
  reset() {
    this._state.score = 0;
    this._state.level = 1;
    this._state.playerHealth = 100;
    this._state.playerWeapon = 1;
    this._state.gameOver = false;
    this._state.paused = false;
    this._state.enemies = {
      defeated: 0,
      total: 0
    };
    this._state.items = {
      collected: 0
    };
    
    return this;
  }
  
  resetForLevelTransition() {
    // Keep the score and level, but reset level-specific state
    this._state.playerHealth = 100;
    this._state.gameOver = false;
    this._state.paused = false;
    this._state.enemies = {
      defeated: 0,
      total: 0
    };
    this._state.items = {
      collected: 0
    };
    
    return this;
  }
  
  incrementScore(points) {
    this._state.score += points;
    
    // Update high score if needed
    if (this._state.score > this._state.highScore) {
      this._state.highScore = this._state.score;
      this.saveHighScore();
    }
    
    return this._state.score;
  }
  
  loadHighScore() {
    const storedScore = localStorage.getItem('sundai-shooter-highscore');
    return storedScore ? parseInt(storedScore, 10) : 0;
  }
  
  saveHighScore() {
    localStorage.setItem('sundai-shooter-highscore', this._state.highScore.toString());
  }
  
  setLevel(level) {
    this._state.level = level;
    return this;
  }
  
  nextLevel() {
    this._state.level++;
    return this._state.level;
  }
  
  updateHealth(value) {
    this._state.playerHealth = Math.min(Math.max(0, this._state.playerHealth + value), this._state.maxHealth);
    
    if (this._state.playerHealth <= 0) {
      this.setGameOver(true);
    }
    
    return this._state.playerHealth;
  }
  
  setHealth(value) {
    this._state.playerHealth = Math.min(Math.max(0, value), this._state.maxHealth);
    
    if (this._state.playerHealth <= 0) {
      this.setGameOver(true);
    }
    
    return this._state.playerHealth;
  }
  
  upgradeWeapon() {
    this._state.playerWeapon = Math.min(this._state.playerWeapon + 1, 3);
    return this._state.playerWeapon;
  }
  
  enemyDefeated() {
    this._state.enemies.defeated++;
    return this._state.enemies;
  }
  
  setTotalEnemies(count) {
    this._state.enemies.total = count;
    return this._state.enemies;
  }
  
  itemCollected() {
    this._state.items.collected++;
    return this._state.items;
  }
  
  isLevelComplete() {
    return this._state.enemies.defeated >= this._state.enemies.total;
  }
  
  togglePause() {
    this._state.paused = !this._state.paused;
    return this._state.paused;
  }
  
  setPaused(value) {
    this._state.paused = value;
    return this._state.paused;
  }
}

// Create the instance without freezing it
const gameState = new GameState();

export default gameState;
