/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, ShoppingBag, DollarSign, ListOrdered, Wrench, 
  Play, ArrowLeft, Heart, Flame, AlertCircle, ChevronRight 
} from 'lucide-react';
import { CareerTeamData, GameScene, CareerEventDilemma } from '../../types/career';
import { RUGBY_TEAMS } from '../../game/constants';
import { retroAudio } from '../../audio/retroAudio';
import { CAREER_RANDOM_DILEMMAS } from '../../data/careerDefaults';
import { useTranslation } from '../../i18n/context';

interface CareerHubProps {
  career: CareerTeamData;
  onUpdateCareer: (updated: CareerTeamData) => void;
  onNavigate: (scene: GameScene) => void;
  onStartMatch: (opponentTeamId: string) => void;
  onBackToMenu: () => void;
}

export const CareerHub: React.FC<CareerHubProps> = ({
  career,
  onUpdateCareer,
  onNavigate,
  onStartMatch,
  onBackToMenu,
}) => {
  const { t } = useTranslation();

  // Potential active dilemma popup
  const [activeDilemma, setActiveDilemma] = useState<CareerEventDilemma | null>(() => {
    // 25% chance of triggering a random coach dilemma on entry if not shown yet
    if (Math.random() < 0.3) {
      return CAREER_RANDOM_DILEMMAS[Math.floor(Math.random() * CAREER_RANDOM_DILEMMAS.length)];
    }
    return null;
  });

  // Calculate next opponent based on week
  const opponentList = RUGBY_TEAMS.filter(t => t.id !== career.teamId);
  const nextOpponent = opponentList[(career.week - 1) % opponentList.length] || RUGBY_TEAMS[1];

  // Average squad overall
  const avgStars = Math.round(
    career.roster.reduce((acc, p) => acc + p.stars, 0) / (career.roster.length || 1)
  );

  const handleDilemmaChoice = (opt: CareerEventDilemma['options'][0]) => {
    retroAudio.playButtonPress();
    const updatedCoins = career.coins + (opt.coinDelta || 0);
    const updatedMorale = Math.max(0, Math.min(100, career.fanSupport + (opt.moraleDelta || 0)));

    // Apply fitness delta to players if any
    let updatedRoster = [...career.roster];
    if (opt.fitnessDelta) {
      updatedRoster = updatedRoster.map(p => ({
        ...p,
        fitness: Math.max(20, Math.min(100, p.fitness + opt.fitnessDelta!)),
      }));
    }

    onUpdateCareer({
      ...career,
      coins: Math.max(0, updatedCoins),
      fanSupport: updatedMorale,
      roster: updatedRoster,
    });

    setActiveDilemma(null);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col justify-between p-3 md:p-5 overflow-hidden select-none bg-[#0a110d] text-white">
      {/* CRT Scanline Filter */}
      <div className="absolute inset-0 scanlines opacity-25 pointer-events-none" />

      {/* FIXED TOP STATUS BAR (Retro Bowl Style) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto bg-slate-950/95 border-2 border-slate-700 rounded-xl p-2.5 md:p-3 shadow-[0_4px_0_#020617] flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm font-retro">
        {/* Left: Team and Coach */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onBackToMenu();
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-white cursor-pointer active:translate-y-0.5"
            title={t('back')}
          >
            <ArrowLeft size={16} />
          </button>

          <span className="text-xl">{career.flag}</span>
          <div className="flex flex-col">
            <span className="font-black text-amber-300 tracking-wider">
              {career.teamName.toUpperCase()}
            </span>
            <span className="text-[9px] font-sans text-slate-400">
              {t('coach')}: {career.coachName.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Center: Season, Week, Record */}
        <div className="flex items-center gap-4 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] md:text-xs">
          <div className="text-center">
            <span className="text-slate-400 block text-[8px]">{t('season')}</span>
            <span className="text-white font-bold">{career.season}</span>
          </div>
          <div className="text-center">
            <span className="text-slate-400 block text-[8px]">{t('week')}</span>
            <span className="text-amber-400 font-bold">{career.week}/10</span>
          </div>
          <div className="text-center">
            <span className="text-slate-400 block text-[8px]">{t('standings')}</span>
            <span className="text-emerald-400 font-bold">
              {career.record.wins}W - {career.record.losses}L
            </span>
          </div>
        </div>

        {/* Right: Coins (Plata) & Fan Support */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/50 px-2.5 py-1 rounded-lg text-amber-300">
            <DollarSign size={16} className="text-amber-400" />
            <span className="font-black tracking-wider text-xs md:text-sm">{career.coins}</span>
            <span className="text-[8px] font-sans text-amber-400 uppercase">{t('coinsUnit')}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-400/50 px-2.5 py-1 rounded-lg text-rose-300">
            <Heart size={16} className="text-rose-400 fill-rose-400" />
            <span className="font-black text-xs md:text-sm">{career.fanSupport}%</span>
          </div>
        </div>
      </div>

      {/* MAIN HUB WORKSPACE: SPLIT 2-COLUMN RETRO BOWL LAYOUT */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 my-2.5 overflow-y-auto">
        {/* LEFT COLUMN (7 Cols): Next Match Hero Card */}
        <div className="md:col-span-7 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-slate-700 rounded-xl p-4 shadow-[0_5px_0_#020617]">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="font-retro text-[10px] text-amber-300 flex items-center gap-1.5">
                <Flame size={14} className="text-amber-400" />
                {t('nextMatch')} · {t('week')} {career.week}
              </span>
              <span className="font-retro text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                RUGBY UNION
              </span>
            </div>

            {/* Matchup Face-off */}
            <div className="flex items-center justify-around my-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {/* Home Team (User) */}
              <div className="flex flex-col items-center">
                <span className="text-3xl mb-1">{career.flag}</span>
                <span className="font-retro text-xs font-bold text-white text-center">
                  {career.shortName}
                </span>
                <div className="flex gap-0.5 mt-1 text-amber-400 text-xs">
                  {'★'.repeat(Math.max(1, avgStars))}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="font-retro text-sm md:text-base text-rose-500 font-black">VS</span>
                <span className="text-[8px] font-mono text-slate-400">{t('week')} {career.week}</span>
              </div>

              {/* Away Team (Rival) */}
              <div className="flex flex-col items-center">
                <span className="text-3xl mb-1">{nextOpponent.flag}</span>
                <span className="font-retro text-xs font-bold text-white text-center">
                  {nextOpponent.shortName}
                </span>
                <div className="flex gap-0.5 mt-1 text-amber-400 text-xs">
                  {'★'.repeat(Math.max(1, Math.min(5, Math.round((10 - nextOpponent.ranking) / 2))))}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-sans space-y-1">
              <p>• <strong>{t('colTeam')}:</strong> {nextOpponent.name} (World #{nextOpponent.ranking})</p>
              <p>• <strong>Reward:</strong> +60 {t('coinsUnit')} for win (+ bonus)</p>
            </div>
          </div>

          {/* Big Action Button: JUGAR PARTIDO */}
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onStartMatch(nextOpponent.id);
            }}
            className="w-full mt-4 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:translate-y-1 text-slate-950 font-retro text-xs md:text-sm rounded-xl border-3 border-white shadow-[0_5px_0_#14532d] active:shadow-[0_1px_0_#14532d] cursor-pointer transition-all flex items-center justify-center gap-3 font-black tracking-wider"
          >
            <Play size={20} className="fill-slate-950" />
            <span>{t('playNextMatch')}</span>
          </button>
        </div>

        {/* RIGHT COLUMN (5 Cols): Management Hub Navigation Buttons */}
        <div className="md:col-span-5 flex flex-col gap-2.5">
          {/* 1. PLANTEL (ROSTER) */}
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onNavigate('CAREER_SQUAD');
            }}
            className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 active:translate-y-0.5 border-2 border-slate-700 hover:border-slate-500 rounded-xl shadow-[0_3px_0_#020617] cursor-pointer transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                <Users size={18} />
              </div>
              <div>
                <span className="font-retro text-[11px] block font-bold text-white">{t('squad')}</span>
                <span className="text-[9px] font-sans text-slate-400">
                  {career.roster.length}/23 {t('squadSub')}
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
          </button>

          {/* 2. FICHAJES (TRANSFERS) */}
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onNavigate('CAREER_TRANSFERS');
            }}
            className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 active:translate-y-0.5 border-2 border-slate-700 hover:border-slate-500 rounded-xl shadow-[0_3px_0_#020617] cursor-pointer transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg group-hover:scale-105 transition-transform">
                <ShoppingBag size={18} />
              </div>
              <div>
                <span className="font-retro text-[11px] block font-bold text-white">{t('transfers')}</span>
                <span className="text-[9px] font-sans text-slate-400">
                  {t('transfersSub')}
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
          </button>

          {/* 3. INSTALACIONES (FACILITIES) */}
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onNavigate('CAREER_FACILITIES');
            }}
            className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 active:translate-y-0.5 border-2 border-slate-700 hover:border-slate-500 rounded-xl shadow-[0_3px_0_#020617] cursor-pointer transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg group-hover:scale-105 transition-transform">
                <Wrench size={18} />
              </div>
              <div>
                <span className="font-retro text-[11px] block font-bold text-white">{t('facilities')}</span>
                <span className="text-[9px] font-sans text-slate-400">
                  {t('facilitiesSub')}
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
          </button>

          {/* 4. TABLA DE POSICIONES */}
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onNavigate('CAREER_STANDINGS');
            }}
            className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 active:translate-y-0.5 border-2 border-slate-700 hover:border-slate-500 rounded-xl shadow-[0_3px_0_#020617] cursor-pointer transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
                <ListOrdered size={18} />
              </div>
              <div>
                <span className="font-retro text-[11px] block font-bold text-white">{t('standings')}</span>
                <span className="text-[9px] font-sans text-slate-400">
                  {t('standingsSub')}
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
          </button>

          {/* 5. FINANZAS Y PLATA */}
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onNavigate('CAREER_FINANCES');
            }}
            className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 active:translate-y-0.5 border-2 border-slate-700 hover:border-slate-500 rounded-xl shadow-[0_3px_0_#020617] cursor-pointer transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg group-hover:scale-105 transition-transform">
                <DollarSign size={18} />
              </div>
              <div>
                <span className="font-retro text-[11px] block font-bold text-white">{t('finances')}</span>
                <span className="text-[9px] font-sans text-slate-400">
                  {t('financesSub')}
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* POPUP: RETRO BOWL RANDOM DILEMMA MODAL */}
      {activeDilemma && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border-3 border-amber-400 rounded-2xl p-5 shadow-[0_8px_0_#78350f] text-white font-retro">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertCircle size={20} />
              <span className="text-xs md:text-sm font-bold tracking-wider">{activeDilemma.title}</span>
            </div>
            <p className="font-sans text-xs text-slate-300 mb-4 leading-relaxed">
              {activeDilemma.description}
            </p>

            <div className="flex flex-col gap-2.5">
              {activeDilemma.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDilemmaChoice(opt)}
                  className="w-full p-3 bg-slate-800 hover:bg-slate-700 active:translate-y-0.5 border-2 border-slate-600 hover:border-amber-400 rounded-xl text-left cursor-pointer transition-all"
                >
                  <span className="font-retro text-[10px] md:text-xs block text-amber-300 font-bold mb-0.5">
                    {opt.label}
                  </span>
                  <span className="font-sans text-[10px] text-slate-400 block">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER BAR */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between text-[9px] font-mono text-slate-500">
        <span>RUGBY DYNASTY HUB</span>
        <span>RETRO BOWL MODE</span>
      </div>
    </div>
  );
};
