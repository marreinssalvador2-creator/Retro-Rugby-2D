/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Unlock, Lock, Play } from 'lucide-react';
import { ChampionshipInfo } from '../../types/career';
import { DEFAULT_CHAMPIONSHIPS } from '../../data/careerDefaults';
import { retroAudio } from '../../audio/retroAudio';
import { useTranslation } from '../../i18n/context';

interface ChampionshipsScreenProps {
  onBack: () => void;
  onSelectTournament: (tourneyId: string) => void;
  careerSeason?: number;
}

export const ChampionshipsScreen: React.FC<ChampionshipsScreenProps> = ({
  onBack,
  onSelectTournament,
  careerSeason = 1,
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'national' | 'international'>('all');
  const [selectedTourney, setSelectedTourney] = useState<ChampionshipInfo | null>(DEFAULT_CHAMPIONSHIPS[0]);

  const filteredTourneys = DEFAULT_CHAMPIONSHIPS.filter(tourney => {
    if (filter === 'national') return tourney.type === 'national_league' || tourney.type === 'national_cup';
    if (filter === 'international') return tourney.type !== 'national_league' && tourney.type !== 'national_cup';
    return true;
  });

  return (
    <div className="relative w-screen h-screen flex flex-col justify-between p-3 md:p-5 overflow-hidden select-none bg-[#0a110d] text-white">
      {/* Scanline filter */}
      <div className="absolute inset-0 scanlines opacity-25 pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between bg-slate-950/95 border-2 border-slate-700 rounded-xl p-2.5 md:p-3 shadow-[0_4px_0_#020617] font-retro text-xs md:text-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onBack();
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-white cursor-pointer active:translate-y-0.5"
            title={t('back')}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="font-bold text-amber-300">{t('championshipsScreenTitle')}</span>
            <span className="text-[9px] font-sans text-slate-400 block">
              {t('championshipsScreenSub')}
            </span>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 text-[9px] md:text-[10px]">
          {(['all', 'national', 'international'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                retroAudio.playButtonPress();
                setFilter(tab);
              }}
              className={`px-2.5 py-1 rounded border cursor-pointer uppercase transition-all ${
                filter === tab
                  ? 'bg-amber-400 text-slate-950 border-white font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'ALL' : tab === 'national' ? 'LEAGUES' : 'CUPS'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tournament Grid */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex-1 my-3 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTourneys.map((tourney) => {
            const isUnlocked = tourney.isUnlocked || careerSeason >= tourney.requiredSeason;
            const isSelected = selectedTourney?.id === tourney.id;

            return (
              <div
                key={tourney.id}
                onClick={() => {
                  retroAudio.playButtonPress();
                  setSelectedTourney(tourney);
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-[0_4px_0_#020617] flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-amber-400'
                    : isUnlocked
                    ? 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                    : 'bg-slate-950/70 border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{tourney.trophyEmoji}</span>
                      <div>
                        <span className="font-retro text-xs md:text-sm font-bold text-white block">
                          {tourney.title}
                        </span>
                        <span className="text-[9px] font-sans text-amber-300/80">
                          {tourney.subtitle}
                        </span>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <span className="p-1 text-emerald-400 bg-emerald-950/60 rounded border border-emerald-500/30">
                        <Unlock size={14} />
                      </span>
                    ) : (
                      <span className="p-1 text-slate-500 bg-slate-900 rounded border border-slate-700 flex items-center gap-1 text-[8px] font-mono">
                        <Lock size={12} /> S{tourney.requiredSeason}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-[10px] text-slate-300 font-sans my-2">
                    <p>• {tourney.formatDescription}</p>
                    <p className="text-amber-400">
                      • {t('prizeReward')}: +${tourney.prizeCoins} {t('coinsUnit')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 font-retro text-[10px]">
                  <span className={`text-[9px] ${isUnlocked ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isUnlocked ? '● ACTIVE' : `${t('lockedTournament')} (S${tourney.requiredSeason})`}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isUnlocked) onSelectTournament(tourney.id);
                    }}
                    disabled={!isUnlocked}
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 font-bold transition-all ${
                      isUnlocked
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-white cursor-pointer active:translate-y-0.5'
                        : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Play size={12} className={isUnlocked ? 'fill-slate-950' : ''} />
                    <span>{t('playChampionship')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between text-[9px] font-mono text-slate-500">
        <span>{t('championshipsScreenSub')}</span>
        <span>RETRO RUGBY 2D</span>
      </div>
    </div>
  );
};
