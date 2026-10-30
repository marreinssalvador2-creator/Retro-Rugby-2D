/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, X, Shield, Target, Zap, ArrowRight, Award } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#0f172a] border-2 border-slate-700 max-w-xl w-full rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1e293b] px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="text-amber-400" size={22} />
            <h2 className="font-retro text-sm text-amber-400 tracking-wide">REGLAS DE RUGBY Y CONTROLES</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 font-sans text-sm text-slate-300">
          {/* Controls Table */}
          <div>
            <h3 className="font-retro text-xs text-emerald-400 uppercase tracking-wider mb-2">Controles y Mecánicas</h3>
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div><strong className="text-white font-mono">En Ataque:</strong> Correr automático hacia adelante</div>
              <div><strong className="text-white font-mono">W / S (↑ / ↓):</strong> Amagar y esquivar a los costados</div>
              <div><strong className="text-white font-mono">Gesto Pase:</strong> Deslizá adelante y luego al apoyo</div>
              <div><strong className="text-white font-mono">Conversión:</strong> 1° Click Dirección, 2° Click Potencia</div>
              <div><strong className="text-white font-mono">Stamina:</strong> Correr mucho cansa a los jugadores</div>
              <div><strong className="text-white font-mono">Q:</strong> Patada al cajón / Drop</div>
              <div><strong className="text-white font-mono">F / Tackle:</strong> Tackle en defensa / Empuje</div>
              <div><strong className="text-white font-mono">E:</strong> Cambiar defensor más cercano</div>
            </div>
          </div>

          {/* Key Rugby Rules */}
          <div className="space-y-3">
            <h3 className="font-retro text-xs text-amber-400 uppercase tracking-wider">Reglas Fundamentales (Rugby Union)</h3>

            <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
              <Shield className="text-amber-400 shrink-0 mt-0.5" size={18} />
              <div>
                <strong className="text-white block font-semibold mb-0.5">Forwards vs Backs</strong>
                <span>Los <strong>8 forwards</strong> (delanteros) llevan casco/scrum cap protector, son más pesados, empujan en rucks y scrums pero corren más lentos. Los <strong>backs</strong> juegan sin casco y los de la punta (wings #11 y #14) vuelan con máxima velocidad.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
              <Award className="text-amber-400 shrink-0 mt-0.5" size={18} />
              <div>
                <strong className="text-white block font-semibold mb-0.5">Conversión a los Palos (+2 Pts)</strong>
                <span>Al marcar Try, pateás a los postes H: clickeá una vez para trabar la aguja de dirección y clickeá de nuevo para clavar la potencia deseada.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
              <Target className="text-amber-400 shrink-0 mt-0.5" size={18} />
              <div>
                <strong className="text-white block font-semibold mb-0.5">Defensa, Tackles y Contra-Ruck</strong>
                <span>Cuando el rival ataca, acercate y apretá Tackle o clickeá para derribarlo. En el ruck resultante, tocá rápido para robar la pelota en contra-ruck.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
              <Zap className="text-amber-400 shrink-0 mt-0.5" size={18} />
              <div>
                <strong className="text-white block font-semibold mb-0.5">Fatiga y Resistencia (Stamina)</strong>
                <span>Los jugadores se van cansando tras carreras largas o piques continuos y correrán más despacio. Descansar y armar fases les permite recuperar el aire.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#1e293b] px-6 py-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-retro text-xs rounded-lg transition-transform cursor-pointer"
          >
            ENTENDIDO
          </button>
        </div>
      </div>
    </div>
  );
};
