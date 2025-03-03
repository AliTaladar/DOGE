import Phaser from 'phaser';

export default class PreloaderScene extends Phaser.Scene {
  constructor() {
    super('PreloaderScene');
    this.loadingBar = null;
    this.progressBar = null;
    this.loadingText = null;
  }
  
  preload() {
    // Create loading graphics
    this.createLoadingGraphics();
    
    // Handle loading events
    this.setupLoadingEvents();
    
    // Load assets with fallbacks
    this.loadGameAssets();
  }
  
  create() {
    // Start the menu scene after loading
    this.scene.start('MenuScene');
  }
  
  createLoadingGraphics() {
    // Create a nice loading screen
    this.cameras.main.setBackgroundColor('#000000');
    
    // Loading text
    this.loadingText = this.add.text(
      this.cameras.main.width / 2, 
      this.cameras.main.height / 2 - 50,
      'Loading Game...', 
      { 
        font: '24px Arial',
        fill: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Create loading bar container
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x222222, 0.8);
    this.loadingBar.fillRect(
      this.cameras.main.width / 2 - 160,
      this.cameras.main.height / 2 - 25,
      320,
      50
    );
    
    // Create the progress bar
    this.progressBar = this.add.graphics();
  }
  
  setupLoadingEvents() {
    // Register loading events
    this.load.on('progress', (value) => {
      // Update progress bar
      this.progressBar.clear();
      this.progressBar.fillStyle(0x3498db, 1);
      this.progressBar.fillRect(
        this.cameras.main.width / 2 - 150,
        this.cameras.main.height / 2 - 15,
        300 * value,
        30
      );
      
      // Update loading text with percentage
      const percentage = Math.round(value * 100) + '%';
      this.loadingText.setText('Loading Game... ' + percentage);
    });
    
    this.load.on('complete', () => {
      // Clean up loading graphics
      this.progressBar.destroy();
      this.loadingBar.destroy();
      this.loadingText.destroy();
    });
    
    this.load.on('loaderror', (file) => {
      console.error(`Error loading file: ${file.key}`);
      
      // Attempt to load a fallback if available
      if (this.fallbacks[file.key]) {
        this.load.image(file.key, this.fallbacks[file.key]);
        this.load.start(); // Restart loader for this asset
      }
    });
  }
  
  loadGameAssets() {
    // Setup fallbacks for critical assets
    this.fallbacks = {
      'tiles': 'https://labs.phaser.io/assets/tilemaps/tiles/catastrophi_tiles_16.png',
      'player': 'https://labs.phaser.io/assets/sprites/phaser-dude.png',
      'enemy': 'https://labs.phaser.io/assets/sprites/space-baddie.png',
      'bullet': 'https://labs.phaser.io/assets/sprites/bullet.png'
    };
    
    // Try to load local assets, with fallbacks if they fail
    try {
      // Load tileset - explicitly set the key to match what's in the tilemap
      this.load.image('tiles', '/assets/tilesets/dungeon_tiles.png');
      
      // Output debug information
      console.log('Loading tileset image: /assets/tilesets/dungeon_tiles.png');
      
      // Load tilemap
      this.load.tilemapTiledJSON('level1', '/assets/tilemaps/level1.json');
      
      // Load sprites
      this.load.spritesheet('player', '/assets/sprites/player.png', { 
        frameWidth: 32, 
        frameHeight: 32 
      });
      
      this.load.spritesheet('enemy', '/assets/sprites/enemy.png', { 
        frameWidth: 32, 
        frameHeight: 32 
      });
      
      this.load.image('bullet', '/assets/sprites/bullet.png');
      
      // Load sound effects
      this.loadSoundAssets();
      
      // Load item sprites with fallbacks
      try {
        this.load.spritesheet('item-coin', '/assets/sprites/coin.png', { 
          frameWidth: 16, 
          frameHeight: 16 
        });
      } catch (e) {
        this.load.spritesheet('item-coin', 'https://labs.phaser.io/assets/sprites/coin.png', { 
          frameWidth: 16, 
          frameHeight: 16 
        });
      }
      
      try {
        this.load.spritesheet('item-health', '/assets/sprites/health.png', { 
          frameWidth: 16, 
          frameHeight: 16 
        });
      } catch (e) {
        this.load.image('item-health', 'https://labs.phaser.io/assets/sprites/healthpack.png');
      }
      
      try {
        this.load.spritesheet('item-ammo', '/assets/sprites/ammo.png', { 
          frameWidth: 16, 
          frameHeight: 16 
        });
      } catch (e) {
        this.load.image('item-ammo', 'https://labs.phaser.io/assets/sprites/bullet.png');
      }
      
      try {
        this.load.spritesheet('item-weapon', '/assets/sprites/weapon.png', { 
          frameWidth: 16, 
          frameHeight: 16 
        });
      } catch (e) {
        this.load.image('item-weapon', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
      }
      
      // Load UI elements
      try {
        this.load.image('ui-heart', '/assets/ui/heart.png');
      } catch (e) {
        this.load.image('ui-heart', 'https://labs.phaser.io/assets/sprites/heart.png');
      }
      
      // Load menu assets with fallbacks
      try {
        this.load.image('title-bg', '/assets/ui/background.png');
      } catch (e) {
        // Will create a gradient background in code if this fails
      }
      
      try {
        this.load.image('play-button', '/assets/ui/button.png');
      } catch (e) {
        // Will create buttons programmatically if this fails
      }
      
      try {
        this.load.image('options-button', '/assets/ui/button.png');
      } catch (e) {
        // Will create buttons programmatically if this fails
      }
      
      // Load logo image
      try {
        this.load.image('logo', '/assets/ui/logo.png');
      } catch (e) {
        // Will use text if this fails
      }
    } catch (error) {
      console.error("Error loading assets:", error);
      // Fallback to default assets if needed
      this.loadFallbackAssets();
    }
  }
  
  loadSoundAssets() {
    // Load sound effects with proper error handling
    try {
      // Load victory sounds
      this.load.audio('victory1', '/assets/sounds/victory/victory1.mp3');
      this.load.audio('victory2', '/assets/sounds/victory/victory2.mp3');
      
      // Load defeat sounds
      this.load.audio('defeat1', '/assets/sounds/defeat/defeat1.mp3');
      this.load.audio('defeat2', '/assets/sounds/defeat/defeat2.mp3');
      
      // Load misc sounds
      this.load.audio('shooting', '/assets/sounds/misc/shooting.mp3');
      
      console.log('Sound assets loaded successfully');
    } catch (error) {
      console.error('Error loading sound assets:', error);
    }
  }
  
  loadFallbackAssets() {
    // Load essential fallback assets from Phaser examples
    this.load.image('tiles', this.fallbacks['tiles']);
    this.load.image('player', this.fallbacks['player']);
    this.load.image('enemy', this.fallbacks['enemy']);
    this.load.image('bullet', this.fallbacks['bullet']);
  }
}
