/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Target, Shield, RefreshCw } from 'lucide-react';

interface TouchControlsProps {
  onDirectionChange: (x: number, y: number) => void;
  onSprintToggle: (sprint: boolean) => void;
  onPass: () => void;
  onKick: () => void;
  onTackle: () => void;
  onSwitchPlayer: () => void;
  visible?: boolean;
  isDefending?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onDirectionChange,
  onSprintToggle,
  onPass,
  onKick,
  onTackle,
  onSwitchPlayer,
  visible = true,
  isDefending = false,
}) => {
  const dpadRef = useRef<HTMLDivElement>(null);
  const activeTouches = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!visible) return null;

  const handleDpadTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!dpadRef.current) return;
    const rect = dpadRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const deadzone = 12;

    let dirX = 0;
    let dirY = 0;

    if (Math.abs(dx) > deadzone) dirX = Math.sign(dx);
    if (Math.abs(dy) > deadzone) dirY = Math.sign(dy);

    activeTouches.current = { x: dirX, y: dirY };
    onDirectionChange(dirX, dirY);
  };

  const handleDpadEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    activeTouches.current = { x: 0, y: 0 };
    onDirectionChange(0, 0);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex justify-between items-end p-4 pb-6">
      {/* Left: Directional D-Pad with Auto-Forward hint */}
      <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
        {!isDefending && (
          <div className="text-[9px] font-retro text-amber-300 bg-slate-900/80 px-2 py-0.5 rounded border border-amber-500/50 shadow animate-pulse">
            ↕ DESLIZÁ ARRIBA/ABAJO PARA ESQUIVAR
          </div>
        )}
        <div 
          ref={dpadRef}
          onTouchStart={handleDpadTouch}
          onTouchMove={handleDpadTouch}
          onTouchEnd={handleDpadEnd}
          className="w-32 h-32 rounded-full bg-slate-900/70 border border-slate-700/70 backdrop-blur-xs relative flex items-center justify-center touch-none shadow-xl active:bg-slate-900/90"
        >
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-600/60 flex items-center justify-center text-slate-400">
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
          </div>
          <ArrowUp className={`absolute top-2 transition-colors ${!isDefending ? 'text-amber-300 animate-bounce' : 'text-slate-400'}`} size={20} />
          <ArrowDown className={`absolute bottom-2 transition-colors ${!isDefending ? 'text-amber-300 animate-bounce' : 'text-slate-400'}`} size={20} />
          <ArrowLeft className={`absolute left-2 ${!isDefending ? 'text-slate-600' : 'text-slate-400'}`} size={16} />
          <ArrowRight className={`absolute right-2 ${!isDefending ? 'text-emerald-400' : 'text-slate-400'}`} size={16} />
        </div>
      </div>

      {/* Right: Rugby Action Buttons */}
      <div className="pointer-events-auto grid grid-cols-2 gap-2.5">
        {/* Pass Button */}
        <button
          onTouchStart={(e) => { e.preventDefault(); onPass(); }}
          onClick={onPass}
          className="w-16 h-16 rounded-xl bg-amber-500 active:bg-amber-600 text-slate-950 font-retro text-[9px] flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-transform border border-amber-300"
        >
          <Target size={18} />
          <span>PASE</span>
        </button>

        {/* Kick Button */}
        <button
          onTouchStart={(e) => { e.preventDefault(); onKick(); }}
          onClick={onKick}
          className="w-16 h-16 rounded-xl bg-blue-600 active:bg-blue-700 text-white font-retro text-[9px] flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-transform border border-blue-400"
        >
          <Zap size={18} />
          <span>PATEAR</span>
        </button>

        {/* Sprint / Tackle Button */}
        <button
          onTouchStart={(e) => { 
            e.preventDefault(); 
            onSprintToggle(true); 
            if (isDefending) onTackle(); 
          }}
          onTouchEnd={(e) => { e.preventDefault(); onSprintToggle(false); }}
          onMouseDown={() => { 
            onSprintToggle(true); 
            if (isDefending) onTackle(); 
          }}
          onMouseUp={() => onSprintToggle(false)}
          className={`w-16 h-16 rounded-xl font-retro text-[8px] flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-transform border ${
            isDefending 
              ? 'bg-rose-600 active:bg-rose-700 text-white border-rose-400' 
              : 'bg-emerald-600 active:bg-emerald-700 text-white border-emerald-400'
          }`}
        >
          <Shield size={18} />
          <span>{isDefending ? 'TACKLE' : 'TURBO'}</span>
        </button>

        {/* Switch Defender Button - ONLY allowed in defense! */}
        <button
          disabled={!isDefending}
          onTouchStart={(e) => { 
            e.preventDefault(); 
            if (isDefending) onSwitchPlayer(); 
          }}
          onClick={() => { 
            if (isDefending) onSwitchPlayer(); 
          }}
          className={`w-16 h-16 rounded-xl font-retro text-[8px] flex flex-col items-center justify-center gap-1 shadow-lg transition-transform border ${
            isDefending 
              ? 'bg-purple-600 active:bg-purple-700 text-white border-purple-400 active:scale-95' 
              : 'bg-slate-800/40 text-slate-500 border-slate-700/40 opacity-30 cursor-not-allowed'
          }`}
          title={isDefending ? 'Cambiar defensor' : 'En ataque solo controlas al portador'}
        >
          <RefreshCw size={18} />
          <span>{isDefending ? 'CAMBIAR' : 'ATAQUE'}</span>
        </button>
      </div>
    </div>
  );
};
