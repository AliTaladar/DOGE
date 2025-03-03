import Phaser from 'phaser';
import gameState from '../utils/GameState';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    // Assets are now loaded in PreloaderScene
  }

  create() {
    // Reset game state
    gameState.reset();

    // Start menu music
    try {
      // Stop any game music that might be playing
      if (this.sound.get('game_music')) {
        this.sound.stopByKey('game_music');
      }
      
      // Play menu music if not already playing
      if (!this.sound.get('main_menu_music') || !this.sound.get('main_menu_music').isPlaying) {
        this.sound.play('main_menu_music', {
          loop: true,
          volume: 0.6
        });
      }
    } catch (err) {
      console.warn('Error playing menu music:', err.message);
    }

    try {
      // Add title background
      this.add.image(400, 300, 'title-bg').setScale(1);
    } catch (err) {
      // If image fails to load, create a gradient background
      this.createGradientBackground();
    }

    // Logo or title text
    try {
      this.add.image(400, 95, 'logo').setScale(0.8);
    } catch (err) {
      // If logo fails to load, use text instead
      this.add.text(400, 100, 'DOGE SHOOTER', {
        fontFamily: 'Arial',
        fontSize: 64,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center'
      }).setOrigin(0.5);
    }
    
    // Create menu items
    this.createMenuItems();

    // Add high score display
    this.add.text(400, 520, `High Score: ${gameState.highScore}`, {
      fontFamily: 'Arial',
      fontSize: 24,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Version text
    this.add.text(780, 580, 'v1.0.0', {
      fontFamily: 'Arial',
      fontSize: 12,
      color: '#aaaaaa'
    }).setOrigin(1, 1);
  }

  createGradientBackground() {
    // Create a gradient background as fallback
    const graphics = this.add.graphics();

    // Create a gradient rectangle
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Top color (dark blue)
    graphics.fillGradientStyle(0x001428, 0x001428, 0x0a2846, 0x0a2846, 1);
    graphics.fillRect(0, 0, width, height / 2);

    // Bottom color (darker blue)
    graphics.fillGradientStyle(0x0a2846, 0x0a2846, 0x001428, 0x001428, 1);
    graphics.fillRect(0, height / 2, width, height / 2);

    // Add some stars
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);

      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(x, y, size);
    }
  }

  createMenuItems() {
    // Create play button
    const playButton = this.createButton(400, 250, 'PLAY', () => {
      this.scene.start('GameScene');
    });

    // Create options button
    const optionsButton = this.createButton(400, 330, 'OPTIONS', () => {
      this.scene.start('OptionsScene');
    });

    // Create controls button
    const controlsButton = this.createButton(400, 410, 'CONTROLS', () => {
      this.showControls();
    });
  }

  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);

    // Button background
    let buttonBg;
    try {
      buttonBg = this.add.image(0, 0, 'play-button').setScale(1);
    } catch (err) {
      // If button image fails, create a rectangle
      buttonBg = this.add.rectangle(0, 0, 200, 50, 0x204060, 0.8);
      buttonBg.setStrokeStyle(2, 0x3498db);
    }

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Add to container
    button.add([buttonBg, buttonText]);

    // Make button interactive
    button.setSize(buttonBg.width, buttonBg.height);
    button.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        buttonBg.setTint(0x66aaff);
        buttonText.setScale(1.1);
      })
      .on('pointerout', () => {
        buttonBg.clearTint();
        buttonText.setScale(1);
      })
      .on('pointerdown', () => {
        buttonBg.setTint(0x3377dd);
        buttonText.setScale(0.9);
      })
      .on('pointerup', () => {
        buttonBg.clearTint();
        buttonText.setScale(1);
        callback();
      });

    return button;
  }

  showControls() {
    // Create a controls overlay
    const overlay = this.add.container(400, 300);

    // Background
    const bg = this.add.rectangle(0, 0, 500, 350, 0x000000, 0.8);
    bg.setStrokeStyle(2, 0x3498db);

    // Title
    const title = this.add.text(0, -150, 'CONTROLS', {
      fontFamily: 'Arial',
      fontSize: 28,
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Controls text
    const controlsText = this.add.text(0, -50,
      'Arrow Keys: Move character\n\n' +
      'Space: Shoot\n\n' +
      'P: Pause game\n\n' +
      'ESC: Return to menu', {
      fontFamily: 'Arial',
      fontSize: 20,
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Close button
    const closeButton = this.add.text(0, 100, 'CLOSE', {
      fontFamily: 'Arial',
      fontSize: 20,
      color: '#ffffff',
      backgroundColor: '#204060',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    closeButton.setInteractive({ useHandCursor: true })
      .on('pointerover', () => closeButton.setTint(0x66aaff))
      .on('pointerout', () => closeButton.clearTint())
      .on('pointerdown', () => {
        overlay.destroy();
      });

    // Add everything to the overlay
    overlay.add([bg, title, controlsText, closeButton]);
  }
}
