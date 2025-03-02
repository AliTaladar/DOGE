import Phaser from 'phaser';

export default class Item extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'coin') {
    // Use the appropriate sprite based on item type
    super(scene, x, y, `item-${type}`);
    
    // Add item to the scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Item properties
    this.type = type;
    this.setupType(type);
    
    // Common item setup
    this.setDepth(3);
    this.setBounce(0.2);
    this.setCollideWorldBounds(true);
    
    // Create animation
    this.createAnimation();
    
    // Start playing animation
    this.anims.play(`item-${this.type}-spin`);
  }
  
  setupType(type) {
    // Configure properties based on item type
    switch(type) {
      case 'health':
        this.value = 20; // Health points restored
        this.setTint(0xff5555);
        break;
      case 'ammo':
        this.value = 10; // Ammo added
        this.setTint(0x5555ff);
        break;
      case 'weapon':
        this.value = 1; // Weapon upgrade level
        this.setTint(0x55ff55);
        break;
      case 'coin':
      default:
        this.value = 10; // Score value
        this.setTint(0xffff00);
    }
  }
  
  createAnimation() {
    const anims = this.scene.anims;
    const type = this.type;
    
    // Create item animation if it doesn't exist
    if (!anims.exists(`item-${type}-spin`)) {
      anims.create({
        key: `item-${type}-spin`,
        frames: anims.generateFrameNumbers(`item-${type}`, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }
  }
  
  collect() {
    // Play collection animation
    this.disableBody(true, true);
    
    try {
      // Create collection effect using modern Phaser 3.60+ particle API
      const particleConfig = {
        x: this.x,
        y: this.y,
        speed: 50,
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 500,
        blendMode: 'ADD',
        emitting: false
      };
      
      // Create a particle emitter manager and emitter
      const particles = this.scene.add.particles(0, 0, `item-${this.type}`, {
        emitting: false
      });
      
      // Create the emitter with our configuration
      const emitter = particles.createEmitter(particleConfig);
      
      // Explode particles at the item's location
      emitter.explode(5, this.x, this.y);
      
      // Destroy particles after animation completes
      this.scene.time.delayedCall(500, () => {
        particles.destroy();
      });
    } catch (error) {
      // Log error but don't crash the game
      console.error('Error creating item collection particles:', error);
    }
    
    return {
      type: this.type,
      value: this.value
    };
  }
}
