
import React from 'react';
import { CardData } from '../types';

interface CardProps {
  card: CardData;
  onClick: (id: number) => void;
  isRowHighlighted: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, isRowHighlighted }) => {
  const isDisabled = card.isSolved;
  const showContent = card.isFlipped || card.isSolved;

  return (
    <div 
      className={`relative w-full aspect-[4/5] md:aspect-[3/4] cursor-pointer perspective-1000 group transition-all duration-300 
        ${card.isHinted ? 'scale-105 z-20' : 'z-10'}
        ${isRowHighlighted && !card.isSolved ? 'ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : ''}
      `}
      onClick={() => !isDisabled && onClick(card.id)}
    >
      <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${showContent ? 'rotate-y-180' : ''}`}>
        
        {/* Front (Hidden state) */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl border-2 flex items-center justify-center transition-colors duration-300
          ${card.isHinted 
            ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]' 
            : isRowHighlighted
              ? 'bg-slate-800 border-emerald-500/50'
              : 'bg-slate-800 border-slate-700 hover:border-blue-400 group-hover:bg-slate-700'}
        `}>
          <div className={`rounded-full border-2 flex items-center justify-center transition-all duration-300
            ${isRowHighlighted ? 'w-12 h-12 border-emerald-500/50 bg-emerald-500/10' : 'w-10 h-10 border-slate-600'}
          `}>
            <span className={`text-sm font-bold ${isRowHighlighted ? 'text-emerald-400' : 'text-slate-500'}`}>?</span>
          </div>
        </div>

        {/* Back (Visible state) */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300
          ${card.isSolved 
            ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl' 
            : 'bg-white border-slate-200 text-slate-900 shadow-inner'}
        `}>
          <span className="text-3xl md:text-5xl font-black tracking-tighter">{card.value}</span>
          {card.isSolved && (
            <div className="absolute top-2 right-2">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-emerald-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
