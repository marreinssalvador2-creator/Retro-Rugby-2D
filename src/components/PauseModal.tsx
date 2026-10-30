/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Users, Volume2, VolumeX, Globe } from 'lucide-react';
import { TeamData } from '../types/rugby';
import { useTranslation } from '../i18n/context';

interface PauseModalProps {
  teamA: TeamData;
  teamB: TeamData;
  isMuted: boolean;
  onToggleMute: () => void;
  onResume: () => void;
  onRestart: () => void;
  onChangeTeams: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  teamA,
  teamB,
  isMuted,
  onToggleMute,
  onResume,
  onRestart,
  onChangeTeams,
}) => {
  const { t, language, setLanguage, languages } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#0f172a] border-2 border-slate-700 max-w-sm w-full rounded-xl overflow-hidden shadow-2xl p-6 text-center space-y-4">
        <h2 className="font-retro text-base text-amber-400 tracking-wider">
          {t('pauseTitle')}
        </h2>

        <div className="text-xs text-slate-300 font-sans">
          {teamA.name} vs {teamB.name}
        </div>

        {/* Quick Language switcher inside pause */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <Globe size={13} className="text-amber-400" />
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`px-2 py-1 rounded text-[9px] font-retro cursor-pointer transition-colors ${
                language === l.code
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {l.flag} {l.code.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            onClick={onResume}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-retro text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform cursor-pointer"
          >
            <Play size={16} />
            <span>{t('resumeMatch')}</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-retro text-[10px] rounded-lg flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-transform cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>{t('restartMatch')}</span>
          </button>

          <button
            onClick={onChangeTeams}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-retro text-[10px] rounded-lg flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-transform cursor-pointer"
          >
            <Users size={14} />
            <span>{t('chooseTeamsOrHub')}</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-retro text-[10px] rounded-lg flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-transform cursor-pointer"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isMuted ? t('sfxOn') : t('sfxOff')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
