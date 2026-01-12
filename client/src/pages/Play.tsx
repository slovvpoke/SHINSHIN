import { useEffect } from 'react';
import { GameBoard, StatusBar, TwitchChat, useGameStore, initSocketListeners } from '@/features/game';

export default function Play() {
  const connected = useGameStore((s) => s.connected);
  const gameState = useGameStore((s) => s.gameState);
  const chatMessages = useGameStore((s) => s.chatMessages);
  
  // Winner chat filter
  const winnerMessages = gameState?.winner 
    ? chatMessages.filter(m => m.username.toLowerCase() === gameState.winner?.toLowerCase())
    : [];
  
  useEffect(() => {
    initSocketListeners();
  }, []);
  
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
          
          {/* Winner's chat (small box) - only when winner is selected */}
          {gameState.winner && winnerMessages.length > 0 && (
            <div className="winner-chat">
              <div className="winner-chat__header">{gameState.winner}</div>
              <div className="winner-chat__messages">
                {winnerMessages.slice(-10).map((msg, i) => (
                  <div key={`${msg.ts}-${i}`} className="winner-chat__message">
                    {msg.message}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Footer branding */}
          <div className="footer-brand">
            <span className="footer-brand__twitch">Twitch: TRAVISPERKIIINS</span>
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
