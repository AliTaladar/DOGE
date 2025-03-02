import Phaser from 'phaser';
import gameConfig from './config';
import PreloaderScene from './scenes/PreloaderScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import OptionsScene from './scenes/OptionsScene';
import VictoryScene from './scenes/VictoryScene';

export default class Game extends Phaser.Game {
  constructor(containerId) {
    // Apply container ID to config
    const config = {
      ...gameConfig,
      parent: containerId
    };
    
    // Initialize Phaser game
    super(config);
    
    // Add scenes
    this.scene.add('PreloaderScene', PreloaderScene);
    this.scene.add('MenuScene', MenuScene);
    this.scene.add('GameScene', GameScene);
    this.scene.add('OptionsScene', OptionsScene);
    this.scene.add('VictoryScene', VictoryScene);
    
    // Start with the preloader scene
    this.scene.start('PreloaderScene');
  }
}
