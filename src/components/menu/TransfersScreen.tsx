/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, DollarSign, UserPlus } from 'lucide-react';
import { CareerTeamData, FreeAgent, CareerPlayer } from '../../types/career';
import { CareerStorageService } from '../../services/careerStorage';
import { retroAudio } from '../../audio/retroAudio';
import { useTranslation } from '../../i18n/context';

interface TransfersScreenProps {
  career: CareerTeamData;
  onUpdateCareer: (updated: CareerTeamData) => void;
  onBack: () => void;
}

export const TransfersScreen: React.FC<TransfersScreenProps> = ({
  career,
  onUpdateCareer,
  onBack,
}) => {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<FreeAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<FreeAgent | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setAgents(CareerStorageService.loadFreeAgents());
  }, []);

  const handleSign = (agent: FreeAgent) => {
    if (career.roster.length >= 23) {
      retroAudio.playBlip();
      setNotification('ROSTER FULL (Max 23 players).');
      return;
    }

    if (career.coins < agent.price) {
      retroAudio.playBlip();
      setNotification(`${t('noFunds')}!`);
      return;
    }

    retroAudio.playWhistle();

    // Convert FreeAgent into CareerPlayer
    const newPlayer: CareerPlayer = {
      id: `fa_signed_${Date.now()}`,
      name: agent.name,
      position: agent.position,
      roleName: agent.roleName,
      isForward: agent.isForward,
      age: agent.age,
      stars: agent.stars,
      speed: agent.speed,
      strength: agent.strength,
      kicking: agent.kicking,
      handling: agent.handling,
      salary: agent.salary,
      contractYears: 2,
      fitness: 100,
      morale: 100,
      stats: { tries: 0, conversions: 0, tackles: 0, matches: 0 },
    };

    const updatedRoster = [...career.roster, newPlayer];
    const updatedCoins = career.coins - agent.price;
    const remainingAgents = agents.filter(a => a.id !== agent.id);

    setAgents(remainingAgents);
    CareerStorageService.saveFreeAgents(remainingAgents);

    onUpdateCareer({
      ...career,
      coins: updatedCoins,
      roster: updatedRoster,
    });

    setSelectedAgent(null);
    setNotification(`${agent.name} ${t('signedStatus')}!`);
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
            <span className="font-bold text-amber-300">{t('transfersTitle')}</span>
            <span className="text-[9px] font-sans text-slate-400 block">
              {t('freeAgentsList')} · {career.roster.length}/23
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/50 px-3 py-1 rounded-lg text-amber-300">
          <DollarSign size={16} className="text-amber-400" />
          <span className="font-bold text-sm">{career.coins}</span>
          <span className="text-[8px] font-sans text-amber-400 uppercase">{t('budgetLabel')}</span>
        </div>
      </div>

      {/* Notification banner if any */}
      {notification && (
        <div className="relative z-10 w-full max-w-5xl mx-auto bg-amber-400 text-slate-950 font-retro text-xs p-2 rounded-lg flex items-center justify-between shadow-md mt-2">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="cursor-pointer font-black text-sm px-2">✕</button>
        </div>
      )}

      {/* Free Agents Grid */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex-1 my-3 overflow-y-auto pr-1">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-900/60 rounded-xl border border-slate-800 font-retro">
            <ShoppingBag size={40} className="text-slate-600 mb-2" />
            <span className="text-sm text-slate-400">NO FREE AGENTS AVAILABLE</span>
            <span className="text-[9px] font-sans text-slate-500 mt-1">Check back next season.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {agents.map((agent) => {
              const canAfford = career.coins >= agent.price && career.roster.length < 23;
              return (
                <div
                  key={agent.id}
                  onClick={() => {
                    retroAudio.playButtonPress();
                    setSelectedAgent(agent);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer shadow-[0_3px_0_#020617] flex flex-col justify-between ${
                    selectedAgent?.id === agent.id
                      ? 'bg-slate-800 border-amber-400'
                      : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-retro text-xs font-bold text-white">
                          {agent.name}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400">({agent.age}{t('yearSingular')})</span>
                      </div>
                      <span className="text-[9px] font-sans text-amber-300/90 block mt-0.5">
                        {agent.roleName} (#{agent.position})
                      </span>
                      <div className="flex text-amber-400 text-xs mt-1">
                        {'★'.repeat(agent.stars)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-retro text-xs font-black text-amber-300">
                        ${agent.price}
                      </span>
                      <span className="text-[8px] font-sans text-slate-400">COINS</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1 mt-3 pt-2 border-t border-slate-800/80 text-[8px] font-mono text-center">
                    <div><span className="text-slate-500 block">SPD</span><span className="text-white font-bold">{agent.speed}</span></div>
                    <div><span className="text-slate-500 block">STR</span><span className="text-white font-bold">{agent.strength}</span></div>
                    <div><span className="text-slate-500 block">KCK</span><span className="text-white font-bold">{agent.kicking}</span></div>
                    <div><span className="text-slate-500 block">HND</span><span className="text-white font-bold">{agent.handling}</span></div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSign(agent);
                    }}
                    disabled={!canAfford}
                    className={`mt-3 w-full py-2 px-3 rounded-lg font-retro text-[10px] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      canAfford
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-white cursor-pointer active:translate-y-0.5 shadow'
                        : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <UserPlus size={12} />
                    <span>{t('signPlayerBtn')} (${agent.price})</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between text-[9px] font-mono text-slate-500">
        <span>{t('transfersSubtitle')}</span>
        <span>{t('transfersTitle')}</span>
      </div>
    </div>
  );
};
