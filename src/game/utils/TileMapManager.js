import Phaser from 'phaser';

export default class TileMapManager {
  constructor(scene) {
    this.scene = scene;
    this.map = null;
    this.tileset = null;
    this.layers = {};
    this.objects = {};
  }
  
  createMap(key, tilesetName) {
    try {
      // Create the tilemap
      this.map = this.scene.make.tilemap({ key });
      
      // Add the tileset to the map
      this.tileset = this.map.addTilesetImage(tilesetName);
      
      return this;
    } catch (err) {
      console.error('Error creating map:', err);
      this.map = null;
      this.tileset = null;
      return this;
    }
  }
  
  createLayers() {
    // Create base layers from the map
    if (!this.map) return this;
    
    try {
      // Create ground/floor layer
      this.layers.ground = this.map.createLayer('Ground', this.tileset);
      if (this.layers.ground) {
        this.layers.ground.setCollisionByProperty({ collides: false });
      }
      
      // Create walls layer (with collision)
      this.layers.walls = this.map.createLayer('Walls', this.tileset);
      if (this.layers.walls) {
        this.layers.walls.setCollisionByProperty({ collides: true });
      }
      
      // Create decoration layer (above ground, below walls)
      this.layers.deco = this.map.createLayer('Decorations', this.tileset);
      if (this.layers.deco) {
        this.layers.deco.setCollisionByProperty({ collides: false });
        this.layers.deco.setDepth(1);
      }
      
      // Create overhead layer (above player)
      this.layers.overhead = this.map.createLayer('Overhead', this.tileset);
      if (this.layers.overhead) {
        this.layers.overhead.setDepth(20);
        this.layers.overhead.setCollisionByProperty({ collides: false });
      }
    } catch (err) {
      console.error('Error creating layers:', err);
    }
    
    return this;
  }
  
  findObjectsByType(type) {
    if (!this.map || !this.map.objects) return [];
    
    try {
      const results = [];
      
      // Loop through all object layers
      this.map.objects.forEach(objectLayer => {
        // Find objects of the specified type
        const foundObjects = objectLayer.objects.filter(obj => obj.type === type);
        
        // Add to results
        if (foundObjects.length > 0) {
          results.push(...foundObjects);
        }
      });
      
      return results;
    } catch (err) {
      console.error('Error finding objects:', err);
      return [];
    }
  }
  
  setupColliders(player, enemies, items) {
    if (!this.map) return this;
    
    try {
      // Set up player-wall collisions
      if (player && this.layers.walls) {
        this.scene.physics.add.collider(player, this.layers.walls);
      }
      
      // Set up enemy-wall collisions
      if (enemies && this.layers.walls) {
        this.scene.physics.add.collider(enemies, this.layers.walls);
      }
      
      // Set up enemy-enemy collisions
      if (enemies) {
        this.scene.physics.add.collider(enemies, enemies);
      }
      
      // Set up item-wall collisions
      if (items && this.layers.walls) {
        this.scene.physics.add.collider(items, this.layers.walls);
      }
    } catch (err) {
      console.error('Error setting up colliders:', err);
    }
    
    return this;
  }
  
  createFallbackMap(width, height) {
    // Create a simple fallback map programmatically if no tilemap is available
    if (this.map) return this;
    
    try {
      // Create an empty map
      this.map = this.scene.make.tilemap({
        tileWidth: 32,
        tileHeight: 32,
        width,
        height
      });
      
      // Try to add tileset
      try {
        this.tileset = this.map.addTilesetImage('tiles');
      } catch (err) {
        console.error('Failed to add tileset, creating a fallback graphics tileset');
        // Create a fallback tileset of colored rectangles
        this.createFallbackTileset();
      }
      
      // If we still don't have a tileset, bail out
      if (!this.tileset) {
        return this;
      }
      
      // Create ground layer with floor tiles
      const ground = this.map.createBlankLayer('Ground', this.tileset);
      ground.fill(0); // Fill with the first tile in the tileset
      this.layers.ground = ground;
      
      // Create walls around the perimeter
      const walls = this.map.createBlankLayer('Walls', this.tileset);
      
      // Fill the top and bottom rows
      for (let x = 0; x < width; x++) {
        walls.putTileAt(0, x, 0);
        walls.putTileAt(0, x, height - 1);
      }
      
      // Fill the left and right columns
      for (let y = 1; y < height - 1; y++) {
        walls.putTileAt(0, 0, y);
        walls.putTileAt(0, width - 1, y);
      }
      
      // Add some random walls inside
      for (let i = 0; i < width * height / 20; i++) {
        const x = Phaser.Math.Between(2, width - 3);
        const y = Phaser.Math.Between(2, height - 3);
        
        // Create small wall formations
        walls.putTileAt(0, x, y);
        
        // Sometimes create larger clusters
        if (Math.random() < 0.4) {
          const direction = Phaser.Math.Between(0, 3);
          if (direction === 0 && x < width - 3) walls.putTileAt(0, x + 1, y);
          if (direction === 1 && x > 2) walls.putTileAt(0, x - 1, y);
          if (direction === 2 && y < height - 3) walls.putTileAt(0, x, y + 1);
          if (direction === 3 && y > 2) walls.putTileAt(0, x, y - 1);
        }
      }
      
      // Set collisions for walls
      walls.setCollisionByExclusion([-1]);
      this.layers.walls = walls;
    } catch (err) {
      console.error('Error creating fallback map:', err);
    }
    
    return this;
  }
  
  createFallbackTileset() {
    // Create a basic tileset programmatically
    const tileSize = 32;
    
    // Create a temporary canvas to draw tiles
    const canvas = document.createElement('canvas');
    canvas.width = tileSize * 3;  // 3 tiles wide
    canvas.height = tileSize;     // 1 tile high
    const ctx = canvas.getContext('2d');
    
    // Floor tile (index 0) - light gray
    ctx.fillStyle = '#AAAAAA';
    ctx.fillRect(0, 0, tileSize, tileSize);
    ctx.strokeStyle = '#999999';
    ctx.strokeRect(2, 2, tileSize-4, tileSize-4);
    
    // Wall tile (index 1) - dark gray
    ctx.fillStyle = '#555555';
    ctx.fillRect(tileSize, 0, tileSize, tileSize);
    ctx.strokeStyle = '#333333';
    ctx.strokeRect(tileSize+2, 2, tileSize-4, tileSize-4);
    
    // Decoration tile (index 2) - green
    ctx.fillStyle = '#55AA55';
    ctx.fillRect(tileSize*2, 0, tileSize, tileSize);
    ctx.strokeStyle = '#338833';
    ctx.strokeRect(tileSize*2+2, 2, tileSize-4, tileSize-4);
    
    // Convert canvas to base64 image
    const imageData = canvas.toDataURL();
    
    // Load the image into Phaser's cache
    if (!this.scene.textures.exists('fallback_tiles')) {
      const image = new Image();
      image.src = imageData;
      
      this.scene.textures.addImage('fallback_tiles', image);
    }
    
    // Add the tileset to the map
    this.tileset = this.map.addTilesetImage('tiles', 'fallback_tiles');
  }
}
