import React, { useEffect } from 'react';
import Game from './game/Game';
import './App.css';

function App() {
  useEffect(() => {
    // Initialize the game
    const game = new Game('game-container');
    
    // Cleanup on component unmount
    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div className="App">
      <div id="game-container"></div>
    </div>
  );
}

export default App;
