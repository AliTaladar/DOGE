import Phaser from 'phaser';

export default class ShooterScene extends Phaser.Scene {
    constructor() {
        super('ShooterScene');
        this.player = null;
        this.bullets = null;
        this.enemies = null;
        this.score = 0;
        this.scoreText = null;
        this.gameOver = false;
        this.lastFired = 0;
        this.fireRate = 100; // Time between shots in milliseconds
    }

    preload() {
        // Using some assets from the original game and some from Phaser examples
        this.load.image('sky', '/assets/HBS_BG.jpg');
        this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
        this.load.image('bullet', 'https://labs.phaser.io/assets/sprites/bullet.png');
        this.load.image('enemy', '/assets/HBS.png');
    }

    create() {
        // Add background
        this.add.image(400, 300, 'sky').setScale(1);

        // Create bullet group
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 10
        });

        // Create enemy group
        this.enemies = this.physics.add.group({
            key: 'enemy',
            repeat: 4,
            setXY: { x: 100, y: 100, stepX: 150 }
        });

        this.enemies.children.iterate(function (enemy) {
            enemy.setScale(0.2);
            enemy.setVelocityY(100);
            enemy.setBounce(1);
            enemy.setCollideWorldBounds(true);
        });

        // Create player
        this.player = this.physics.add.sprite(400, 500, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(2);

        // Score
        this.scoreText = this.add.text(16, 16, 'Score: 0', { 
            fontSize: '32px', 
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });

        // Colliders
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemy, null, this);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Shooting with spacebar
        this.input.keyboard.on('keydown-SPACE', this.shoot, this);
    }

    update() {
        if (this.gameOver) {
            return;
        }

        // Player movement
        const speed = 300;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
        } else {
            this.player.setVelocityY(0);
        }

        // Update bullets
        this.bullets.children.each(function(bullet) {
            if (bullet.active) {
                if (bullet.y < -50) {
                    bullet.setActive(false);
                    bullet.setVisible(false);
                }
            }
        });

        // Check for game over
        if (this.enemies.countActive(true) === 0) {
            this.gameOver = true;
            this.add.text(400, 300, 'You Win!', {
                fontSize: '64px',
                fill: '#fff',
                backgroundColor: '#000',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5);
        }
    }

    shoot() {
        const time = this.time.now;
        if (time > this.lastFired) {
            const bullet = this.bullets.get(this.player.x, this.player.y - 20);
            
            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                bullet.setScale(0.5);
                
                bullet.setVelocityY(-400);
                this.lastFired = time + this.fireRate;
            }
        }
    }

    hitEnemy(bullet, enemy) {
        bullet.setActive(false);
        bullet.setVisible(false);
        enemy.destroy();
        
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
    }
}
