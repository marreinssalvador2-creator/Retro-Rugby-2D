/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { CareerTeamData, LeagueStandingItem } from '../../types/career';
import { CareerStorageService } from '../../services/careerStorage';
import { retroAudio } from '../../audio/retroAudio';
import { useTranslation } from '../../i18n/context';

interface StandingsScreenProps {
  career: CareerTeamData;
  onBack: () => void;
}

export const StandingsScreen: React.FC<StandingsScreenProps> = ({
  career,
  onBack,
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'standings' | 'playoffs'>('standings');
  const [standings] = useState<LeagueStandingItem[]>(() => {
    return CareerStorageService.loadStandings();
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
            <span className="font-bold text-amber-300">{t('standingsTitle')}</span>
            <span className="text-[9px] font-sans text-slate-400 block">
              {t('standingsSubtitle')} · {t('season')} {career.season}
            </span>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              setViewMode('standings');
            }}
            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
              viewMode === 'standings'
                ? 'bg-amber-400 text-slate-950 border-white'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {t('standings')}
          </button>
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              setViewMode('playoffs');
            }}
            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
              viewMode === 'playoffs'
                ? 'bg-amber-400 text-slate-950 border-white'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            PLAYOFFS
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex-1 my-3 overflow-y-auto">
        {viewMode === 'standings' ? (
          /* LEAGUE TABLE VIEW */
          <div className="bg-slate-900/90 border-2 border-slate-700 rounded-xl overflow-hidden shadow-[0_4px_0_#020617] font-retro text-xs">
            <div className="grid grid-cols-12 bg-slate-950 p-3 text-[9px] md:text-[10px] text-slate-400 border-b border-slate-800">
              <span className="col-span-1 text-center">{t('colPos')}</span>
              <span className="col-span-4 md:col-span-5">{t('colTeam')}</span>
              <span className="col-span-1 text-center">{t('colPlayed')}</span>
              <span className="col-span-1 text-center">{t('colWon')}</span>
              <span className="col-span-1 text-center">{t('colDrawn')}</span>
              <span className="col-span-1 text-center">{t('colLost')}</span>
              <span className="col-span-1 text-center hidden md:inline">{t('colPointsFor')}</span>
              <span className="col-span-1 text-center hidden md:inline">{t('colPointsAgainst')}</span>
              <span className="col-span-2 md:col-span-1 text-right text-amber-300 font-bold pr-2">{t('colTotalPts')}</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {standings.map((item, index) => {
                const isUser = item.teamId === career.teamId;
                const isPlayoffZone = index < 4;

                return (
                  <div
                    key={item.teamId}
                    className={`grid grid-cols-12 items-center p-3 text-[10px] md:text-xs transition-colors ${
                      isUser
                        ? 'bg-amber-500/15 border-l-4 border-amber-400 text-white font-bold'
                        : isPlayoffZone
                        ? 'bg-slate-900/40 hover:bg-slate-800/50'
                        : 'hover:bg-slate-850/40'
                    }`}
                  >
                    <div className="col-span-1 text-center font-mono">
                      <span className={`inline-block w-5 h-5 rounded-full text-[9px] leading-5 ${
                        isPlayoffZone ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                    </div>

                    <div className="col-span-4 md:col-span-5 flex items-center gap-2">
                      <span className="text-base">{item.flag}</span>
                      <span className="truncate">{item.teamName}</span>
                      {isUser && (
                        <span className="text-[8px] bg-amber-400 text-slate-950 px-1 rounded font-black">
                          YOU
                        </span>
                      )}
                    </div>

                    <span className="col-span-1 text-center font-mono text-slate-300">{item.played}</span>
                    <span className="col-span-1 text-center font-mono text-emerald-400 font-bold">{item.won}</span>
                    <span className="col-span-1 text-center font-mono text-slate-400">{item.drawn}</span>
                    <span className="col-span-1 text-center font-mono text-rose-400">{item.lost}</span>
                    <span className="col-span-1 text-center font-mono text-slate-400 hidden md:inline">{item.pointsFor}</span>
                    <span className="col-span-1 text-center font-mono text-slate-400 hidden md:inline">{item.pointsAgainst}</span>
                    <span className="col-span-2 md:col-span-1 text-right font-mono text-amber-300 font-bold pr-2">
                      {item.points}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* PLAYOFFS BRACKET VIEW */
          <div className="bg-slate-900/90 border-2 border-slate-700 rounded-xl p-4 shadow-[0_4px_0_#020617] font-retro text-xs flex flex-col justify-center min-h-[360px]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
              <span className="text-amber-300 text-xs flex items-center gap-2">
                <Trophy size={16} />
                PLAYOFFS BRACKET
              </span>
              <span className="text-[9px] font-sans text-slate-400">
                Top 4 teams qualify
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Semifinal 1 & 2 */}
              <div className="flex flex-col gap-4">
                <span className="text-[9px] text-slate-400 text-center">SEMIFINAL 1</span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-white">
                    <span>🇦🇷 Los Pumas (#1)</span>
                    <span className="font-mono text-emerald-400">28</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>🇫🇷 Les Bleus (#4)</span>
                    <span className="font-mono">19</span>
                  </div>
                </div>

                <span className="text-[9px] text-slate-400 text-center mt-2">SEMIFINAL 2</span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-white">
                    <span>🇳🇿 All Blacks (#2)</span>
                    <span className="font-mono text-emerald-400">24</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>🇿🇦 Springboks (#3)</span>
                    <span className="font-mono">21</span>
                  </div>
                </div>
              </div>

              {/* Connecting Graphic */}
              <div className="hidden md:flex flex-col items-center justify-center text-amber-400 font-mono text-xl">
                <span>───►</span>
              </div>

              {/* Grand Final */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-amber-300 text-center font-bold">🏆 GRAND FINAL</span>
                <div className="bg-slate-950 p-4 rounded-xl border-2 border-amber-400 shadow-[0_4px_0_#78350f] space-y-3">
                  <div className="flex justify-between items-center text-white text-sm font-bold">
                    <span>🇦🇷 Los Pumas</span>
                    <span className="text-amber-400 text-xs">FINALIST</span>
                  </div>
                  <div className="text-center font-retro text-[9px] text-rose-500">VS</div>
                  <div className="flex justify-between items-center text-white text-sm font-bold">
                    <span>🇳🇿 All Blacks</span>
                    <span className="text-slate-500 text-xs">FINALIST</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between text-[9px] font-mono text-slate-500">
        <span>{t('standingsSubtitle')}</span>
        <span>RETRO RUGBY 2D</span>
      </div>
    </div>
  );
};
