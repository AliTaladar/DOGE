import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import Item from '../entities/Item';
import TileMapManager from '../utils/TileMapManager';
import gameState from '../utils/GameState';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    
    // Game objects
    this.player = null;
    this.enemies = null;
    this.items = null;
    this.tilemap = null;
    
    // UI elements
    this.scoreText = null;
    this.healthBar = null;
    this.levelText = null;
    
    // Game state
    this.isPaused = false;
    this.levelComplete = false;
  }
  
  preload() {
    // Assets are now loaded in PreloaderScene
  }
  
  create() {
    // Reset game state
    gameState.reset();
    
    // Create tile map
    this.tilemap = new TileMapManager(this);
    
    try {
      // Try to create the map from the loaded tilemap
      this.tilemap
        .createMap('level1', 'tiles')
        .createLayers();
    } catch (err) {
      console.error('Error loading tilemap, using fallback:', err);
      // Fall back to a procedurally generated map
      this.tilemap.createFallbackMap(25, 20);
    }
    
    // Create physics groups
    this.createGroups();
    
    // Create player
    this.createPlayer();
    
    // Create enemies
    this.createEnemies();
    
    // Set up collisions
    this.setupCollisions();
    
    // Create UI
    this.createUI();
    
    // Create cameras
    this.setupCamera();
    
    // Create input handlers
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Add pause functionality
    this.input.keyboard.on('keydown-P', () => {
      this.togglePause();
    });
    
    // Add escape for menu
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }
  
  update(time, delta) {
    if (this.isPaused || this.levelComplete) return;
    
    // Update player
    if (this.player) {
      this.player.update(time, this.cursors);
    }
    
    // Update enemies
    this.enemies.getChildren().forEach(enemy => {
      enemy.update(time, delta);
    });
    
    // Check for level completion
    if (gameState.isLevelComplete() && !this.levelComplete) {
      this.levelComplete = true;
      this.showLevelComplete();
    }
    
    // Update UI
    this.updateUI();
  }
  
  createGroups() {
    // Create enemies group
    this.enemies = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true
    });
    
    // Create items group
    this.items = this.physics.add.group({
      classType: Item,
      runChildUpdate: false
    });
    
    // Create particle manager
    this.particles = this.add.particles('bullet');
  }
  
  createPlayer() {
    // Find player spawn point from map
    let spawnPoint = { x: 400, y: 300 }; // Default spawn point
    
    // Try to find player spawn from map objects
    const playerSpawn = this.tilemap.findObjectsByType('playerSpawn')[0];
    if (playerSpawn) {
      spawnPoint = {
        x: playerSpawn.x,
        y: playerSpawn.y
      };
    }
    
    // Create player at spawn point
    this.player = new Player(this, spawnPoint.x, spawnPoint.y);
  }
  
  createEnemies() {
    // Find enemy spawn points from map
    const enemySpawns = this.tilemap.findObjectsByType('enemySpawn');
    
    // If no spawn points defined, create enemies at random positions
    if (enemySpawns.length === 0) {
      for (let i = 0; i < 5 + (gameState.level * 2); i++) {
        const x = Phaser.Math.Between(100, 700);
        const y = Phaser.Math.Between(100, 500);
        this.createEnemy(x, y);
      }
    } else {
      // Create enemies at defined spawn points
      enemySpawns.forEach(spawn => {
        const enemyType = spawn.properties?.find(prop => prop.name === 'type')?.value || 'basic';
        this.createEnemy(spawn.x, spawn.y, enemyType);
      });
    }
    
    // Update total enemies count in game state
    gameState.setTotalEnemies(this.enemies.getLength());
  }
  
  createEnemy(x, y, type = 'basic') {
    // Create enemy with specified type
    const enemy = new Enemy(this, x, y, type);
    
    // Add to enemies group
    this.enemies.add(enemy);
    
    // Set player as target
    enemy.setTarget(this.player);
    
    return enemy;
  }
  
  setupCollisions() {
    // Set up map collisions
    this.tilemap.setupColliders(this.player, this.enemies, this.items);
    
    // Player bullets hit enemies
    this.physics.add.collider(
      this.player.getBullets(),
      this.enemies,
      this.handleBulletEnemyCollision,
      null,
      this
    );
    
    // Enemies hit player
    this.physics.add.collider(
      this.player,
      this.enemies,
      this.handlePlayerEnemyCollision,
      null,
      this
    );
    
    // Player collects items
    this.physics.add.overlap(
      this.player,
      this.items,
      this.handleItemCollection,
      null,
      this
    );
  }
  
  createUI() {
    // Create score text
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);
    
    // Create health bar
    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0);
    this.healthBar.setDepth(100);
    
    // Health icon
    this.healthIcon = this.add.image(20, 60, 'ui-heart');
    this.healthIcon.setScrollFactor(0);
    this.healthIcon.setDepth(100);
    this.healthIcon.setScale(0.8);
    
    // Level text
    this.levelText = this.add.text(20, 90, 'Level: 1', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.levelText.setScrollFactor(0);
    this.levelText.setDepth(100);
    
    // Update UI initially
    this.updateUI();
  }
  
  setupCamera() {
    // Set world bounds based on map size
    if (this.tilemap.map) {
      const mapWidth = this.tilemap.map.widthInPixels;
      const mapHeight = this.tilemap.map.heightInPixels;
      this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    } else {
      this.physics.world.setBounds(0, 0, 800, 600);
    }
    
    // Set camera to follow player
    this.cameras.main.setBounds(0, 0, 
      this.physics.world.bounds.width, 
      this.physics.world.bounds.height);
    
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2);
  }
  
  handleBulletEnemyCollision(bullet, enemy) {
    // Deactivate bullet
    bullet.setActive(false);
    bullet.setVisible(false);
    
    // Enemy takes damage
    const score = enemy.takeDamage(20);
    
    // If enemy was defeated, add score
    if (score) {
      gameState.incrementScore(score);
      gameState.enemyDefeated();
      
      // Chance to drop item
      if (Math.random() < 0.3) {
        this.dropItem(enemy.x, enemy.y);
      }
    }
  }
  
  handlePlayerEnemyCollision(player, enemy) {
    // Player takes damage on collision with enemy
    const health = player.takeDamage(enemy.damage);
    
    // Update health in game state
    gameState.setHealth(health);
    
    // Game over if player has no health
    if (health <= 0) {
      this.handleGameOver();
    }
  }
  
  handleItemCollection(player, item) {
    const { type, value } = item.collect();
    
    // Handle different item types
    switch(type) {
      case 'health':
        gameState.updateHealth(value);
        break;
      case 'ammo':
        // Ammo not implemented in current version
        break;
      case 'weapon':
        gameState.upgradeWeapon();
        break;
      case 'coin':
      default:
        gameState.incrementScore(value);
    }
    
    gameState.itemCollected();
  }
  
  dropItem(x, y) {
    // Determine item type
    const rand = Math.random();
    let type = 'coin';
    
    if (rand < 0.1) {
      type = 'weapon';
    } else if (rand < 0.3) {
      type = 'health';
    } else if (rand < 0.5) {
      type = 'ammo';
    }
    
    // Create and add the item
    const item = new Item(this, x, y, type);
    this.items.add(item);
  }
  
  updateUI() {
    // Update score text
    this.scoreText.setText(`Score: ${gameState.score}`);
    
    // Update health bar
    this.healthBar.clear();
    
    // Health bar background
    this.healthBar.fillStyle(0x222222, 0.8);
    this.healthBar.fillRect(35, 50, 150, 20);
    
    // Health bar fill
    const healthPercent = gameState.playerHealth / gameState.maxHealth;
    
    // Change color based on health amount
    if (healthPercent > 0.6) {
      this.healthBar.fillStyle(0x00ff00, 1);
    } else if (healthPercent > 0.3) {
      this.healthBar.fillStyle(0xffff00, 1);
    } else {
      this.healthBar.fillStyle(0xff0000, 1);
    }
    
    this.healthBar.fillRect(35, 50, 150 * healthPercent, 20);
    
    // Update level text
    this.levelText.setText(`Level: ${gameState.level}`);
  }
  
  togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      // Pause physics and animations
      this.physics.pause();
      this.anims.pauseAll();
      
      // Show pause text
      this.pauseText = this.add.text(
        this.cameras.main.midPoint.x,
        this.cameras.main.midPoint.y,
        'PAUSED\nPress P to resume',
        {
          font: 'bold 32px Arial',
          fill: '#ffffff',
          align: 'center',
          stroke: '#000000',
          strokeThickness: 6
        }
      ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
    } else {
      // Resume physics and animations
      this.physics.resume();
      this.anims.resumeAll();
      
      // Remove pause text
      if (this.pauseText) this.pauseText.destroy();
    }
    
    // Update game state
    gameState.setPaused(this.isPaused);
  }
  
  showLevelComplete() {
    // Display level complete message
    const levelCompleteText = this.add.text(
      this.cameras.main.midPoint.x,
      this.cameras.main.midPoint.y,
      'LEVEL COMPLETE!\nScore: ' + gameState.score,
      {
        font: 'bold 32px Arial',
        fill: '#ffffff',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
    
    // Wait a moment then start next level or go to victory screen
    this.time.delayedCall(3000, () => {
      if (gameState.level < 3) {
        // Go to next level
        gameState.nextLevel();
        this.scene.restart();
      } else {
        // Game complete
        this.scene.start('VictoryScene');
      }
    });
  }
  
  handleGameOver() {
    // Set game over state
    gameState.gameOver = true;
    
    // Display game over message
    const gameOverText = this.add.text(
      this.cameras.main.midPoint.x,
      this.cameras.main.midPoint.y,
      'GAME OVER\nScore: ' + gameState.score + '\nHigh Score: ' + gameState.highScore,
      {
        font: 'bold 32px Arial',
        fill: '#ffffff',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
    
    // Wait a moment then return to menu
    this.time.delayedCall(3000, () => {
      this.scene.start('MenuScene');
    });
  }
}
