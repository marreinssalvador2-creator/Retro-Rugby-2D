/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Heart, Activity, DollarSign, UserMinus, RefreshCw } from 'lucide-react';
import { CareerTeamData, CareerPlayer } from '../../types/career';
import { retroAudio } from '../../audio/retroAudio';
import { useTranslation } from '../../i18n/context';

interface SquadScreenProps {
  career: CareerTeamData;
  onUpdateCareer: (updated: CareerTeamData) => void;
  onBack: () => void;
}

export const SquadScreen: React.FC<SquadScreenProps> = ({
  career,
  onUpdateCareer,
  onBack,
}) => {
  const { t } = useTranslation();
  const [selectedPlayer, setSelectedPlayer] = useState<CareerPlayer | null>(null);
  const [filter, setFilter] = useState<'all' | 'backs' | 'forwards'>('all');

  const filteredPlayers = career.roster.filter(p => {
    if (filter === 'forwards') return p.isForward;
    if (filter === 'backs') return !p.isForward;
    return true;
  });

  const handleRenewContract = (player: CareerPlayer) => {
    const cost = player.stars * 35;
    if (career.coins < cost) {
      retroAudio.playBlip();
      return;
    }

    retroAudio.playButtonPress();
    const updatedRoster = career.roster.map(p => {
      if (p.id === player.id) {
        return {
          ...p,
          contractYears: p.contractYears + 1,
          morale: Math.min(100, p.morale + 15),
        };
      }
      return p;
    });

    onUpdateCareer({
      ...career,
      coins: career.coins - cost,
      roster: updatedRoster,
    });

    if (selectedPlayer?.id === player.id) {
      setSelectedPlayer({
        ...selectedPlayer,
        contractYears: selectedPlayer.contractYears + 1,
        morale: Math.min(100, selectedPlayer.morale + 15),
      });
    }
  };

  const handleReleasePlayer = (player: CareerPlayer) => {
    if (career.roster.length <= 15) {
      retroAudio.playBlip();
      return; // Minimum 15 players required to field a team
    }

    retroAudio.playButtonPress();
    const compensation = player.stars * 20;
    const updatedRoster = career.roster.filter(p => p.id !== player.id);

    onUpdateCareer({
      ...career,
      coins: career.coins + compensation,
      roster: updatedRoster,
    });

    setSelectedPlayer(null);
  };

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
            <span className="font-bold text-amber-300">{t('squadTitle')}</span>
            <span className="text-[9px] font-sans text-slate-400 block">
              {career.roster.length}/23 {t('squadSub')}
            </span>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 text-[9px] md:text-[10px]">
          {(['all', 'forwards', 'backs'] as const).map(tab => (
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
              {tab === 'all' ? 'ALL' : tab === 'forwards' ? t('forwardsTab') : t('backsTab')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/50 px-2.5 py-1 rounded-lg text-amber-300">
          <DollarSign size={14} className="text-amber-400" />
          <span className="font-bold text-xs">{career.coins}</span>
        </div>
      </div>

      {/* Roster Grid / List */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex-1 my-3 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              onClick={() => {
                retroAudio.playButtonPress();
                setSelectedPlayer(player);
              }}
              className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer shadow-[0_3px_0_#020617] flex items-center justify-between ${
                selectedPlayer?.id === player.id
                  ? 'bg-slate-800 border-amber-400'
                  : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {/* Number Badge */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-retro text-xs font-black border ${
                  player.position <= 15 ? 'bg-amber-400 text-slate-950 border-white' : 'bg-slate-800 text-slate-300 border-slate-600'
                }`}>
                  {player.position}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-retro text-[10px] md:text-xs font-bold text-white truncate max-w-[110px]">
                      {player.name}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400">({player.age}{t('yearSingular')})</span>
                  </div>
                  <span className="text-[8px] font-sans text-amber-300/90 truncate max-w-[120px]">
                    {player.roleName}
                  </span>
                  <div className="flex text-amber-400 text-[10px] mt-0.5">
                    {'★'.repeat(player.stars)}
                  </div>
                </div>
              </div>

              {/* Fitness & Morale Indicators */}
              <div className="flex flex-col items-end gap-1 text-[8px] font-mono">
                <div className="flex items-center gap-1" title={t('fitnessHeader')}>
                  <Activity size={10} className="text-emerald-400" />
                  <span className={`${player.fitness < 50 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                    {player.fitness}%
                  </span>
                </div>
                <div className="flex items-center gap-1" title={t('moraleHeader')}>
                  <Heart size={10} className="text-rose-400 fill-rose-400" />
                  <span className="text-slate-300">{player.morale}%</span>
                </div>
                <span className="text-slate-400 text-[8px]">
                  {player.contractYears}{t('yearSingular')} {t('contractHeader')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SELECTED PLAYER INSPECTION & ACTION DRAWER */}
      {selectedPlayer && (
        <div className="relative z-10 w-full max-w-5xl mx-auto bg-slate-950 border-2 border-amber-400 rounded-xl p-3 shadow-[0_5px_0_#78350f] font-retro text-xs animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-xs font-black">
                #{selectedPlayer.position}
              </span>
              <span className="font-bold text-white text-sm">{selectedPlayer.name}</span>
              <span className="text-[10px] font-sans text-slate-400">· {selectedPlayer.roleName} ({selectedPlayer.age} {t('yearsPlural')})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRenewContract(selectedPlayer)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:translate-y-0.5 rounded-lg border border-white text-slate-950 text-[10px] font-bold cursor-pointer flex items-center gap-1.5"
                title={`+1 ${t('yearSingular')}: ${selectedPlayer.stars * 35} ${t('coinsUnit')}`}
              >
                <RefreshCw size={12} />
                <span>RENEW (+1 {t('yearSingular').toUpperCase()}: {selectedPlayer.stars * 35}M)</span>
              </button>

              <button
                onClick={() => handleReleasePlayer(selectedPlayer)}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 active:translate-y-0.5 rounded-lg border border-rose-300 text-white text-[10px] font-bold cursor-pointer flex items-center gap-1.5"
                title={`+${selectedPlayer.stars * 20} ${t('coinsUnit')}`}
              >
                <UserMinus size={12} />
                <span>RELEASE (+{selectedPlayer.stars * 20}M)</span>
              </button>

              <button
                onClick={() => setSelectedPlayer(null)}
                className="p-1 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Stats Bar Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
            <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">SPEED:</span>
              <span className="text-amber-300 font-bold">{selectedPlayer.speed}/10</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">STRENGTH:</span>
              <span className="text-amber-300 font-bold">{selectedPlayer.strength}/10</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">KICKING:</span>
              <span className="text-amber-300 font-bold">{selectedPlayer.kicking}/10</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">HANDLING:</span>
              <span className="text-amber-300 font-bold">{selectedPlayer.handling}/10</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between text-[9px] font-mono text-slate-500">
        <span>1-15 {t('squadSub')}</span>
        <span>{t('squadTitle')}</span>
      </div>
    </div>
  );
};
