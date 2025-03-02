// Fix ESLint warning
// import Phaser from 'phaser';

export default class TileMapManager {
  constructor(scene) {
    this.scene = scene;
    this.map = null;
    this.layers = {
      ground: null,
      walls: null,
      items: null
    };
    this.emergencyGraphics = null;
    
    console.log('TileMapManager: Initializing');
    
    // Try to create the map automatically
    try {
      // Attempt to create the map from the loaded tilemap
      this.createMap('level1', 'tiles')
          .createLayers();
      console.log('TileMapManager: Successfully created map from tilemap');
    } catch (err) {
      console.error('TileMapManager: Error loading tilemap, using fallback map:', err);
      
      // Fall back to a procedurally generated map
      this.createFallbackMap(25, 20);
      console.log('TileMapManager: Created fallback map');
    }
  }
  
  createMap(key, tilesetKey) {
    try {
      console.log(`Creating tilemap from key: ${key}, with tileset: ${tilesetKey}`);
      
      // Get the tilemap from the cache
      this.map = this.scene.make.tilemap({ key });
      
      if (!this.map) {
        console.error('Failed to create tilemap from key');
        return this;
      }
      
      console.log('Tilemap created successfully, adding tileset');
      
      // Add the tileset to the map - properly match the key name in the tilemap data
      this.tileset = this.map.addTilesetImage(tilesetKey, tilesetKey);
      
      if (!this.tileset) {
        console.error('Failed to add tileset to map');
        
        // Check if tileset is in the cache
        if (!this.scene.textures.exists(tilesetKey)) {
          console.error(`Tileset texture '${tilesetKey}' does not exist in the cache`);
        } else {
          console.log(`Tileset texture '${tilesetKey}' exists in the cache, but failed to add to tilemap`);
          console.log('Attempting to add tileset with detailed debugging:');
          console.log('Tilemap tilesets:', this.map.tilesets);
          console.log('Tileset texture dimensions:', 
            this.scene.textures.get(tilesetKey).get(0).width,
            'x',
            this.scene.textures.get(tilesetKey).get(0).height
          );
        }
        
        // We'll continue and try to create layers anyway
      } else {
        console.log('Tileset added successfully');
      }
      
      // Store the map key for reference
      this.mapKey = key;
      
      return this;
    } catch (err) {
      console.error('Error creating tilemap:', err);
      this.map = null;
      this.tileset = null;
      return this;
    }
  }
  
  // Create an emergency map directly with graphics objects
  createEmergencyMap(width = 20, height = 15, tileSize = 32) {
    console.log('Creating emergency map with dimensions:', width, 'x', height);
    
    this.emergencyGraphics = [];
    this.mapWidth = width;
    this.mapHeight = height;
    
    // Calculate grid size based on map dimensions and tileSize
    const gridWidth = width * tileSize;
    const gridHeight = height * tileSize;
    
    // Create a border around the map
    this.createWalls(0, 0, gridWidth, tileSize); // Top wall
    this.createWalls(0, gridHeight - tileSize, gridWidth, tileSize); // Bottom wall
    this.createWalls(0, tileSize, tileSize, gridHeight - (tileSize * 2)); // Left wall
    this.createWalls(gridWidth - tileSize, tileSize, tileSize, gridHeight - (tileSize * 2)); // Right wall
    
    // Generate some internal walls to make it more interesting
    this.generateInternalWalls(width, height, tileSize);
    
    console.log(`Emergency map created with ${this.emergencyGraphics.length} wall segments`);
    
    return this;
  }
  
  createWalls(x, y, width, height) {
    // Create a wall graphic
    const wall = this.scene.add.rectangle(x + (width / 2), y + (height / 2), width, height, 0x444444);
    
    // Add a stroke around the wall for better visibility
    wall.setStrokeStyle(2, 0xff0000);
    
    // Enable physics for the wall
    this.scene.physics.add.existing(wall, true); // true = static body
    
    // Configure the physics body for proper collisions
    if (wall.body) {
      wall.body.immovable = true;
      wall.body.moves = false;
      
      // Ensure body size matches graphic size
      wall.body.setSize(width, height);
      
      // Set higher debug priority so we can see this in the debug mode
      wall.body.debugShowBody = true;
      wall.body.debugBodyColor = 0xff0000;
    }
    
    // Log creation
    console.log(`Wall created at (${x}, ${y}) with size ${width}x${height}`);
    
    // Add to our list of emergency graphics
    this.emergencyGraphics.push(wall);
    return wall;
  }
  
  generateInternalWalls(width, height, tileSize) {
    // Create a simple maze-like structure
    const numWalls = Math.min(10, Math.floor(width * height / 20)); // Don't create too many walls
    
    console.log(`Generating ${numWalls} internal walls`);
    
    for (let i = 0; i < numWalls; i++) {
      // Decide if this wall is horizontal or vertical
      const isHorizontal = Math.random() > 0.5;
      
      if (isHorizontal) {
        // Horizontal wall
        const wallWidth = Math.floor(Math.random() * 5 + 3) * tileSize; // 3-7 tiles wide
        const wallX = Math.floor(Math.random() * (width - (wallWidth / tileSize) - 2) + 1) * tileSize;
        const wallY = Math.floor(Math.random() * (height - 4) + 2) * tileSize;
        
        this.createWalls(wallX, wallY, wallWidth, tileSize);
      } else {
        // Vertical wall
        const wallHeight = Math.floor(Math.random() * 5 + 3) * tileSize; // 3-7 tiles high
        const wallX = Math.floor(Math.random() * (width - 4) + 2) * tileSize;
        const wallY = Math.floor(Math.random() * (height - (wallHeight / tileSize) - 2) + 1) * tileSize;
        
        this.createWalls(wallX, wallY, tileSize, wallHeight);
      }
    }
  }
  
  clearEmergencyGraphics() {
    // Clear any existing emergency graphics
    this.emergencyGraphics.forEach(graphic => {
      if (graphic && graphic.destroy) {
        graphic.destroy();
      }
    });
    this.emergencyGraphics = [];
  }
  
  createLayers() {
    // Skip if map doesn't exist
    if (!this.map || !this.map.layers) {
      console.error('Cannot create layers: map is null or missing layers');
      return this;
    }
    
    try {
      console.log('Creating tilemap layers');
      
      // Ensure we have a tileset before proceeding
      if (!this.tileset) {
        console.warn('No tileset found, attempting to get tileset data');
        // Try to get the tileset
        this.tileset = this.map.addTilesetImage('tiles', 'tiles');
        
        if (!this.tileset) {
          console.error('Failed to create tileset - cannot create layers');
          return this;
        }
      }
      
      // Create layers based on the map data
      this.layers = {};
      
      // Get layer data from the map
      const mapLayers = this.map.layers.map(l => l.name);
      console.log('Available layers in tilemap:', mapLayers);
      
      // Helper function to find layer by case-insensitive name
      const findLayer = (layerName) => {
        const exactMatch = this.map.getLayerIndexByName(layerName);
        if (exactMatch !== null) return layerName;
        
        // Try capitalized version
        const capitalizedName = layerName.charAt(0).toUpperCase() + layerName.slice(1);
        const capitalizedMatch = this.map.getLayerIndexByName(capitalizedName);
        if (capitalizedMatch !== null) return capitalizedName;
        
        return null;
      };
      
      // Create floor layer
      const floorLayerName = findLayer('floor') || findLayer('ground');
      if (floorLayerName) {
        this.layers.floor = this.map.createLayer(floorLayerName, this.tileset, 0, 0);
        if (this.layers.floor) {
          this.layers.floor.setDepth(0);
          console.log(`Created floor layer using '${floorLayerName}'`);
        }
      } else {
        console.warn('No floor/ground layer found in tilemap');
      }
      
      // Create walls layer with collisions
      const wallsLayerName = findLayer('walls');
      if (wallsLayerName) {
        this.layers.walls = this.map.createLayer(wallsLayerName, this.tileset, 0, 0);
        
        if (this.layers.walls) {
          this.layers.walls.setDepth(10);
          
          // Set up collision for wall tiles (tileid 2 in our updated tileset)
          this.layers.walls.setCollisionByExclusion([-1, 0, 1, 3]);
          this.layers.walls.setCollisionByProperty({ collides: true });
          
          console.log('Set collision for walls layer');
          
          // Set world bounds based on map dimensions
          this.scene.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
          console.log('World bounds set according to map dimensions');
        }
      } else {
        console.warn('No walls layer found in tilemap');
      }
      
      // Create objects layer
      const objectsLayerName = findLayer('objects') || findLayer('decorations');
      if (objectsLayerName) {
        this.layers.objects = this.map.createLayer(objectsLayerName, this.tileset, 0, 0);
        if (this.layers.objects) {
          this.layers.objects.setDepth(5);
          console.log(`Created objects layer using '${objectsLayerName}'`);
        }
      }
      
      console.log('All layers created successfully');
    } catch (error) {
      console.error('Error creating layers:', error);
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
    try {
      console.log('TileMapManager: Setting up colliders');
      
      // Check which type of map we're using (tilemap or emergency graphics)
      const usingTilemap = this.map && this.layers && this.layers.walls;
      const usingEmergencyGraphics = this.emergencyGraphics && this.emergencyGraphics.length > 0;
      
      console.log(`Collision setup: Using tilemap: ${usingTilemap}, Using emergency graphics: ${usingEmergencyGraphics}`);
      
      if (usingTilemap) {
        // Set up player-wall collisions using tilemap
        if (player && this.layers.walls) {
          console.log('Adding collider between player and tilemap walls');
          this.scene.physics.add.collider(player, this.layers.walls);
        }
        
        // Set up enemy-wall collisions using tilemap
        if (enemies && this.layers.walls) {
          console.log('Adding collider between enemies and tilemap walls');
          this.scene.physics.add.collider(enemies, this.layers.walls);
        }
        
        // Set up item-wall collisions using tilemap
        if (items && this.layers.walls) {
          console.log('Adding collider between items and tilemap walls');
          this.scene.physics.add.collider(items, this.layers.walls);
        }
      }
      
      if (usingEmergencyGraphics) {
        // Make sure all emergency graphics are properly set up for physics
        this.emergencyGraphics.forEach(graphic => {
          if (graphic.body) {
            graphic.body.immovable = true;
            graphic.body.moves = false;
          }
        });
        
        // Set up player-wall collisions using emergency graphics
        if (player) {
          console.log('Adding collider between player and emergency graphics walls');
          this.scene.physics.add.collider(player, this.emergencyGraphics);
          
          // Debug log
          console.log('Player physics body:', {
            exists: player.body !== undefined,
            enabled: player.body ? player.body.enable : false,
            size: player.body ? [player.body.width, player.body.height] : 'N/A'
          });
        }
        
        // Set up enemy-wall collisions using emergency graphics
        if (enemies) {
          console.log('Adding collider between enemies and emergency graphics walls');
          this.scene.physics.add.collider(enemies, this.emergencyGraphics);
        }
        
        // Set up item-wall collisions using emergency graphics
        if (items) {
          console.log('Adding collider between items and emergency graphics walls');
          this.scene.physics.add.collider(items, this.emergencyGraphics);
        }
      }
      
      // Set world bounds if needed
      if (!usingTilemap) {
        // Set standard world bounds if no tilemap
        const gridWidth = this.mapWidth * this.tileSize || 800;
        const gridHeight = this.mapHeight * this.tileSize || 600;
        this.scene.physics.world.setBounds(0, 0, gridWidth, gridHeight);
        console.log(`Set world bounds to ${gridWidth}x${gridHeight}`);
      }
      
      console.log('All map colliders set up successfully');
    } catch (err) {
      console.error('Error setting up colliders:', err);
    }
    
    return this;
  }
  
  createFallbackMap(width = 25, height = 20, tileSize = 32) {
    console.log('Creating procedural fallback map as emergency');
    
    // First clear any existing emergency graphics
    this.clearEmergencyGraphics();
    
    // Set tile size (used by emergency map creation)
    this.tileSize = tileSize;
    
    // Create a procedurally generated emergency map
    return this.createEmergencyMap(width, height, tileSize);
  }
  
  createFallbackTileset() {
    console.log('Note: createFallbackTileset is deprecated, using emergency graphics instead');
    return this;
  }
}
