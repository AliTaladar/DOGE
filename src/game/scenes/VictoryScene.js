import Phaser from 'phaser';
import gameState from '../utils/GameState';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }
  
  create() {
    // Background color
    this.cameras.main.setBackgroundColor('#000000');
    
    // Victory title
    const title = this.add.text(400, 150, 'VICTORY!', {
      fontFamily: 'Arial',
      fontSize: 64,
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Add some animation to the title
    this.tweens.add({
      targets: title,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // Score info
    this.add.text(400, 250, `Final Score: ${gameState.score}`, {
      fontFamily: 'Arial',
      fontSize: 32,
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    this.add.text(400, 300, `High Score: ${gameState.highScore}`, {
      fontFamily: 'Arial',
      fontSize: 28,
      color: '#ffff00',
      align: 'center'
    }).setOrigin(0.5);
    
    // Enemies defeated
    this.add.text(400, 350, `Enemies Defeated: ${gameState.enemies.defeated}`, {
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Items collected
    this.add.text(400, 390, `Items Collected: ${gameState.items.collected}`, {
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Create play again button
    const playAgainButton = this.add.text(400, 460, 'PLAY AGAIN', {
      fontFamily: 'Arial',
      fontSize: 28,
      color: '#ffffff',
      backgroundColor: '#204060',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    playAgainButton.setInteractive({ useHandCursor: true })
      .on('pointerover', () => playAgainButton.setTint(0x66aaff))
      .on('pointerout', () => playAgainButton.clearTint())
      .on('pointerdown', () => {
        this.scene.start('GameScene');
      });
    
    // Create menu button
    const menuButton = this.add.text(400, 520, 'MAIN MENU', {
      fontFamily: 'Arial',
      fontSize: 28,
      color: '#ffffff',
      backgroundColor: '#204060',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    menuButton.setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuButton.setTint(0x66aaff))
      .on('pointerout', () => menuButton.clearTint())
      .on('pointerdown', () => {
        this.scene.start('MenuScene');
      });
    
    // Add particles for celebration
    const particles = this.add.particles('bullet');
    
    const emitter = particles.createEmitter({
      speed: { min: 100, max: 200 },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 2000,
      frequency: 50,
      tint: [ 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff ]
    });
    
    // Emit particles along the top of the screen
    emitter.setPosition(400, 0);
    emitter.setEmitZone({
      type: 'edge',
      source: new Phaser.Geom.Rectangle(0, 0, 800, 10),
      quantity: 50
    });
  }
  
  update() {
    // Add any update logic here if needed
  }
}
