/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RUGBY_TEAMS } from '../../game/constants';
import { retroAudio } from '../../audio/retroAudio';
import { Trophy, ArrowLeft, Star, Check } from 'lucide-react';
import { useTranslation } from '../../i18n/context';

interface CareerSetupModalProps {
  onConfirm: (teamId: string, coachName: string) => void;
  onCancel: () => void;
}

export const CareerSetupModal: React.FC<CareerSetupModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [selectedTeamId, setSelectedTeamId] = useState('arg');
  const [coachName, setCoachName] = useState('HEAD COACH');

  const selectedTeam = RUGBY_TEAMS.find(t => t.id === selectedTeamId) || RUGBY_TEAMS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/90 backdrop-blur-md select-none">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border-4 border-amber-400 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Header */}
        <div className="bg-slate-950 px-5 py-3 border-b-2 border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={20} />
            <h2 className="font-retro text-sm md:text-base text-amber-300 tracking-wider">
              {t('setupTitle')} · RETRO BOWL
            </h2>
          </div>
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onCancel();
            }}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto flex flex-col gap-5">
          {/* Coach Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-retro text-[10px] md:text-xs text-amber-300 tracking-wide">
              {t('coachNameLabel')}:
            </label>
            <input
              type="text"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value.toUpperCase())}
              maxLength={22}
              className="px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-lg text-white font-retro text-xs focus:border-amber-400 focus:outline-hidden"
              placeholder="COACH NAME"
            />
          </div>

          {/* Team Selection List */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-retro text-[10px] md:text-xs text-amber-300 tracking-wide">
                {t('selectTeamLabel')}:
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                World #{selectedTeam.ranking}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {RUGBY_TEAMS.map((team) => {
                const isSelected = team.id === selectedTeamId;
                const starsCount = Math.round((team.stats.speed + team.stats.strength) / 4);

                return (
                  <button
                    key={team.id}
                    onClick={() => {
                      retroAudio.playButtonPress();
                      setSelectedTeamId(team.id);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-start gap-1.5 text-left relative ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 shadow-lg scale-102'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 hover:bg-slate-950'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span className="text-xl">{team.flag}</span>
                      <div 
                        className="w-3.5 h-3.5 rounded-full border border-white/50" 
                        style={{ backgroundColor: team.kit.primary }}
                      />
                    </div>

                    <div className="font-retro text-[10px] font-bold text-white tracking-wide truncate w-full">
                      {team.name}
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < starsCount ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}
                        />
                      ))}
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Team Profile Preview */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedTeam.flag}</span>
              <div>
                <div className="font-retro text-xs text-white tracking-wide">{selectedTeam.name}</div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Speed: {selectedTeam.stats.speed}/10 · Strength: {selectedTeam.stats.strength}/10 · Kicking: {selectedTeam.stats.kicking}/10
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-retro text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/40">
                {t('budgetLabel')}: $200 {t('coinsUnit').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-950 p-4 border-t-2 border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onCancel();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 font-retro text-xs rounded-xl cursor-pointer transition-colors"
          >
            {t('back')}
          </button>
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onConfirm(selectedTeamId, coachName);
            }}
            className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-retro text-xs font-black rounded-xl shadow-lg border-2 border-white cursor-pointer active:scale-95 transition-all flex items-center gap-2"
          >
            <Trophy size={16} />
            <span>{t('startCareerBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
