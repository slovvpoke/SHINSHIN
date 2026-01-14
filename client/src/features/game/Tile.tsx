import { useGameStore, type Skin, type OpenedTile } from './store';

const tileSound = new Audio('/assets/cs2.mp3');
tileSound.volume = 0.5;

const bamSound = new Audio('/assets/bam-pew.mp3');
bamSound.volume = 0.7;

interface TileProps {
  index: number;
  skin: Skin;
  opened?: OpenedTile;
  disabled: boolean;
  isRevealing: boolean;
}

export function Tile({ index, skin, opened, disabled, isRevealing }: TileProps) {
  const clickTile = useGameStore((s) => s.clickTile);
  const status = useGameStore((s) => s.gameState?.status);
  
  const handleClick = async () => {
    if (disabled || opened || status !== 'PLAYING') return;
    tileSound.currentTime = 0;
    tileSound.play().catch(() => {});
    const result = await clickTile(index);
    if (result.ok && result.outcome?.t === 'STOP') {
      bamSound.currentTime = 0;
      bamSound.play().catch(() => {});
    }
  };
  
  const getOutcomeText = () => {
    if (!opened) return null;
    const { outcome } = opened;
    if (outcome.t === 'STOP') return 'БАХ!';
    if (outcome.t === 'ADD') return `+${outcome.amount?.toLocaleString()}`;
    if (outcome.t === 'MULT') return `×${outcome.value}`;
    return null;
  };
  
  const getOutcomeClass = () => {
    if (!opened) return '';
    const { outcome } = opened;
    if (outcome.t === 'STOP') return 'tile__outcome--stop';
    if (outcome.t === 'ADD') return 'tile__outcome--add';
    if (outcome.t === 'MULT') return 'tile__outcome--mult';
    return '';
  };
  
  // Build class names
  const tileClasses = [
    'tile',
    disabled && !opened ? 'tile--disabled' : '',
    opened ? 'tile--opened' : '',
    isRevealing ? 'tile--revealed' : '',
  ].filter(Boolean).join(' ');
  
  return (
    <div
      className={tileClasses}
      onClick={handleClick}
      role="button"
      tabIndex={disabled || opened ? -1 : 0}
    >
      {/* Skin image */}
      <img
        src={skin.image}
        alt={skin.name}
        className="tile__img"
        loading="lazy"
        draggable={false}
        onError={(e) => {
          // Fallback for broken images - use placeholder
          const img = e.target as HTMLImageElement;
          if (!img.dataset.fallback) {
            img.dataset.fallback = 'true';
            img.src = `https://placehold.co/200x150/1a1a2e/d4a84b?text=${encodeURIComponent(skin.weapon || 'CS2')}`;
          }
        }}
      />
      
      {/* Skin name below */}
      <div className="tile__name">{skin.name}</div>
      
      {/* Outcome overlay when opened */}
      {opened && (
        <div className={`tile__outcome ${getOutcomeClass()}`}>
          {getOutcomeText()}
        </div>
      )}
    </div>
  );
}
