import { useGameStore } from './store';

export function StatusBar() {
  const gameState = useGameStore((s) => s.gameState);
  const twitchStatus = useGameStore((s) => s.twitchStatus);
  
  if (!gameState) return null;
  
  const { status, winner, bank, participants } = gameState;
  
  return (
    <div className="status-bar">
      {/* Left: Stream info */}
      <div className="status-card">
        <div className="status-card__header">
          <div className="status-card__avatar">⭐</div>
          <div>
            <div className="status-card__name">shinneeshinn</div>
            <div className="status-card__label">MINES GIVEAWAY</div>
          </div>
        </div>
        <div className="status-card__twitch">
          <span className={`status-dot ${twitchStatus?.connected ? 'status-dot--online' : 'status-dot--offline'}`} />
          <span>{twitchStatus?.connected ? `Twitch: ${twitchStatus.channel}` : 'Twitch: отключен'}</span>
        </div>
      </div>
      
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
