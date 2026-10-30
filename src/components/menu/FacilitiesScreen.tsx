/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, DollarSign, CheckCircle2, Sparkles } from 'lucide-react';
import { CareerTeamData } from '../../types/career';
import { DEFAULT_FACILITIES } from '../../data/careerDefaults';
import { retroAudio } from '../../audio/retroAudio';
import { useTranslation } from '../../i18n/context';

interface FacilitiesScreenProps {
  career: CareerTeamData;
  onUpdateCareer: (updated: CareerTeamData) => void;
  onBack: () => void;
}

export const FacilitiesScreen: React.FC<FacilitiesScreenProps> = ({
  career,
  onUpdateCareer,
  onBack,
}) => {
  const { t } = useTranslation();
  const [facilities] = useState(DEFAULT_FACILITIES);

  const getUpgradeCost = (level: number) => {
    return 100 + level * 50;
  };

  const handleUpgrade = (id: 'stadium' | 'training' | 'rehab') => {
    const currentLevel = career.facilities[id];
    if (currentLevel >= 5) return;

    const cost = getUpgradeCost(currentLevel);
    if (career.coins < cost) {
      retroAudio.playBlip();
      return;
    }

    retroAudio.playWhistle();

    onUpdateCareer({
      ...career,
      coins: career.coins - cost,
      facilities: {
        ...career.facilities,
        [id]: currentLevel + 1,
      },
    });
  };

  const getFacilityName = (id: string, defaultName: string) => {
    if (id === 'stadium') return t('stadiumName');
    if (id === 'training') return t('trainingName');
    if (id === 'rehab') return t('rehabName');
    return defaultName;
  };

  const getFacilityBenefit = (id: string, defaultBenefit: string) => {
    if (id === 'stadium') return t('stadiumBenefit');
    if (id === 'training') return t('trainingBenefit');
    if (id === 'rehab') return t('rehabBenefit');
    return defaultBenefit;
  };

  return (
    <div className="relative w-screen h-screen flex flex-col justify-between p-3 md:p-5 overflow-hidden select-none bg-[#0a110d] text-white">
      {/* Scanline filter */}
      <div className="absolute inset-0 scanlines opacity-25 pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between bg-slate-950/95 border-2 border-slate-700 rounded-xl p-2.5 md:p-3 shadow-[0_4px_0_#020617] font-retro text-xs md:text-sm">
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
            <span className="font-bold text-amber-300">{t('facilitiesScreenTitle')}</span>
            <span className="text-[9px] font-sans text-slate-400 block">
              {t('facilitiesScreenSub')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/50 px-3 py-1 rounded-lg text-amber-300">
          <DollarSign size={16} className="text-amber-400" />
          <span className="font-bold text-sm">{career.coins}</span>
          <span className="text-[8px] font-sans text-amber-400 uppercase">{t('coinsUnit')}</span>
        </div>
      </div>

      {/* Facilities Cards List */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 my-4 flex flex-col justify-center gap-4">
        {facilities.map((fac) => {
          const currentLvl = career.facilities[fac.id];
          const isMaxed = currentLvl >= 5;
          const cost = getUpgradeCost(currentLvl);
          const canAfford = career.coins >= cost && !isMaxed;

          return (
            <div
              key={fac.id}
              className="bg-slate-900/90 border-2 border-slate-700 rounded-xl p-4 shadow-[0_4px_0_#020617] flex flex-col md:flex-row md:items-center justify-between gap-4 font-retro"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs md:text-sm font-bold text-white tracking-wide">
                    {getFacilityName(fac.id, fac.name)}
                  </span>
                  <span className="text-[9px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                    {t('levelLabel')} {currentLvl}/5
                  </span>
                </div>

                <p className="font-sans text-[11px] text-slate-300 mb-2 leading-relaxed">
                  {fac.description}
                </p>

                {/* Level Progress Pip Bars */}
                <div className="flex items-center gap-1.5 mb-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-3 w-8 rounded-xs border ${
                        lvl <= currentLvl
                          ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <span className="text-[10px] font-sans text-emerald-400 flex items-center gap-1">
                  <Sparkles size={12} />
                  {getFacilityBenefit(fac.id, fac.benefitDescription)}
                </span>
              </div>

              {/* Upgrade Action Button */}
              <div className="flex flex-col items-end justify-center min-w-[140px]">
                {isMaxed ? (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-950/40 px-3 py-2 rounded-lg border border-emerald-500/40">
                    <CheckCircle2 size={16} />
                    <span>{t('maxLevelLabel')}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(fac.id)}
                    disabled={!canAfford}
                    className={`w-full py-2.5 px-4 rounded-xl border-2 font-retro text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 shadow-[0_3px_0_#020617] ${
                      canAfford
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-white cursor-pointer active:translate-y-0.5'
                        : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>{t('upgradeFor')}</span>
                    <span className="text-[9px] font-sans font-normal opacity-90">
                      ${cost} {t('coinsUnit')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between text-[9px] font-mono text-slate-500">
        <span>{t('facilitiesScreenSub')}</span>
        <span>RETRO RUGBY</span>
      </div>
    </div>
  );
};
