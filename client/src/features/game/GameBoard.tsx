import { useState, useEffect, useRef } from 'react';
import { Tile } from './Tile';
import { useGameStore, type Outcome } from './store';

const rerollSound = new Audio('/assets/oh-no-cringe.mp3');
rerollSound.volume = 0.6;

const pickSound = new Audio('/assets/sound-effect-they-see-me-rolling-audiotrimmer.mp3');
pickSound.volume = 0.5;

function formatOutcome(outcome: Outcome): { text: string; className: string } {
  switch (outcome.t) {
    case 'ADD':
      return { text: `+${outcome.amount?.toLocaleString()}`, className: 'center-hub__value--green' };
    case 'MULT':
      return { text: `×${outcome.value}`, className: 'center-hub__value--gold' };
    case 'STOP':
      return { text: 'БАХ!', className: 'center-hub__value--red' };
    default:
      return { text: '', className: '' };
  }
}

export function GameBoard() {
  const gameState = useGameStore((s) => s.gameState);
  const lastRevealedTile = useGameStore((s) => s.lastRevealedTile);
  const lastOutcome = useGameStore((s) => s.lastOutcome);
  const pickWinner = useGameStore((s) => s.pickWinner);
  const startRound = useGameStore((s) => s.startRound);
  const playerResetGame = useGameStore((s) => s.playerResetGame);
  
  // In-circle winner selection state
  const [rollingName, setRollingName] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showWinnerActions, setShowWinnerActions] = useState(false);
  const rollIntervalRef = useRef<number | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    };
  }, []);
  
  if (!gameState) return null;
  
  const { skins, openedTiles, status, pickIndex, maxPicks, bank, winner, participants } = gameState;
  const tileCount = 14;
  
  // Handle center click - pick random winner with animation in circle
  const handleCenterClick = async () => {
    if (status !== 'IDLE' || participants.length === 0 || isRolling) return;
    
    setIsRolling(true);
    setShowWinnerActions(false);
    
    pickSound.currentTime = 0;
    pickSound.play().catch(() => {});
    
    const rollDuration = (pickSound.duration || 2) * 1000;
    const rollInterval = 80;
    let elapsed = 0;
    
    rollIntervalRef.current = window.setInterval(() => {
      const randomIdx = Math.floor(Math.random() * participants.length);
      setRollingName(participants[randomIdx]);
      elapsed += rollInterval;
      
      if (elapsed >= rollDuration) {
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      }
    }, rollInterval);
    
    setTimeout(async () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      const result = await pickWinner();
      if (result.ok && result.winner) {
        setRollingName(result.winner);
      }
      setIsRolling(false);
    }, rollDuration);
  };
  
  // Handle click on winner name in READY state - show actions
  const handleWinnerNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'READY' || (!isRolling && rollingName)) {
      setShowWinnerActions(!showWinnerActions);
    }
  };
  
  // Handle start game
  const handleStartGame = async () => {
    const result = await startRound();
    if (result.ok) {
      setShowWinnerActions(false);
      setRollingName(null);
    }
  };
  
  // Handle reset after game ends
  const handleResetGame = async () => {
    if (status !== 'ENDED') return;
    const result = await playerResetGame();
    if (result.ok) {
      setRollingName(null);
      setShowWinnerActions(false);
    }
  };
  
  const handleReroll = async () => {
    setShowWinnerActions(false);
    setIsRolling(true);
    
    rerollSound.currentTime = 0;
    rerollSound.play().catch(() => {});
    
    const rollDuration = (rerollSound.duration || 1.5) * 1000;
    const rollInterval = 80;
    let elapsed = 0;
    
    rollIntervalRef.current = window.setInterval(() => {
      const randomIdx = Math.floor(Math.random() * participants.length);
      setRollingName(participants[randomIdx]);
      elapsed += rollInterval;
      
      if (elapsed >= rollDuration) {
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      }
    }, rollInterval);
    
    setTimeout(async () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      const result = await pickWinner();
      if (result.ok && result.winner) {
        setRollingName(result.winner);
      }
      setIsRolling(false);
    }, rollDuration);
  };
  
  // Center hub content based on status
  const renderCenterContent = () => {
    // Show rolling animation
    if (isRolling && rollingName) {
      return (
        <>
          <div className="center-hub__subtitle">Выбираем...</div>
          <div className="center-hub__winner center-hub__winner--rolling">{rollingName}</div>
        </>
      );
    }
    
    // Show selected winner before game starts (after roll, before READY)
    if (!isRolling && rollingName && status === 'IDLE') {
      return (
        <>
          <div className="center-hub__subtitle">Победитель</div>
          <div 
            className="center-hub__winner center-hub__winner--clickable"
            onClick={handleWinnerNameClick}
          >
            {rollingName}
          </div>
          {showWinnerActions && (
            <div className="center-hub__actions">
              <button className="center-hub__btn center-hub__btn--start" onClick={handleStartGame}>
                Начать
              </button>
              <button className="center-hub__btn center-hub__btn--reroll" onClick={handleReroll}>
                Рерол
              </button>
            </div>
          )}
        </>
      );
    }
    
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
            <div className="center-hub__title">SHINNEE</div>
          </>
        );
      case 'READY':
        return (
          <>
            <div className="center-hub__subtitle">Играет</div>
            <div 
              className="center-hub__winner center-hub__winner--clickable"
              onClick={handleWinnerNameClick}
            >
              {winner}
            </div>
            {showWinnerActions && (
              <div className="center-hub__actions">
                <button className="center-hub__btn center-hub__btn--start" onClick={handleStartGame}>
                  Начать
                </button>
                <button className="center-hub__btn center-hub__btn--reroll" onClick={handleReroll}>
                  Рерол
                </button>
              </div>
            )}
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
            <div 
              className="center-hub__value center-hub__value--gold center-hub__value--clickable"
              onClick={handleResetGame}
            >
              {bank.toLocaleString()}
            </div>
            <div className="center-hub__hint">Нажми для новой игры</div>
          </>
        );
      default:
        return null;
    }
  };
  
  const isCenterClickable = status === 'IDLE' && participants.length > 0 && !isRolling && !rollingName;
  
  return (
    <>
      {/* Noria wheel with lines */}
      <section className="noria">
        <i /><i /><i /><i /><i /><i /><i />
      </section>
      
      {/* Center hub */}
      <div 
        className={`center-hub ${isCenterClickable ? 'center-hub--clickable' : ''}`}
        onClick={isCenterClickable ? handleCenterClick : undefined}
      >
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
