import Phaser from 'phaser';

export default class OptionsScene extends Phaser.Scene {
  constructor() {
    super('OptionsScene');
    
    // Default settings
    this.settings = {
      musicVolume: 0.5,
      sfxVolume: 0.7,
      difficulty: 'normal',
      fullscreen: false
    };
  }
  
  create() {
    // Load saved settings if they exist
    this.loadSettings();
    
    // Background color
    this.cameras.main.setBackgroundColor('#001428');
    
    // Options title
    this.add.text(400, 80, 'OPTIONS', {
      fontFamily: 'Arial',
      fontSize: 40,
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Create options UI
    this.createAudioOptions();
    this.createGameplayOptions();
    this.createDisplayOptions();
    
    // Create bottom buttons
    this.createBottomButtons();
  }
  
  loadSettings() {
    // Try to load settings from localStorage
    const savedSettings = localStorage.getItem('sundai-shooter-settings');
    if (savedSettings) {
      try {
        this.settings = JSON.parse(savedSettings);
      } catch (e) {
        console.error('Error parsing settings:', e);
      }
    }
  }
  
  saveSettings() {
    // Save settings to localStorage
    localStorage.setItem('sundai-shooter-settings', JSON.stringify(this.settings));
  }
  
  createAudioOptions() {
    // Audio section title
    this.add.text(400, 150, 'AUDIO', {
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#3498db',
      align: 'center'
    }).setOrigin(0.5);
    
    // Music volume slider
    this.add.text(250, 190, 'Music Volume:', {
      fontFamily: 'Arial',
      fontSize: 18,
      color: '#ffffff',
      align: 'right'
    }).setOrigin(1, 0.5);
    
    this.createSlider(350, 190, this.settings.musicVolume, (value) => {
      this.settings.musicVolume = value;
    });
    
    // SFX volume slider
    this.add.text(250, 230, 'SFX Volume:', {
      fontFamily: 'Arial',
      fontSize: 18,
      color: '#ffffff',
      align: 'right'
    }).setOrigin(1, 0.5);
    
    this.createSlider(350, 230, this.settings.sfxVolume, (value) => {
      this.settings.sfxVolume = value;
    });
  }
  
  createGameplayOptions() {
    // Gameplay section title
    this.add.text(400, 290, 'GAMEPLAY', {
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#3498db',
      align: 'center'
    }).setOrigin(0.5);
    
    // Difficulty option
    this.add.text(250, 330, 'Difficulty:', {
      fontFamily: 'Arial',
      fontSize: 18,
      color: '#ffffff',
      align: 'right'
    }).setOrigin(1, 0.5);
    
    // Difficulty buttons
    const difficultyOptions = ['easy', 'normal', 'hard'];
    const buttonWidth = 100;
    const spacing = 10;
    const startX = 300;
    
    difficultyOptions.forEach((difficulty, index) => {
      const x = startX + (buttonWidth + spacing) * index;
      const selected = this.settings.difficulty === difficulty;
      
      const button = this.createToggleButton(x, 330, difficulty.toUpperCase(), selected, () => {
        // Deselect all buttons first
        this.difficultyButtons.forEach(btn => btn.setSelected(false));
        
        // Select the clicked button
        button.setSelected(true);
        this.settings.difficulty = difficulty;
      });
      
      if (!this.difficultyButtons) this.difficultyButtons = [];
      this.difficultyButtons.push(button);
    });
  }
  
  createDisplayOptions() {
    // Display section title
    this.add.text(400, 390, 'DISPLAY', {
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#3498db',
      align: 'center'
    }).setOrigin(0.5);
    
    // Fullscreen toggle
    this.add.text(250, 430, 'Fullscreen:', {
      fontFamily: 'Arial',
      fontSize: 18,
      color: '#ffffff',
      align: 'right'
    }).setOrigin(1, 0.5);
    
    this.createToggleSwitch(350, 430, this.settings.fullscreen, (value) => {
      this.settings.fullscreen = value;
      
      // Apply fullscreen change immediately
      if (value) {
        this.scale.startFullscreen();
      } else {
        this.scale.stopFullscreen();
      }
    });
  }
  
  createBottomButtons() {
    // Save button
    const saveButton = this.add.text(300, 520, 'SAVE', {
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#ffffff',
      backgroundColor: '#2ecc71',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    saveButton.setInteractive({ useHandCursor: true })
      .on('pointerover', () => saveButton.setTint(0xaaffaa))
      .on('pointerout', () => saveButton.clearTint())
      .on('pointerdown', () => {
        this.saveSettings();
        this.scene.start('MenuScene');
      });
    
    // Cancel button
    const cancelButton = this.add.text(500, 520, 'CANCEL', {
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#ffffff',
      backgroundColor: '#e74c3c',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    cancelButton.setInteractive({ useHandCursor: true })
      .on('pointerover', () => cancelButton.setTint(0xffaaaa))
      .on('pointerout', () => cancelButton.clearTint())
      .on('pointerdown', () => {
        this.scene.start('MenuScene');
      });
  }
  
  createSlider(x, y, initialValue, onValueChange) {
    const width = 200;
    const height = 20;
    const padding = 2;
    
    // Create container for the slider
    const container = this.add.container(x, y);
    
    // Background bar
    const bg = this.add.rectangle(width/2, 0, width, height, 0x333333);
    bg.setStrokeStyle(2, 0x666666);
    
    // Fill bar
    const fillWidth = width - (padding * 2);
    const fill = this.add.rectangle(
      padding + fillWidth * initialValue / 2, 
      0, 
      fillWidth * initialValue, 
      height - (padding * 2), 
      0x3498db
    );
    
    // Slider handle
    const handle = this.add.circle(
      padding + fillWidth * initialValue,
      0,
      10,
      0xffffff
    );
    handle.setStrokeStyle(2, 0x3498db);
    
    // Value text
    const valueText = this.add.text(
      width + 20,
      0,
      Math.round(initialValue * 100) + '%',
      {
        fontFamily: 'Arial',
        fontSize: 16,
        color: '#ffffff'
      }
    ).setOrigin(0, 0.5);
    
    // Add all elements to container
    container.add([bg, fill, handle, valueText]);
    
    // Enable drag on the handle
    handle.setInteractive({ draggable: true, useHandCursor: true });
    
    // Handle drag events
    handle.on('drag', (pointer, dragX) => {
      // Limit drag to slider width
      const minX = padding;
      const maxX = width - padding;
      
      let x = Phaser.Math.Clamp(dragX, minX, maxX);
      
      // Update handle position
      handle.x = x;
      
      // Update fill bar
      const fillWidth = x - padding;
      fill.width = fillWidth;
      fill.x = padding + fillWidth / 2;
      
      // Calculate new value (0-1)
      const value = (x - padding) / (maxX - minX);
      
      // Update text
      valueText.setText(Math.round(value * 100) + '%');
      
      // Call the callback
      onValueChange(value);
    });
    
    return container;
  }
  
  createToggleButton(x, y, text, initialState, onClick) {
    // Create container
    const container = this.add.container(x, y);
    
    // Button width based on text
    const width = text.length * 12 + 20;
    
    // Background
    const bg = this.add.rectangle(0, 0, width, 30, initialState ? 0x3498db : 0x333333);
    bg.setStrokeStyle(2, 0x666666);
    
    // Text
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'Arial',
      fontSize: 16,
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Add elements to container
    container.add([bg, buttonText]);
    
    // Make interactive
    container.setSize(width, 30);
    container.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        onClick();
      });
    
    // Add method to set selected state
    container.setSelected = (selected) => {
      bg.fillColor = selected ? 0x3498db : 0x333333;
    };
    
    return container;
  }
  
  createToggleSwitch(x, y, initialState, onToggle) {
    // Create container
    const container = this.add.container(x, y);
    
    // Track background
    const width = 60;
    const height = 30;
    const bg = this.add.rectangle(0, 0, width, height, 0x333333, 1);
    bg.setStrokeStyle(2, 0x666666);
    
    // Knob
    const knobX = initialState ? width/4 : -width/4;
    const knob = this.add.circle(knobX, 0, height/2 - 4, initialState ? 0x2ecc71 : 0xe74c3c);
    knob.setStrokeStyle(2, 0xffffff);
    
    // Label
    const labelText = this.add.text(
      width/2 + 10,
      0,
      initialState ? 'ON' : 'OFF',
      {
        fontFamily: 'Arial',
        fontSize: 16,
        color: '#ffffff'
      }
    ).setOrigin(0, 0.5);
    
    // Add elements to container
    container.add([bg, knob, labelText]);
    
    // State
    container.state = initialState;
    
    // Make interactive
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // Toggle state
        container.state = !container.state;
        
        // Update visual
        const targetX = container.state ? width/4 : -width/4;
        
        // Animate knob
        this.tweens.add({
          targets: knob,
          x: targetX,
          duration: 100,
          ease: 'Power1'
        });
        
        // Update color
        knob.fillColor = container.state ? 0x2ecc71 : 0xe74c3c;
        
        // Update label
        labelText.setText(container.state ? 'ON' : 'OFF');
        
        // Call callback
        onToggle(container.state);
      });
    
    return container;
  }
}
