/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ScrumSetPlay } from '../types/rugby';
import { Flame, Wind, Shield, Scissors, Play } from 'lucide-react';
import { retroAudio } from '../audio/retroAudio';
import { useTranslation } from '../i18n/context';

interface ScrumSetPlayModalProps {
  onSelectPlay: (play: ScrumSetPlay) => void;
}

export const ScrumSetPlayModal: React.FC<ScrumSetPlayModalProps> = ({
  onSelectPlay,
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = React.useState<ScrumSetPlay>('backline_wings');

  const setPlays = [
    {
      id: 'pick_and_go_8' as const,
      title: t('playPickAndGoTitle'),
      description: t('playPickAndGoDesc'),
      badge: 'POWER',
      badgeColor: 'bg-red-500 text-white',
      colorBorder: 'border-red-400 hover:border-red-300',
      icon: <Flame size={20} className="text-red-400" />,
    },
    {
      id: 'backline_wings' as const,
      title: t('playWingsTitle'),
      description: t('playWingsDesc'),
      badge: 'SPEED',
      badgeColor: 'bg-amber-400 text-slate-950',
      colorBorder: 'border-amber-400 hover:border-amber-300',
      icon: <Wind size={20} className="text-amber-400" />,
    },
    {
      id: 'crash_center_12' as const,
      title: t('playCrashTitle'),
      description: t('playCrashDesc'),
      badge: 'IMPACT',
      badgeColor: 'bg-blue-500 text-white',
      colorBorder: 'border-blue-400 hover:border-blue-300',
      icon: <Shield size={20} className="text-blue-400" />,
    },
    {
      id: 'scissors_10_12' as const,
      title: t('playScissorsTitle'),
      description: t('playScissorsDesc'),
      badge: 'CROSS',
      badgeColor: 'bg-purple-400 text-slate-950',
      colorBorder: 'border-purple-400 hover:border-purple-300',
      icon: <Scissors size={20} className="text-purple-400" />,
    },
  ];

  const handleConfirm = (play: ScrumSetPlay) => {
    retroAudio.playBlip();
    onSelectPlay(play);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 md:p-6 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-950 border-4 border-amber-400 rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col">
        {/* Header Tactical Board */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-retro text-xs md:text-sm font-bold text-amber-300 tracking-wider">
              {t('scrumModalTitle')}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase hidden sm:inline">
            {t('scrumModalSubtitle')}
          </span>
        </div>

        {/* 4 Tactical Play Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {setPlays.map((play) => {
            const isChosen = selected === play.id;
            return (
              <div
                key={play.id}
                onClick={() => {
                  setSelected(play.id);
                  retroAudio.playBlip();
                }}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  isChosen
                    ? `bg-slate-900 ${play.colorBorder} shadow-lg scale-[1.01] ring-2 ring-amber-400/50`
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-black/40 border border-slate-800">
                        {play.icon}
                      </div>
                      <span className="font-retro text-xs font-bold text-white tracking-wide">
                        {play.title}
                      </span>
                    </div>
                    <span className={`text-[8px] font-retro font-bold px-1.5 py-0.5 rounded ${play.badgeColor}`}>
                      {play.badge}
                    </span>
                  </div>

                  <p className="text-[10px] font-mono text-slate-300 leading-tight mb-2">
                    {play.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono">
                  <span className="text-amber-300 font-bold">TACTIC</span>
                  <span className={`font-retro text-[9px] ${isChosen ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isChosen ? '✓ OK' : 'SELECT'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button: Execute Play */}
        <button
          onClick={() => handleConfirm(selected)}
          className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-98 text-slate-950 font-retro text-xs md:text-sm font-black rounded-xl border-2 border-white shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Play size={16} fill="currentColor" />
          <span>{t('scrumModalTitle')}</span>
        </button>
      </div>
    </div>
  );
};
