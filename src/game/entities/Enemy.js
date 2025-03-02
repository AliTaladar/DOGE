import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'basic') {
    super(scene, x, y, 'enemy');
    
    // Add enemy to the scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Enemy properties based on type
    this.type = type;
    this.setupType(type);
    
    // Common enemy setup
    this.setBounce(0);
    this.setCollideWorldBounds(true);
    this.setImmovable(false);
    this.setDepth(5);
    
    // Target for following player
    this.target = null;
    
    // Initialize enemy animations
    this.createAnimations();
    
    // Try to play animation, or safely handle missing frames
    try {
      this.anims.play(`enemy-${this.type}-idle`);
    } catch (err) {
      console.warn(`Enemy animation not available: ${err.message}`);
      // No animation needed, we'll just use the static image
    }
  }
  
  setupType(type) {
    // Set properties based on enemy type
    switch(type) {
      case 'fast':
        this.health = 20;
        this.moveSpeed = 150;
        this.damage = 10;
        this.scoreValue = 15;
        this.setScale(0.8);
        this.setTint(0xff9999);
        break;
      case 'strong':
        this.health = 80;
        this.moveSpeed = 60;
        this.damage = 30;
        this.scoreValue = 25;
        this.setScale(1.2);
        this.setTint(0x9999ff);
        break;
      case 'boss':
        this.health = 200;
        this.moveSpeed = 40;
        this.damage = 50;
        this.scoreValue = 100;
        this.setScale(2);
        this.setTint(0xff99ff);
        break;
      case 'basic':
      default:
        this.health = 40;
        this.moveSpeed = 80;
        this.damage = 20;
        this.scoreValue = 10;
        this.setScale(1);
    }
  }
  
  createAnimations() {
    try {
      const anims = this.scene.anims;
      const type = this.type;
      
      // Check if the enemy texture exists and has frames
      const textureManager = this.scene.textures;
      if (!textureManager.exists('enemy')) {
        console.warn('Enemy texture does not exist, skipping animations');
        return;
      }
      
      const frames = textureManager.get('enemy').getFrameNames();
      if (!frames || frames.length === 0) {
        console.warn('Enemy texture has no frames, using single frame animations');
        
        // Create single frame animations as fallback
        if (!anims.exists(`enemy-${type}-idle`)) {
          anims.create({
            key: `enemy-${type}-idle`,
            frames: [ { key: 'enemy', frame: 0 } ],
            frameRate: 5,
            repeat: -1
          });
        }
        
        if (!anims.exists(`enemy-${type}-walk`)) {
          anims.create({
            key: `enemy-${type}-walk`,
            frames: [ { key: 'enemy', frame: 0 } ],
            frameRate: 8,
            repeat: -1
          });
        }
        
        return;
      }
      
      // If we have proper frames, create standard animations
      if (!anims.exists(`enemy-${type}-idle`)) {
        anims.create({
          key: `enemy-${type}-idle`,
          frames: anims.generateFrameNumbers('enemy', { start: 0, end: 0 }),
          frameRate: 5,
          repeat: -1
        });
      }
      
      if (!anims.exists(`enemy-${type}-walk`)) {
        anims.create({
          key: `enemy-${type}-walk`,
          frames: anims.generateFrameNumbers('enemy', { start: 0, end: frames.length > 3 ? 3 : 0 }),
          frameRate: 8,
          repeat: -1
        });
      }
    } catch (err) {
      console.error('Error creating enemy animations:', err);
      // Animations failed, but the game can continue with static sprites
    }
  }
  
  update(time, delta) {
    if (!this.active) return;
    
    if (this.target) {
      this.followTarget();
    } else {
      this.wander(time);
    }
  }
  
  followTarget() {
    // Get direction to player
    const directionX = this.target.x - this.x;
    const directionY = this.target.y - this.y;
    
    // Calculate angle to player
    const angle = Math.atan2(directionY, directionX);
    
    // Set velocity towards player
    this.setVelocityX(Math.cos(angle) * this.moveSpeed);
    this.setVelocityY(Math.sin(angle) * this.moveSpeed);
    
    // Flip sprite based on movement direction
    if (directionX < 0) {
      this.setFlipX(true);
    } else {
      this.setFlipX(false);
    }
    
    // Play walking animation
    this.anims.play(`enemy-${this.type}-walk`, true);
  }
  
  wander(time) {
    // Change direction randomly if not moving or at random intervals
    if ((!this.body.velocity.x && !this.body.velocity.y) || 
        Math.random() < 0.01) {
      
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.setVelocityX(Math.cos(angle) * this.moveSpeed * 0.5);
      this.setVelocityY(Math.sin(angle) * this.moveSpeed * 0.5);
      
      // Flip sprite based on movement direction
      if (this.body.velocity.x < 0) {
        this.setFlipX(true);
      } else {
        this.setFlipX(false);
      }
    }
    
    // Play appropriate animation
    if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
      this.anims.play(`enemy-${this.type}-walk`, true);
    } else {
      this.anims.play(`enemy-${this.type}-idle`, true);
    }
  }
  
  setTarget(target) {
    this.target = target;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    // Flash white when taking damage
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
      this.setTintFromType();
    });
    
    if (this.health <= 0) {
      return this.die();
    }
    
    return false;
  }
  
  setTintFromType() {
    switch(this.type) {
      case 'fast': this.setTint(0xff9999); break;
      case 'strong': this.setTint(0x9999ff); break;
      case 'boss': this.setTint(0xff99ff); break;
      default: this.clearTint();
    }
  }
  
  die() {
    // Emit particle effect
    try {
      // Create particles at the enemy's position
      const particles = this.scene.add.particles(this.x, this.y, 'bullet', {
        speed: 100,
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: 500,
        quantity: 10
      });
      
      // Auto-destroy particles after they're done
      this.scene.time.delayedCall(1000, () => {
        particles.destroy();
      });
    } catch (err) {
      console.warn('Error creating particle effect:', err.message);
      // Gracefully continue even if particle effect fails
    }
    
    // Set enemy as inactive
    this.setActive(false);
    this.setVisible(false);
    this.destroy();
    
    return this.scoreValue;
  }
}
