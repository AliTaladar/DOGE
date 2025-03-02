import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    
    // Add player to the scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Player properties
    this.health = 100;
    this.moveSpeed = 200;
    this.lastFired = 0;
    this.fireRate = 200; // Time between shots in milliseconds
    this.isDead = false;
    
    // Player setup
    this.setCollideWorldBounds(true);
    this.setScale(1);
    this.setSize(32, 32);
    this.setDepth(10);
    
    // Create bullet group
    this.bullets = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      defaultKey: 'bullet',
      maxSize: 10,
      runChildUpdate: true
    });
    
    // Initialize player animations
    this.createAnimations();
  }
  
  createAnimations() {
    try {
      const anims = this.scene.anims;
      
      // Check if the player texture exists and has frames
      const textureManager = this.scene.textures;
      if (!textureManager.exists('player')) {
        console.warn('Player texture does not exist, skipping animations');
        return;
      }
      
      // Get available frames or use fallbacks
      const frames = textureManager.get('player').getFrameNames();
      const useSingleFrame = !frames || frames.length === 0;
      
      // Create player animations if they don't exist
      if (!anims.exists('player-idle')) {
        if (useSingleFrame) {
          anims.create({
            key: 'player-idle',
            frames: [ { key: 'player', frame: 0 } ],
            frameRate: 5,
            repeat: -1
          });
        } else {
          anims.create({
            key: 'player-idle',
            frames: anims.generateFrameNumbers('player', { start: 0, end: 0 }),
            frameRate: 5,
            repeat: -1
          });
        }
      }
      
      if (!anims.exists('player-walk')) {
        if (useSingleFrame) {
          anims.create({
            key: 'player-walk',
            frames: [ { key: 'player', frame: 0 } ],
            frameRate: 10,
            repeat: -1
          });
        } else {
          const endFrame = frames.length > 4 ? 4 : 0;
          anims.create({
            key: 'player-walk',
            frames: anims.generateFrameNumbers('player', { start: 1, end: endFrame }),
            frameRate: 10,
            repeat: -1
          });
        }
      }
    } catch (err) {
      console.error('Error creating player animations:', err);
      // Animations failed, but the game can continue with static sprites
    }
  }
  
  update(time, cursors) {
    if (this.isDead) return;
    
    // Movement handling
    this.handleMovement(cursors);
    
    // Shooting handling
    this.handleShooting(time, cursors);
  }
  
  handleMovement(cursors) {
    // Reset velocity
    this.setVelocity(0);
    
    const speed = this.moveSpeed;
    let isMoving = false;
    
    // Handle movement in four directions
    if (cursors.left.isDown) {
      this.setVelocityX(-speed);
      this.setFlipX(true);
      isMoving = true;
    } else if (cursors.right.isDown) {
      this.setVelocityX(speed);
      this.setFlipX(false);
      isMoving = true;
    }
    
    if (cursors.up.isDown) {
      this.setVelocityY(-speed);
      isMoving = true;
    } else if (cursors.down.isDown) {
      this.setVelocityY(speed);
      isMoving = true;
    }
    
    // Normalize diagonal movement
    if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
      this.body.velocity.normalize().scale(speed);
    }
    
    // Play animations based on movement, with error handling
    try {
      if (isMoving) {
        this.anims.play('player-walk', true);
      } else {
        this.anims.play('player-idle', true);
      }
    } catch (err) {
      console.warn('Error playing player animation:', err.message);
      // If animation fails, we can still use the sprite without animation
    }
  }
  
  handleShooting(time, cursors) {
    const space = cursors.space;
    
    if (space.isDown && time > this.lastFired) {
      const bullet = this.bullets.get();
      
      if (bullet) {
        // Position and activate the bullet
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setScale(0.5);
        bullet.setSize(8, 8);
        
        // Set bullet position
        const offsetX = this.flipX ? -20 : 20;
        bullet.setPosition(this.x + offsetX, this.y);
        
        // Set bullet velocity based on player direction
        const direction = this.flipX ? -1 : 1;
        bullet.setVelocityX(direction * 400);
        
        // Set bullet lifetime
        this.scene.time.delayedCall(1500, () => {
          bullet.setActive(false);
          bullet.setVisible(false);
        });
        
        // Set cooldown
        this.lastFired = time + this.fireRate;
      }
    }
  }
  
  takeDamage(amount) {
    if (this.isDead) return this.health; // Don't take damage if already dead
    
    this.health -= amount;
    
    // Flash red when taking damage
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
    
    if (this.health <= 0) {
      this.health = 0; // Ensure health doesn't go negative
      this.die();
    }
    
    return this.health;
  }
  
  die() {
    this.isDead = true;
    this.setVelocity(0, 0);
    this.setTint(0xff0000);
    this.anims.play('player-idle');
    
    // Trigger game over after a short delay
    this.scene.time.delayedCall(1000, () => {
      this.scene.events.emit('player-died');
    });
  }
  
  getBullets() {
    return this.bullets;
  }
}
