import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, initSocketListeners } from '@/features/game';

export default function Host() {
  const connected = useGameStore((s) => s.connected);
  const gameState = useGameStore((s) => s.gameState);
  const twitchStatus = useGameStore((s) => s.twitchStatus);
  const isHost = useGameStore((s) => s.isHost);
  const forceEnabled = useGameStore((s) => s.forceEnabled);
  
  const login = useGameStore((s) => s.login);
  const logout = useGameStore((s) => s.logout);
  const updateConfig = useGameStore((s) => s.updateConfig);
  const pickWinner = useGameStore((s) => s.pickWinner);
  const startRound = useGameStore((s) => s.startRound);
  const resetGame = useGameStore((s) => s.resetGame);
  const clearParticipants = useGameStore((s) => s.clearParticipants);
  const forceMaxWin = useGameStore((s) => s.forceMaxWin);
  const cancelForce = useGameStore((s) => s.cancelForce);
  
  // Local state
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [targetAvg, setTargetAvg] = useState(9000);
  const [maxWin, setMaxWin] = useState(20000);
  const [manualWinner, setManualWinner] = useState('');
  const [message, setMessage] = useState('');
  
  // Force modal state
  const [showForceModal, setShowForceModal] = useState(false);
  const [forceMode, setForceMode] = useState<'NEXT_ROUND' | 'THIS_ROUND'>('NEXT_ROUND');
  const [forcePassword, setForcePassword] = useState('');
  const [forceError, setForceError] = useState('');
  
  useEffect(() => {
    initSocketListeners();
  }, []);
  
  useEffect(() => {
    if (gameState) {
      setTargetAvg(gameState.targetAvg);
      setMaxWin(gameState.maxWin);
    }
  }, [gameState?.targetAvg, gameState?.maxWin]);
  
  const handleLogin = async () => {
    setLoginError('');
    const result = await login(password);
    if (!result.ok) {
      setLoginError(result.error || 'Ошибка входа');
    }
    setPassword('');
  };
  
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };
  
  const handlePickWinner = async (manual?: string) => {
    const result = await pickWinner(manual);
    if (result.ok) {
      showMessage(`Победитель: ${result.winner}`);
    } else {
      showMessage(result.error || 'Ошибка');
    }
    setManualWinner('');
  };
  
  const handleStartRound = async () => {
    const result = await startRound();
    if (result.ok) {
      showMessage('Раунд начался!');
    } else {
      showMessage(result.error || 'Ошибка');
    }
  };
  
  const handleForceMaxWin = async () => {
    setForceError('');
    const result = await forceMaxWin(forceMode, forcePassword);
    if (result.ok) {
      setShowForceModal(false);
      setForcePassword('');
      showMessage(forceMode === 'NEXT_ROUND' 
        ? 'Force Max Win активирован на следующий раунд' 
        : 'Force Max Win применён к текущему раунду');
    } else {
      setForceError(result.error || 'Ошибка');
    }
  };
  
  // Login screen
  if (!isHost) {
    return (
      <div className="min-h-screen bg-cs-darker flex items-center justify-center p-4">
        <motion.div
          className="bg-cs-dark/90 backdrop-blur-sm rounded-xl p-8 border border-cs-gold/30 w-full max-w-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h1 className="text-2xl font-bold text-cs-gold text-center mb-6">
            Host Panel
          </h1>
          <p className="text-gray-400 text-center mb-6">
            Панель управления
          </p>
          
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль администратора"
              className="w-full bg-cs-darker border border-cs-gold/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cs-gold"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            
            {loginError && (
              <p className="text-cs-red text-sm text-center">{loginError}</p>
            )}
            
            <button
              onClick={handleLogin}
              className="w-full bg-cs-gold text-cs-darker font-bold py-3 rounded-lg hover:bg-cs-orange transition-colors"
            >
              Войти
            </button>
          </div>
          
          <div className="mt-6 text-center text-gray-500 text-sm">
            {connected ? (
              <span className="text-cs-green">● Подключено к серверу</span>
            ) : (
              <span className="text-cs-red">● Нет соединения</span>
            )}
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Host panel
  return (
    <div className="min-h-screen bg-cs-darker p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-cs-gold">Host Panel</h1>
            <p className="text-gray-400">Управление</p>
          </div>
          <button
            onClick={logout}
            className="bg-cs-red/20 text-cs-red px-4 py-2 rounded-lg hover:bg-cs-red/30 transition-colors"
          >
            Выйти
          </button>
        </div>
        
        {/* Message toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              className="fixed top-4 right-4 bg-cs-green/20 border border-cs-green/50 text-cs-green px-6 py-3 rounded-lg z-50"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Status & Config */}
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-cs-dark/80 rounded-xl p-6 border border-cs-gold/30">
              <h2 className="text-lg font-bold text-white mb-4">Статус</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Сервер:</span>
                  <span className={connected ? 'text-cs-green' : 'text-cs-red'}>
                    {connected ? '● Онлайн' : '● Офлайн'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Twitch:</span>
                  <span className={twitchStatus?.connected ? 'text-cs-green' : 'text-cs-red'}>
                    {twitchStatus?.connected ? `● ${twitchStatus.channel}` : '● Отключен'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Статус игры:</span>
                  <span className="text-cs-gold">{gameState?.status || 'IDLE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Force Mode:</span>
                  <span className={gameState?.forceMode !== 'NONE' ? 'text-cs-orange' : 'text-gray-500'}>
                    {gameState?.forceMode || 'NONE'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Configuration */}
            <div className="bg-cs-dark/80 rounded-xl p-6 border border-cs-gold/30">
              <h2 className="text-lg font-bold text-white mb-4">Настройки</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">
                    Средний выигрыш (targetAvg)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={targetAvg}
                      onChange={(e) => setTargetAvg(Number(e.target.value))}
                      className="flex-1 bg-cs-darker border border-cs-gold/30 rounded-lg px-3 py-2 text-white"
                    />
                    <button
                      onClick={() => updateConfig({ targetAvg })}
                      className="bg-cs-gold/20 text-cs-gold px-4 py-2 rounded-lg hover:bg-cs-gold/30"
                    >
                      ✓
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">
                    Максимальный выигрыш (maxWin)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={maxWin}
                      onChange={(e) => setMaxWin(Number(e.target.value))}
                      className="flex-1 bg-cs-darker border border-cs-gold/30 rounded-lg px-3 py-2 text-white"
                    />
                    <button
                      onClick={() => updateConfig({ maxWin })}
                      className="bg-cs-gold/20 text-cs-gold px-4 py-2 rounded-lg hover:bg-cs-gold/30"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Force Max Win Controls */}
            {forceEnabled && (
              <div className="bg-cs-dark/80 rounded-xl p-6 border border-cs-orange/50">
                <h2 className="text-lg font-bold text-cs-orange mb-4">Force Max Win</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Гарантированный максимальный выигрыш.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setForceMode('NEXT_ROUND');
                      setShowForceModal(true);
                    }}
                    disabled={gameState?.forceMode !== 'NONE'}
                    className="w-full bg-cs-orange/20 text-cs-orange px-4 py-3 rounded-lg hover:bg-cs-orange/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Следующий раунд
                  </button>
                  <button
                    onClick={() => {
                      setForceMode('THIS_ROUND');
                      setShowForceModal(true);
                    }}
                    disabled={gameState?.status !== 'PLAYING'}
                    className="w-full bg-cs-red/20 text-cs-red px-4 py-3 rounded-lg hover:bg-cs-red/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Этот раунд
                  </button>
                  {gameState?.forceMode !== 'NONE' && (
                    <button
                      onClick={cancelForce}
                      className="w-full bg-gray-600/20 text-gray-400 px-4 py-2 rounded-lg hover:bg-gray-600/30 text-sm"
                    >
                      Отменить
                    </button>
                  )}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Статус: <span className={gameState?.forceMode !== 'NONE' ? 'text-cs-orange' : 'text-gray-500'}>
                    {gameState?.forceMode === 'NONE' ? 'OFF' : gameState?.forceMode}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Center: Game Controls */}
          <div className="space-y-6">
            {/* Current Round Info */}
            <div className="bg-cs-dark/80 rounded-xl p-6 border border-cs-gold/30">
              <h2 className="text-lg font-bold text-white mb-4">Текущий раунд</h2>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-cs-darker rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Победитель</div>
                  <div className="text-cs-gold text-xl font-bold truncate">
                    {gameState?.winner || '—'}
                  </div>
                </div>
                <div className="bg-cs-darker rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Банк</div>
                  <div className="text-cs-green text-xl font-bold">
                    {gameState?.bank.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="bg-cs-darker rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Ходы</div>
                  <div className="text-white text-xl font-bold">
                    {gameState?.pickIndex || 0} / {gameState?.maxPicks || 10}
                  </div>
                </div>
                <div className="bg-cs-darker rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Профиль</div>
                  <div className={`text-xl font-bold ${
                    gameState?.profile === 'jackpot' ? 'text-cs-gold' :
                    gameState?.profile === 'low' ? 'text-cs-red' : 'text-white'
                  }`}>
                    {gameState?.profile || '—'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="bg-cs-dark/80 rounded-xl p-6 border border-cs-gold/30">
              <h2 className="text-lg font-bold text-white mb-4">Действия</h2>
              <div className="space-y-3">
                {/* Pick Winner */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualWinner}
                    onChange={(e) => setManualWinner(e.target.value)}
                    placeholder="Вручную (имя)"
                    className="flex-1 bg-cs-darker border border-cs-gold/30 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                  />
                  <button
                    onClick={() => handlePickWinner(manualWinner || undefined)}
                    disabled={!gameState?.participants.length && !manualWinner}
                    className="bg-cs-purple/20 text-cs-purple px-4 py-2 rounded-lg hover:bg-cs-purple/30 disabled:opacity-50"
                  >
                    Выбрать
                  </button>
                </div>
                <button
                  onClick={() => handlePickWinner()}
                  disabled={!gameState?.participants.length}
                  className="w-full bg-cs-cyan/20 text-cs-cyan px-4 py-3 rounded-lg hover:bg-cs-cyan/30 disabled:opacity-50"
                >
                  Случайный победитель
                </button>
                <button
                  onClick={handleStartRound}
                  disabled={!gameState?.winner || gameState?.status === 'PLAYING'}
                  className="w-full bg-cs-green/20 text-cs-green px-4 py-3 rounded-lg hover:bg-cs-green/30 disabled:opacity-50"
                >
                  Начать раунд
                </button>
                <button
                  onClick={resetGame}
                  className="w-full bg-cs-red/20 text-cs-red px-4 py-3 rounded-lg hover:bg-cs-red/30"
                >
                  Сбросить игру
                </button>
              </div>
            </div>
          </div>
          
          {/* Right: Participants */}
          <div className="bg-cs-dark/80 rounded-xl p-6 border border-cs-gold/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">
                Участники ({gameState?.participants.length || 0})
              </h2>
              <button
                onClick={clearParticipants}
                className="text-cs-red text-sm hover:underline"
              >
                Очистить
              </button>
            </div>
            <div className="h-96 overflow-y-auto space-y-1">
              {gameState?.participants.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  Пока нет участников.<br />
                  Зрители пишут <span className="text-cs-gold">легенда</span> в чат.
                </p>
              )}
              {gameState?.participants.map((p, i) => (
                <div
                  key={`${p}-${i}`}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    p === gameState.winner
                      ? 'bg-cs-gold/20 text-cs-gold border border-cs-gold/50'
                      : 'bg-cs-darker text-gray-300'
                  }`}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Force Max Win Confirmation Modal */}
      <AnimatePresence>
        {showForceModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForceModal(false)}
          >
            <motion.div
              className="bg-cs-dark rounded-xl p-6 border border-cs-orange w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-cs-orange mb-4">
                Подтверждение Force Max Win
              </h2>
              <p className="text-gray-400 mb-4">
                {forceMode === 'NEXT_ROUND'
                  ? 'Следующий раунд будет гарантированно с максимальным выигрышем.'
                  : 'Оставшиеся тайлы будут изменены для достижения максимального выигрыша СЕЙЧАС.'}
              </p>
              <p className="text-cs-red text-sm mb-4">
                Действие будет записано в аудит-лог.
              </p>
              
              <input
                type="password"
                value={forcePassword}
                onChange={(e) => setForcePassword(e.target.value)}
                placeholder="Введите пароль для подтверждения"
                className="w-full bg-cs-darker border border-cs-orange/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 mb-4"
                onKeyDown={(e) => e.key === 'Enter' && handleForceMaxWin()}
              />
              
              {forceError && (
                <p className="text-cs-red text-sm mb-4">{forceError}</p>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowForceModal(false);
                    setForcePassword('');
                    setForceError('');
                  }}
                  className="flex-1 bg-gray-600/20 text-gray-400 py-3 rounded-lg hover:bg-gray-600/30"
                >
                  Отмена
                </button>
                <button
                  onClick={handleForceMaxWin}
                  disabled={!forcePassword}
                  className="flex-1 bg-cs-orange text-cs-darker font-bold py-3 rounded-lg hover:bg-cs-gold disabled:opacity-50"
                >
                  Подтвердить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
