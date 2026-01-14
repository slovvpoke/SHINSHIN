import { useEffect, useState } from 'react';
import { GameBoard, StatusBar, TwitchChat, useGameStore, initSocketListeners } from '@/features/game';

const followsSound = new Audio('/assets/spiderman-meme-song-2-0.mp3');
followsSound.volume = 0.5;

export default function Play() {
  const connected = useGameStore((s) => s.connected);
  const gameState = useGameStore((s) => s.gameState);
  const chatMessages = useGameStore((s) => s.chatMessages);
  
  // Winner chat dropdown state
  const [showWinnerDropdown, setShowWinnerDropdown] = useState(false);
  
  // Winner chat filter - only messages AFTER winner was selected
  const winnerMessages = gameState?.winner && gameState?.winnerSelectedAt
    ? chatMessages.filter(m => 
        m.username.toLowerCase() === gameState.winner?.toLowerCase() &&
        m.ts >= (gameState.winnerSelectedAt || 0)
      )
    : [];
  
  useEffect(() => {
    initSocketListeners();
  }, []);
  
  // Open viewer card in new window
  const openViewerCard = () => {
    if (gameState?.winner) {
      window.open(
        `https://www.twitch.tv/popout/shinneeshinn/viewercard/${gameState.winner.toLowerCase()}`,
        'viewercard',
        'width=400,height=600'
      );
    }
    setShowWinnerDropdown(false);
  };
  
  const openFollowsTool = async () => {
    if (gameState?.winner) {
      followsSound.currentTime = 0;
      followsSound.play().catch(() => {});
      window.open(`https://tools.2807.eu/follows?user=${encodeURIComponent(gameState.winner)}`, '_blank');
    }
    setShowWinnerDropdown(false);
  };
  
  return (
    <div className="play-page">
      {/* Connection overlay */}
      {!connected && (
        <div className="connection-overlay">
          <div className="connection-box">
            <div className="connection-box__title">Нет соединения</div>
            <div className="connection-box__text">Подключение к серверу...</div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      {connected && gameState && (
        <>
          <StatusBar />
          <GameBoard />
          
          {/* Twitch Chat on the right */}
          <TwitchChat />
          
          {/* Winner's chat (top left) - only when winner is selected */}
          {gameState.winner && (
            <div className="winner-chat">
              <div 
                className="winner-chat__header"
                onClick={() => setShowWinnerDropdown(!showWinnerDropdown)}
              >
                {gameState.winner}
                <span className="winner-chat__arrow">{showWinnerDropdown ? '▲' : '▼'}</span>
              </div>
              
              {/* Dropdown menu */}
              {showWinnerDropdown && (
                <div className="winner-chat__dropdown">
                  <button className="winner-chat__dropdown-btn" onClick={openViewerCard}>
                    Сообщения
                  </button>
                  <button className="winner-chat__dropdown-btn" onClick={openFollowsTool}>
                    Фолловы
                  </button>
                </div>
              )}
              
              <div className="winner-chat__messages">
                {winnerMessages.length === 0 ? (
                  <div className="winner-chat__empty">Нет сообщений</div>
                ) : (
                  winnerMessages.slice(-10).map((msg, i) => (
                    <div key={`${msg.ts}-${i}`} className="winner-chat__message">
                      {msg.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Centered branding at bottom */}
          <div className="footer-brand">
            <span className="footer-brand__name">TRAVISPERKIIINS</span>
          </div>
        </>
      )}
      
      {/* Loading state */}
      {connected && !gameState && (
        <div className="connection-overlay" style={{ background: 'transparent' }}>
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
