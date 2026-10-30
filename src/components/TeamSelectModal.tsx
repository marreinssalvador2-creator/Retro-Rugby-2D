/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TeamData } from '../types/rugby';
import { RUGBY_TEAMS } from '../game/constants';
import { Trophy, Check, Play } from 'lucide-react';
import { retroAudio } from '../audio/retroAudio';
import { useTranslation } from '../i18n/context';

interface TeamSelectModalProps {
  selectedTeamA: TeamData;
  selectedTeamB: TeamData;
  onSelectTeamA: (team: TeamData) => void;
  onSelectTeamB: (team: TeamData) => void;
  onStartMatch: () => void;
}

export const TeamSelectModal: React.FC<TeamSelectModalProps> = ({
  selectedTeamA,
  selectedTeamB,
  onSelectTeamA,
  onSelectTeamB,
  onStartMatch,
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#0f172a] border-2 border-slate-700 max-w-2xl w-full rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1e293b] px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="text-amber-400" size={24} />
            <div>
              <h2 className="font-retro text-sm text-amber-400 tracking-wide">{t('quickMatch')}</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">{t('quickMatchSub')}</p>
            </div>
          </div>
          <span className="font-retro text-xs text-slate-400">RUGBY 15s</span>
        </div>

        {/* Content: Two Columns (Your Team vs Opponent) */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team A Selection (Player) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-retro text-xs text-emerald-400">{t('colTeam')} 1</span>
              <span className="text-xs text-slate-400 font-sans">User</span>
            </div>

            <div className="space-y-2">
              {RUGBY_TEAMS.map((team) => {
                const isSelected = selectedTeamA.id === team.id;
                return (
                  <button
                    key={`A_${team.id}`}
                    onClick={() => {
                      onSelectTeamA(team);
                      retroAudio.playBlip();
                    }}
                    className={`w-full p-2.5 rounded-lg border flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{team.flag}</span>
                      <div 
                        className="w-4 h-4 rounded-xs border border-white/30"
                        style={{ backgroundColor: team.kit.primary }}
                      />
                      <div>
                        <div className="font-retro text-[10px]">{team.name}</div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          Spd: {team.stats.speed} · Str: {team.stats.strength} · Kck: {team.stats.kicking}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team B Selection (Rival CPU) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-retro text-xs text-red-400">{t('colTeam')} 2</span>
              <span className="text-xs text-slate-400 font-sans">AI CPU</span>
            </div>

            <div className="space-y-2">
              {RUGBY_TEAMS.map((team) => {
                const isSelected = selectedTeamB.id === team.id;
                const isSelf = selectedTeamA.id === team.id;
                return (
                  <button
                    key={`B_${team.id}`}
                    disabled={isSelf}
                    onClick={() => {
                      onSelectTeamB(team);
                      retroAudio.playBlip();
                    }}
                    className={`w-full p-2.5 rounded-lg border flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelf ? 'opacity-40 cursor-not-allowed border-slate-900' :
                      isSelected
                        ? 'border-red-500 bg-red-950/40 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{team.flag}</span>
                      <div 
                        className="w-4 h-4 rounded-xs border border-white/30"
                        style={{ backgroundColor: team.kit.primary }}
                      />
                      <div>
                        <div className="font-retro text-[10px]">{team.name}</div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          Spd: {team.stats.speed} · Str: {team.stats.strength} · Kck: {team.stats.kicking}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-red-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#1e293b] px-6 py-4 border-t border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-sans">
            <strong className="text-white">{selectedTeamA.name}</strong> vs <strong className="text-white">{selectedTeamB.name}</strong>
          </div>
          <button
            onClick={() => {
              retroAudio.playWhistle();
              onStartMatch();
            }}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-retro text-xs rounded-lg shadow-lg flex items-center gap-2 transition-transform cursor-pointer"
          >
            <Play size={16} />
            <span>KICK OFF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
