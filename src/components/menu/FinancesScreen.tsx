/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Award, Ticket, Users, Shield } from 'lucide-react';
import { CareerTeamData } from '../../types/career';
import { retroAudio } from '../../audio/retroAudio';
import { useTranslation } from '../../i18n/context';

interface FinancesScreenProps {
  career: CareerTeamData;
  onBack: () => void;
}

export const FinancesScreen: React.FC<FinancesScreenProps> = ({
  career,
  onBack,
}) => {
  const { t } = useTranslation();
  const stadiumIncomeBonus = (career.facilities.stadium - 1) * 25;
  const totalSalaries = career.roster.reduce((acc, p) => acc + p.salary, 0);

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
            <span className="font-bold text-amber-300">{t('financesScreenTitle')}</span>
            <span className="text-[9px] font-sans text-slate-400 block">
              {t('financesScreenSub')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/50 px-3 py-1 rounded-lg text-amber-300">
          <DollarSign size={16} className="text-amber-400" />
          <span className="font-bold text-sm">{career.coins}</span>
          <span className="text-[8px] font-sans text-amber-400 uppercase">{t('budgetLabel')}</span>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 my-3 overflow-y-auto space-y-3 font-retro">
        {/* Main Balance Hero */}
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-400/80 rounded-xl p-4 shadow-[0_4px_0_#78350f] flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-amber-300 block mb-1">{t('currentTreasury')}:</span>
            <div className="flex items-center gap-2">
              <DollarSign size={28} className="text-amber-400" />
              <span className="text-2xl md:text-4xl font-black text-white">{career.coins}</span>
              <span className="text-xs text-amber-400 font-sans uppercase">{t('coinsUnit')}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-sans text-slate-400 block">{t('fanSupport')}</span>
            <span className="text-rose-400 text-lg font-bold">{career.fanSupport}%</span>
          </div>
        </div>

        {/* Income vs Expenses breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* INCOME (INGRESOS) */}
          <div className="bg-slate-900/90 border-2 border-slate-700 rounded-xl p-3.5 shadow-[0_3px_0_#020617]">
            <div className="flex items-center gap-2 text-emerald-400 mb-3 border-b border-slate-800 pb-2">
              <TrendingUp size={16} />
              <span className="text-xs font-bold">{t('incomeCategory')}</span>
            </div>

            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span className="text-slate-300 flex items-center gap-1.5 font-sans">
                  <Award size={12} className="text-amber-400" /> {t('winBonusIncome')}
                </span>
                <span className="text-emerald-400 font-bold font-mono">+60 {t('coinsUnit')}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span className="text-slate-300 flex items-center gap-1.5 font-sans">
                  <Award size={12} className="text-amber-400" /> {t('blowoutBonusIncome')}
                </span>
                <span className="text-emerald-400 font-bold font-mono">+25 {t('coinsUnit')}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span className="text-slate-300 flex items-center gap-1.5 font-sans">
                  <Ticket size={12} className="text-amber-400" /> {t('ticketIncome')} ({t('levelLabel')} {career.facilities.stadium})
                </span>
                <span className="text-emerald-400 font-bold font-mono">+{25 + stadiumIncomeBonus} {t('coinsUnit')}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-300 flex items-center gap-1.5 font-sans">
                  <Award size={12} className="text-amber-400" /> {t('prizeReward')}
                </span>
                <span className="text-emerald-400 font-bold font-mono">+500 - +1500</span>
              </div>
            </div>
          </div>

          {/* EXPENSES (EGRESOS) */}
          <div className="bg-slate-900/90 border-2 border-slate-700 rounded-xl p-3.5 shadow-[0_3px_0_#020617]">
            <div className="flex items-center gap-2 text-rose-400 mb-3 border-b border-slate-800 pb-2">
              <TrendingDown size={16} />
              <span className="text-xs font-bold">{t('expenseCategory')}</span>
            </div>

            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span className="text-slate-300 flex items-center gap-1.5 font-sans">
                  <Users size={12} className="text-slate-400" /> {t('playerContractsCost')} ({career.roster.length} {t('squad')})
                </span>
                <span className="text-slate-300 font-mono font-bold">${totalSalaries}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span className="text-slate-300 flex items-center gap-1.5 font-sans">
                  <Shield size={12} className="text-slate-400" /> {t('facilityMaintenance')}
                </span>
                <span className="text-slate-300 font-mono font-bold">$0</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-300 flex items-center gap-1.5 font-sans">
                  <DollarSign size={12} className="text-slate-400" /> {t('contractHeader')}
                </span>
                <span className="text-amber-300 font-mono font-bold">100 - 180 {t('coinsUnit')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between text-[9px] font-mono text-slate-500">
        <span>RETRO BOWL RUGBY</span>
        <span>NO MICROTRANSACTIONS</span>
      </div>
    </div>
  );
};
