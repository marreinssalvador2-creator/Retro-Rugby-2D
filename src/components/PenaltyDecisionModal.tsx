/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, Users, Zap, ShieldAlert } from 'lucide-react';
import { retroAudio } from '../audio/retroAudio';
import { useTranslation } from '../i18n/context';

interface PenaltyDecisionModalProps {
  reason: string;
  onChoose: (action: 'kick_posts' | 'scrum' | 'tap_and_go') => void;
}

export const PenaltyDecisionModal: React.FC<PenaltyDecisionModalProps> = ({
  reason,
  onChoose,
}) => {
  const { t } = useTranslation();

  const handleSelect = (action: 'kick_posts' | 'scrum' | 'tap_and_go') => {
    retroAudio.playBlip();
    onChoose(action);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="w-full max-w-lg bg-slate-900 border-4 border-amber-400 rounded-2xl shadow-2xl p-5 md:p-7 flex flex-col items-center text-center">
        {/* Whistle / Alert Header */}
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400 rounded-full text-amber-300 font-retro text-[10px] md:text-xs mb-3">
          <ShieldAlert size={14} className="text-amber-400 animate-pulse" />
          <span>{t('penaltyModalSubtitle')}</span>
        </div>

        <h2 className="font-retro text-lg md:text-2xl font-black text-white tracking-wider mb-1">
          {t('penaltyModalTitle')}
        </h2>
        <p className="font-retro text-[10px] md:text-xs text-amber-300/90 mb-5 uppercase tracking-wide">
          {reason || 'PENALTY'}
        </p>

        {/* 3 Captain Choice Options */}
        <div className="w-full flex flex-col gap-3">
          {/* Option 1: Patear a los Palos */}
          <button
            onClick={() => handleSelect('kick_posts')}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 active:scale-98 border-2 border-emerald-400 rounded-xl shadow-lg flex items-center gap-3.5 text-left cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-black/30 border border-emerald-300/50 flex items-center justify-center shrink-0 text-emerald-300 group-hover:scale-110 transition-transform">
              <Target size={22} />
            </div>
            <div className="flex-1">
              <div className="font-retro text-xs md:text-sm font-bold text-white flex items-center gap-2">
                <span>{t('penaltyOption1Title')}</span>
                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded">
                  +3 PTS
                </span>
              </div>
              <div className="text-[10px] text-emerald-100/80 font-mono mt-0.5">
                {t('penaltyOption1Desc')}
              </div>
            </div>
          </button>

          {/* Option 2: Pedir Scrum / Jugada Preparada */}
          <button
            onClick={() => handleSelect('scrum')}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 active:scale-98 border-2 border-blue-400 rounded-xl shadow-lg flex items-center gap-3.5 text-left cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-black/30 border border-blue-300/50 flex items-center justify-center shrink-0 text-blue-300 group-hover:scale-110 transition-transform">
              <Users size={22} />
            </div>
            <div className="flex-1">
              <div className="font-retro text-xs md:text-sm font-bold text-white flex items-center gap-2">
                <span>{t('penaltyOption2Title')}</span>
                <span className="text-[9px] bg-blue-300 text-slate-950 font-black px-1.5 py-0.5 rounded">
                  SET PLAY
                </span>
              </div>
              <div className="text-[10px] text-blue-100/80 font-mono mt-0.5">
                {t('penaltyOption2Desc')}
              </div>
            </div>
          </button>

          {/* Option 3: Salida Rápida / Free Kick (Tap & Go) */}
          <button
            onClick={() => handleSelect('tap_and_go')}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-98 border-2 border-amber-300 rounded-xl shadow-lg flex items-center gap-3.5 text-left cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-black/30 border border-amber-200/50 flex items-center justify-center shrink-0 text-amber-200 group-hover:scale-110 transition-transform">
              <Zap size={22} />
            </div>
            <div className="flex-1">
              <div className="font-retro text-xs md:text-sm font-bold text-white flex items-center gap-2">
                <span>{t('penaltyOption3Title')}</span>
                <span className="text-[9px] bg-amber-300 text-slate-950 font-black px-1.5 py-0.5 rounded">
                  SPEED
                </span>
              </div>
              <div className="text-[10px] text-amber-100/80 font-mono mt-0.5">
                {t('penaltyOption3Desc')}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
