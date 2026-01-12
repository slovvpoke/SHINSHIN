import { Tile } from './Tile';
import { useGameStore, type Outcome } from './store';

// Format outcome for center display
function formatOutcome(outcome: Outcome): { text: string; className: string } {
  switch (outcome.t) {
    case 'ADD':
      return { text: `+${outcome.amount?.toLocaleString()}`, className: 'center-hub__value--green' };
    case 'MULT':
      return { text: `×${outcome.value}`, className: 'center-hub__value--gold' };
    case 'STOP':
      return { text: 'СТОП', className: 'center-hub__value--red' };
    default:
      return { text: '', className: '' };
  }
}

export function GameBoard() {
  const gameState = useGameStore((s) => s.gameState);
  const lastRevealedTile = useGameStore((s) => s.lastRevealedTile);
  const lastOutcome = useGameStore((s) => s.lastOutcome);
  
  if (!gameState) return null;
  
  const { skins, openedTiles, status, pickIndex, maxPicks, bank, winner } = gameState;
  const tileCount = 14;
  
  // Center hub content based on status
  const renderCenterContent = () => {
    // Show outcome animation when tile is clicked
    if (lastOutcome && status === 'PLAYING') {
      const { text, className } = formatOutcome(lastOutcome);
      return (
        <>
          <div className="center-hub__subtitle">Выпало</div>
          <div className={`center-hub__value ${className}`}>{text}</div>
          <div className="center-hub__progress">{bank.toLocaleString()}</div>
        </>
      );
    }
    
    switch (status) {
      case 'IDLE':
        return (
          <>
            <div className="center-hub__title">MINES</div>
            <div className="center-hub__subtitle">GIVEAWAY</div>
          </>
        );
      case 'READY':
        return (
          <>
            <div className="center-hub__subtitle">Играет</div>
            <div className="center-hub__winner">{winner}</div>
          </>
        );
      case 'PLAYING':
        return (
          <>
            <div className="center-hub__subtitle">Банк</div>
            <div className="center-hub__value center-hub__value--green">
              {bank.toLocaleString()}
            </div>
            <div className="center-hub__progress">{pickIndex}/{maxPicks}</div>
          </>
        );
      case 'ENDED':
        return (
          <>
            <div className="center-hub__subtitle">Выигрыш</div>
            <div className="center-hub__value center-hub__value--gold">
              {bank.toLocaleString()}
            </div>
          </>
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      {/* Noria wheel with lines */}
      <section className="noria">
        <i /><i /><i /><i /><i /><i /><i />
      </section>
      
      {/* Center hub */}
      <div className="center-hub">
        {renderCenterContent()}
      </div>
      
      {/* Tiles container */}
      <section className="circle-container">
        {skins.slice(0, tileCount).map((skin, index) => {
          const opened = openedTiles[index];
          const isDisabled = status !== 'PLAYING' || pickIndex >= maxPicks;
          const isRevealing = lastRevealedTile === index;
          
          return (
            <Tile
              key={`tile-${index}`}
              index={index}
              skin={skin}
              opened={opened}
              disabled={isDisabled}
              isRevealing={isRevealing}
            />
          );
        })}
      </section>
    </>
  );
}
