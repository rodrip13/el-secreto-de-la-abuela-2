
export interface CardData {
  id: number;
  value: number;
  isFlipped: boolean;
  isSolved: boolean;
  isHinted: boolean;
  row: number;
  col: number;
}

export type GameStatus = 'idle' | 'playing' | 'level_win' | 'game_complete' | 'game_over';

export interface LevelResult {
  level: number;
  timeLeft: number;
  misses: number;
}

export interface GameState {
  cards: CardData[];
  nextTarget: number;
  maxTarget: number;
  moves: number;
  misses: number;
  status: GameStatus;
  highlightedRow: number | null;
  currentLevel: number;
  timer: number;
  levelHistory: LevelResult[];
}
