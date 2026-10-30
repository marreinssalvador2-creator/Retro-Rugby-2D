/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { retroAudio } from '../../audio/retroAudio';
import { useTranslation } from '../../i18n/context';

interface TutorialScreenProps {
  onBack: () => void;
}

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const tutorialSteps = [
    {
      title: t('tutorialDodgeHeading'),
      coachDialog: t('tutorialDodgeDesc'),
      keyAction: 'W/S (↑↓)',
      mobileAction: 'Swipe Up / Down',
      tip: 'Juke tacklers to make them slip and hit the grass!',
    },
    {
      title: t('tutorialPassHeading'),
      coachDialog: t('tutorialPassDesc'),
      keyAction: 'Space or Click mouse',
      mobileAction: 'Swipe Forward then Left / Right',
      tip: 'A golden ring marks the best open receiver.',
    },
    {
      title: t('tutorialKickHeading'),
      coachDialog: t('tutorialKickDesc'),
      keyAction: 'Q key',
      mobileAction: 'Drag Backward to aim dots forward, release to kick',
      tip: 'The farther back you pull, the higher and longer the kick flies.',
    },
    {
      title: t('tutorialRuckHeading'),
      coachDialog: t('tutorialRuckDesc'),
      keyAction: 'F key (Dive Tackle), E (Switch player)',
      mobileAction: 'Tap Tackle button',
      tip: 'Turnovers restart play exactly at the spot of the ball recovery.',
    },
  ];

  const step = tutorialSteps[currentStepIndex];

  const handleNext = () => {
    retroAudio.playButtonPress();
    if (currentStepIndex < tutorialSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onBack();
    }
  };

  const handlePrev = () => {
    retroAudio.playButtonPress();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
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
            <span className="font-bold text-amber-300">{t('tutorialRulesTitle')}</span>
            <span className="text-[9px] font-sans text-slate-400 block">
              {currentStepIndex + 1} / {tutorialSteps.length}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            retroAudio.playButtonPress();
            onBack();
          }}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded text-[10px] cursor-pointer"
        >
          {t('exit')}
        </button>
      </div>

      {/* Coach Speech Bubble Card */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 my-3 flex flex-col justify-center">
        <div className="bg-slate-900/95 border-3 border-amber-400 rounded-2xl p-4 md:p-6 shadow-[0_6px_0_#78350f] font-retro">
          {/* Coach avatar & Title */}
          <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3">
            <div className="w-12 h-12 bg-amber-400 rounded-xl border-2 border-white flex items-center justify-center text-slate-950 font-black text-xl shadow">
              🏉
            </div>
            <div>
              <span className="text-[10px] text-amber-400 block">HEAD COACH:</span>
              <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
                {step.title}
              </h2>
            </div>
          </div>

          {/* Coach dialog speech bubble */}
          <div className="relative bg-slate-950 p-3.5 rounded-xl border-2 border-slate-700 mb-4 font-sans text-xs md:text-sm text-slate-200 leading-relaxed">
            {step.coachDialog}
          </div>

          {/* Controls instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 font-sans text-xs">
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="font-retro text-[10px] text-emerald-400 block mb-1">
                🖥️ PC (KEYBOARD / MOUSE):
              </span>
              <p className="text-slate-300">{step.keyAction}</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="font-retro text-[10px] text-cyan-400 block mb-1">
                📱 MOBILE / TABLET (TOUCH):
              </span>
              <p className="text-slate-300">{step.mobileAction}</p>
            </div>
          </div>

          {/* Tactical tip */}
          <div className="bg-amber-400/10 border border-amber-400/40 p-2.5 rounded-lg text-[11px] font-sans text-amber-200 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400 shrink-0" />
            <span><strong>Tip:</strong> {step.tip}</span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between font-retro text-xs">
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          className={`py-2 px-4 rounded-xl border-2 flex items-center gap-1.5 transition-all ${
            currentStepIndex > 0
              ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600 cursor-pointer active:translate-y-0.5'
              : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
          }`}
        >
          <ChevronLeft size={16} />
          <span>{t('back')}</span>
        </button>

        <div className="flex gap-1.5">
          {tutorialSteps.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border ${
                i === currentStepIndex ? 'bg-amber-400 border-white' : 'bg-slate-800 border-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="py-2 px-5 bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-slate-950 font-bold rounded-xl border-2 border-white cursor-pointer shadow-[0_3px_0_#78350f] flex items-center gap-1.5"
        >
          <span>{currentStepIndex === tutorialSteps.length - 1 ? 'KICK OFF!' : 'NEXT'}</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
