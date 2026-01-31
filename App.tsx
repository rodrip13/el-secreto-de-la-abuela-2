
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CardData, GameStatus, GameState, LevelResult } from './types';
import Card from './components/Card';

const COLUMNS = 5;
const ROWS = 4;
const TOTAL_CARDS = COLUMNS * ROWS;
const LEVEL_TARGETS = [5, 8, 12, 16, 20];
const INITIAL_TIME = 60;

const App: React.FC = () => {
  const [game, setGame] = useState<GameState>({
    cards: [],
    nextTarget: 1,
    maxTarget: LEVEL_TARGETS[0],
    moves: 0,
    misses: 0,
    status: 'idle',
    highlightedRow: null,
    currentLevel: 1,
    timer: INITIAL_TIME,
    levelHistory: [],
  });

  const timerRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setGame(prev => {
        if (prev.status !== 'playing') return prev;
        if (prev.timer <= 1) {
          stopTimer();
          return { ...prev, timer: 0, status: 'game_over' };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);
  }, [stopTimer]);

  const initializeGame = useCallback((level: number = 1, resetHistory: boolean = false, carryOverTime: number = 0) => {
    const values = Array.from({ length: TOTAL_CARDS }, (_, i) => i + 1);
    // Shuffle 1-20
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    const newCards: CardData[] = values.map((val, index) => ({
      id: index,
      value: val,
      isFlipped: false,
      isSolved: false,
      isHinted: false,
      row: Math.floor(index / COLUMNS),
      col: index % COLUMNS,
    }));

    // New rule: Time remaining from previous level adds to the base 60s
    const startingTimer = INITIAL_TIME + carryOverTime;

    setGame(prev => ({
      ...prev,
      cards: newCards,
      nextTarget: 1,
      maxTarget: LEVEL_TARGETS[level - 1],
      moves: 0,
      misses: 0,
      status: 'playing',
      highlightedRow: null,
      currentLevel: level,
      timer: startingTimer,
      levelHistory: resetHistory ? [] : prev.levelHistory,
    }));
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    initializeGame(1, true, 0);
    return () => stopTimer();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCardClick = (id: number) => {
    if (game.status !== 'playing') return;

    const clickedCard = game.cards.find(c => c.id === id);
    if (!clickedCard || clickedCard.isSolved || clickedCard.isFlipped) return;

    setGame(prev => {
      const isCorrect = clickedCard.value === prev.nextTarget;
      const newMoves = prev.moves + 1;
      const newMisses = isCorrect ? prev.misses : prev.misses + 1;
      
      // Time bonus/penalty
      let newTimer = prev.timer;
      if (isCorrect) {
        newTimer += 2;
      } else {
        newTimer = Math.max(0, newTimer - 2);
      }

      // Check if time ran out due to penalty
      if (newTimer <= 0) {
        stopTimer();
        return { ...prev, timer: 0, status: 'game_over', misses: newMisses };
      }
      
      let nextTarget = prev.nextTarget;
      let highlightedRow = null;
      let status: GameStatus = 'playing';
      let levelHistory = [...prev.levelHistory];

      const updatedCards = prev.cards.map(c => {
        if (c.id === id) {
          return { ...c, isFlipped: true, isSolved: isCorrect };
        }
        return { ...c, isHinted: false };
      });

      if (isCorrect) {
        nextTarget = prev.nextTarget + 1;
        if (nextTarget > prev.maxTarget) {
          stopTimer();
          const result: LevelResult = {
            level: prev.currentLevel,
            timeLeft: newTimer,
            misses: newMisses,
          };
          levelHistory.push(result);
          status = prev.currentLevel < LEVEL_TARGETS.length ? 'level_win' : 'game_complete';
        } else {
          const nextCard = updatedCards.find(c => c.value === nextTarget);
          if (nextCard) highlightedRow = nextCard.row;
        }
      } else {
        const correctCardId = updatedCards.find(c => c.value === nextTarget)?.id;
        const others = updatedCards
          .filter(c => !c.isSolved && c.id !== id && c.id !== correctCardId)
          .sort(() => 0.5 - Math.random())
          .slice(0, 2);
        
        const idsToHint = [correctCardId, ...others.map(c => c.id)];
        idsToHint.forEach(hintId => {
          const target = updatedCards.find(c => c.id === hintId);
          if (target) target.isHinted = true;
        });
      }

      return {
        ...prev,
        cards: updatedCards,
        nextTarget,
        moves: newMoves,
        misses: newMisses,
        highlightedRow,
        status,
        timer: newTimer,
        levelHistory,
      };
    });

    if (clickedCard.value !== game.nextTarget) {
      setTimeout(() => {
        setGame(prev => ({
          ...prev,
          cards: prev.cards.map(c => c.id === id ? { ...c, isFlipped: false } : c)
        }));
      }, 800);
    }
  };

  const nextLevel = () => {
    // Pass the remaining timer as carry-over time
    initializeGame(game.currentLevel + 1, false, game.timer);
  };

  const restartFullGame = () => {
    initializeGame(1, true, 0);
  };

  return (
    <div className="min-h-screen py-8 px-4 flex flex-col items-center bg-slate-950 text-slate-100">
      {/* Header & Level Info */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              NIVEL {game.currentLevel}
            </h1>
            <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-400 border border-slate-700">
              Meta: 1 al {game.maxTarget}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 justify-center md:justify-start">
            <span className="text-emerald-400 text-sm font-bold">Acierto: +2s</span>
            <span className="text-rose-500 text-sm font-bold">Fallo: -2s</span>
            <span className="text-blue-400 text-sm font-bold italic">Acumulable: ¡El tiempo sobrante se suma al siguiente nivel!</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px] shadow-xl">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Próximo</span>
            <span className="text-3xl font-black text-blue-400 leading-none">
              {game.nextTarget <= game.maxTarget ? game.nextTarget : '✔'}
            </span>
          </div>
          <div className={`bg-slate-900 border px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px] shadow-xl transition-colors duration-300 ${game.timer <= 10 ? 'border-rose-500 bg-rose-500/10' : 'border-slate-800'}`}>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Tiempo</span>
            <span className={`text-3xl font-black font-mono leading-none ${game.timer <= 10 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
              {formatTime(game.timer)}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px] shadow-xl">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Fallos</span>
            <span className="text-3xl font-black text-rose-500 leading-none">{game.misses}</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 items-start">
        {/* Game Board */}
        <main className="flex-grow w-full relative">
          <div className="p-6 md:p-8 rounded-[3rem] bg-slate-900/40 border border-white/5 backdrop-blur-sm shadow-2xl">
            <div className="grid grid-cols-5 gap-y-4 gap-x-6 md:gap-x-12 lg:gap-x-16">
              {game.cards.map((card) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  onClick={handleCardClick}
                  isRowHighlighted={game.highlightedRow === card.row}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Sidebar History */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-slate-900/80 border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-md">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              HISTORIAL
            </h3>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {game.levelHistory.length === 0 && (
                <div className="text-slate-600 text-sm italic text-center py-4">Completa niveles para ver resultados</div>
              )}
              {game.levelHistory.map((res, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-white/5">
                  <div>
                    <span className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest">Nivel {res.level}</span>
                    <span className="text-lg font-black text-emerald-400">Restante: {formatTime(res.timeLeft)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fallos</span>
                    <span className="text-lg font-black text-rose-500">{res.misses}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={restartFullGame}
              className="w-full mt-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              REINICIAR TODO
            </button>
          </div>
        </aside>
      </div>

      {/* Level Win Overlay */}
      {game.status === 'level_win' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 border-2 border-blue-500/30 rounded-[4rem] p-12 max-w-md w-full text-center shadow-2xl">
            <h2 className="text-5xl font-black text-white mb-2 italic">¡NIVEL {game.currentLevel} LISTO!</h2>
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-3xl mb-6">
              <p className="text-blue-400 font-bold">¡Bono de tiempo!</p>
              <p className="text-sm text-slate-400">Tus {formatTime(game.timer)} restantes se sumarán a los 60s del siguiente nivel.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-slate-800 rounded-3xl">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tiempo Restante</p>
                <p className="text-2xl font-black text-emerald-400">{formatTime(game.levelHistory[game.levelHistory.length - 1].timeLeft)}</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-3xl">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Fallos</p>
                <p className="text-2xl font-black text-rose-500">{game.levelHistory[game.levelHistory.length - 1].misses}</p>
              </div>
            </div>
            <button 
              onClick={nextLevel}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white text-xl font-black rounded-3xl transition-all shadow-xl"
            >
              SIGUIENTE NIVEL
            </button>
          </div>
        </div>
      )}

      {/* Game Complete Overlay */}
      {game.status === 'game_complete' && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6">
          <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-[4rem] p-16 max-w-2xl w-full text-center shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500"></div>
            <h2 className="text-6xl font-black text-white mb-2 italic">¡CAMPEÓN!</h2>
            <p className="text-slate-400 mb-8">Has dominado todos los niveles antes de que el tiempo se agote.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="text-center">
                <p className="text-xs font-bold text-slate-500 uppercase">Fallos Totales</p>
                <p className="text-4xl font-black text-rose-500">{game.levelHistory.reduce((a, b) => a + b.misses, 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-500 uppercase">Niveles</p>
                <p className="text-4xl font-black text-emerald-400">5/5</p>
              </div>
            </div>

            <button 
              onClick={restartFullGame}
              className="w-full py-6 bg-white hover:bg-emerald-50 text-slate-900 text-2xl font-black rounded-[2rem] transition-all shadow-xl"
            >
              JUGAR DE NUEVO
            </button>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {game.status === 'game_over' && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-900 border-2 border-rose-500/30 rounded-[4rem] p-16 max-w-xl w-full text-center shadow-2xl">
            <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-6xl font-black text-white mb-4 italic">¡TIEMPO AGOTADO!</h2>
            <p className="text-slate-400 mb-10 text-lg">Te quedaste sin tiempo en el Nivel {game.currentLevel}.</p>
            
            <button 
              onClick={restartFullGame}
              className="w-full py-6 bg-rose-600 hover:bg-rose-500 text-white text-2xl font-black rounded-3xl transition-all shadow-xl active:scale-95"
            >
              REINTENTAR DESAFÍO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
