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
    // Reset game state, but only if coming from another scene or starting a new game
    // If it's a level transition, level management is handled in showLevelComplete
    // Check if this is a scene restart after level completion
    if (this.scene.settings.data && this.scene.settings.data.levelTransition) {
      // This is a level transition, no need to reset everything
      // Just ensure the level complete flag is reset
      this.levelComplete = false;
    } else {
      // This is a fresh game start (not a level transition)
      gameState.reset();
      this.levelComplete = false;
    }
    
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
    
    // Listen for player-died event
    this.events.on('player-died', this.handleGameOver, this);
  }
  
  update(time, delta) {
    if (this.isPaused) return;
    
    // Update player even when level is complete
    if (this.player) {
      this.player.update(time, this.cursors);
    }
    
    // Only update enemies and check level completion if level is not already complete
    if (!this.levelComplete) {
      // Update enemies
      this.enemies.getChildren().forEach(enemy => {
        enemy.update(time, delta);
      });
      
      // Check for level completion
      if (gameState.isLevelComplete() && gameState.enemies.total > 0) {
        console.log("Level complete! Defeated: " + gameState.enemies.defeated + ", Total: " + gameState.enemies.total);
        this.levelComplete = true;
        this.showLevelComplete();
      }
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
    
    // Particles will be created on demand when needed
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
      // Minimum safe distance from player (in pixels)
      const MIN_SAFE_DISTANCE = 150;
      
      // Get player position
      const playerX = this.player.x;
      const playerY = this.player.y;
      
      let attempts = 0;
      const maxAttempts = 50; // Prevent infinite loops
      
      for (let i = 0; i < 5 + (gameState.level * 2); i++) {
        let x, y;
        let distanceFromPlayer;
        let validSpawnFound = false;
        
        // Try to find a position that's not too close to the player
        while (!validSpawnFound && attempts < maxAttempts) {
          x = Phaser.Math.Between(100, 700);
          y = Phaser.Math.Between(100, 500);
          
          // Calculate distance from player
          distanceFromPlayer = Phaser.Math.Distance.Between(x, y, playerX, playerY);
          
          // If distance is acceptable, we can use this position
          if (distanceFromPlayer >= MIN_SAFE_DISTANCE) {
            validSpawnFound = true;
          }
          
          attempts++;
        }
        
        // Create enemy at this position
        this.createEnemy(x, y);
        
        // Reset attempts counter for next enemy
        attempts = 0;
      }
    } else {
      // Create enemies at defined spawn points, but only if they're not too close to the player
      const MIN_SAFE_DISTANCE = 150;
      const playerX = this.player.x;
      const playerY = this.player.y;
      
      enemySpawns.forEach(spawn => {
        const enemyType = spawn.properties?.find(prop => prop.name === 'type')?.value || 'basic';
        
        // Calculate distance from player
        const distanceFromPlayer = Phaser.Math.Distance.Between(spawn.x, spawn.y, playerX, playerY);
        
        // Only spawn if distance is acceptable or we have explicit spawn points
        // (We don't want to completely eliminate spawn points from the map, but we'll log a warning)
        if (distanceFromPlayer >= MIN_SAFE_DISTANCE) {
          this.createEnemy(spawn.x, spawn.y, enemyType);
        } else {
          console.warn(`Enemy spawn at (${spawn.x}, ${spawn.y}) is too close to player. Finding alternative position...`);
          
          // Find an alternative position nearby that's far enough from the player
          let newX = spawn.x;
          let newY = spawn.y;
          let validSpawnFound = false;
          let attempts = 0;
          const maxAttempts = 20;
          
          while (!validSpawnFound && attempts < maxAttempts) {
            // Try to move the spawn point away from the player
            const angle = Math.random() * Math.PI * 2; // Random direction
            const distance = MIN_SAFE_DISTANCE + Math.random() * 50; // Random distance beyond minimum
            
            newX = spawn.x + Math.cos(angle) * distance;
            newY = spawn.y + Math.sin(angle) * distance;
            
            // Check if new position is far enough from player
            const newDistance = Phaser.Math.Distance.Between(newX, newY, playerX, playerY);
            
            if (newDistance >= MIN_SAFE_DISTANCE) {
              validSpawnFound = true;
            }
            
            attempts++;
          }
          
          if (validSpawnFound) {
            console.log(`Relocated enemy to (${newX}, ${newY})`);
            this.createEnemy(newX, newY, enemyType);
          } else {
            // Use original position as fallback if we can't find a better one
            // This prevents no enemies from spawning at all
            console.log(`Could not find alternative position, using original with warning`);
            this.createEnemy(spawn.x, spawn.y, enemyType);
          }
        }
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
    
    // Player bullets hit walls
    if (this.tilemap.layers && this.tilemap.layers.walls) {
      // Using tilemap walls
      this.physics.add.collider(
        this.player.getBullets(),
        this.tilemap.layers.walls,
        this.handleBulletWallCollision,
        null,
        this
      );
    } else if (this.tilemap.emergencyGraphics && this.tilemap.emergencyGraphics.length > 0) {
      // Using emergency graphics walls
      this.physics.add.collider(
        this.player.getBullets(),
        this.tilemap.emergencyGraphics,
        this.handleBulletWallCollision,
        null,
        this
      );
    }
    
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
  
  handleBulletWallCollision(bullet, wall) {
    // Deactivate bullet when it hits a wall
    bullet.setActive(false);
    bullet.setVisible(false);
    
    // Optional: Create a small particle effect
    try {
      // Create particles at the bullet's position to show impact
      const particles = this.add.particles(bullet.x, bullet.y, 'bullet', {
        speed: 50,
        scale: { start: 0.5, end: 0 },
        blendMode: 'ADD',
        lifespan: 200,
        quantity: 5
      });
      
      // Auto-destroy particles after they're done
      this.time.delayedCall(300, () => {
        particles.destroy();
      });
    } catch (err) {
      console.warn('Error creating bullet impact effect:', err.message);
      // Continue even if particle effect fails
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
        // Reset level-specific state while keeping level progress
        gameState.resetForLevelTransition();
        this.scene.restart({ levelTransition: true });
      } else {
        // Game complete
        this.scene.start('VictoryScene');
      }
    });
  }
  
  handleGameOver() {
    // Set game over state
    gameState.setGameOver(true);
    
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
