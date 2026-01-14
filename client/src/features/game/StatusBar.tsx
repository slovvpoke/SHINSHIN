import { useGameStore } from './store';

export function StatusBar() {
  const gameState = useGameStore((s) => s.gameState);
  
  if (!gameState) return null;
  
  const { status, winner, bank, participants } = gameState;
  
  return (
    <div className="status-bar">
      {/* Left: Stream info */}
      <div>      </div>
      
      {/* Center: Status banner */}
      {status === 'IDLE' && (
        <div className="center-banner">
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Напиши </span>
          <span className="center-banner__keyword">легенда</span>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}> в чат для участия!</span>
        </div>
      )}
      
      {status === 'READY' && winner && (
        <div className="center-banner center-banner--winner">
          <span className="center-banner__winner-name">{winner}</span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}> играет!</span>
        </div>
      )}
      
      {status === 'PLAYING' && (
        <div className="center-banner">
          <span className="center-banner__keyword">ИГРА ИДЁТ</span>
        </div>
      )}
      
      {status === 'ENDED' && (
        <div className="center-banner">
          <span className="center-banner__keyword">ВЫИГРЫШ: {bank.toLocaleString()}</span>
        </div>
      )}
      
      {/* Right: Participants count only */}
      <div className="status-card stats-card">
        <div className="stats-card__grid">
          <div className="stats-card__label">Участников:</div>
          <div className="stats-card__value">{participants.length}</div>
        </div>
      </div>
    </div>
  );
}
