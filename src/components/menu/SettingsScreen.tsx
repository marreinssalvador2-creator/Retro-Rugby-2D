/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Volume2, Music, Smartphone, Globe, Trash2, CheckCircle2 } from 'lucide-react';
import { GameSettings, Language } from '../../types/career';
import { CareerStorageService } from '../../services/careerStorage';
import { retroAudio } from '../../audio/retroAudio';
import { useTranslation } from '../../i18n/context';

interface SettingsScreenProps {
  onBack: () => void;
  onResetAllData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onResetAllData,
}) => {
  const { t, language, setLanguage, languages } = useTranslation();

  const [settings, setSettings] = useState<GameSettings>(() => {
    return CareerStorageService.loadSettings();
  });

  const [confirmReset, setConfirmReset] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    retroAudio.playButtonPress();
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    CareerStorageService.saveSettings(updated);

    if (key === 'soundEnabled') {
      retroAudio.setMuted(!value);
    }

    if (key === 'musicEnabled') {
      retroAudio.setMusicMuted(!value);
      if (value) {
        retroAudio.startChiptune();
      } else {
        retroAudio.stopChiptune();
      }
    }

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1500);
  };

  const handleLanguageChange = (lang: Language) => {
    retroAudio.playButtonPress();
    setLanguage(lang);
    setSettings(prev => ({ ...prev, language: lang }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1500);
  };

  const handleReset = () => {
    retroAudio.playWhistle();
    CareerStorageService.clearAllData();
    onResetAllData();
  };

  return (
    <div className="relative w-screen h-screen flex flex-col justify-between p-3 md:p-5 overflow-hidden select-none bg-[#0a110d] text-white">
      {/* Scanline filter */}
      <div className="absolute inset-0 scanlines opacity-25 pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex items-center justify-between bg-slate-950/95 border-2 border-slate-700 rounded-xl p-2.5 md:p-3 shadow-[0_4px_0_#020617] font-retro text-xs md:text-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onBack();
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-white cursor-pointer active:translate-y-0.5"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="font-bold text-amber-300">{t('settingsScreenTitle')}</span>
            <span className="text-[9px] font-sans text-slate-400 block">
              {t('settingsScreenSub')}
            </span>
          </div>
        </div>

        {savedNotice && (
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
            <CheckCircle2 size={12} /> {t('saved')}
          </span>
        )}
      </div>

      {/* Settings List */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex-1 my-3 overflow-y-auto space-y-3 font-retro text-xs">
        {/* 1. SELECCIÓN DE IDIOMA / LANGUAGE SELECTOR */}
        <div className="bg-slate-900/90 border-2 border-amber-500/50 rounded-xl p-3.5 shadow-[0_3px_0_#020617]">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-1.5">
            <span className="text-amber-300 text-[11px] flex items-center gap-2">
              <Globe size={16} className="text-amber-400" />
              {t('languageSection')}
            </span>
            <span className="text-[9px] text-slate-400 font-sans">
              {t('chooseLanguage')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
            {languages.map(l => (
              <button
                key={l.code}
                onClick={() => handleLanguageChange(l.code)}
                className={`p-2.5 rounded-lg border font-bold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  language === l.code
                    ? 'bg-amber-400 text-slate-950 border-white shadow-[0_3px_0_#78350f]'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="text-base">{l.flag}</span>
                <span>{l.name.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. AUDIO Y MÚSICA */}
        <div className="bg-slate-900/90 border-2 border-slate-700 rounded-xl p-3.5 shadow-[0_3px_0_#020617]">
          <span className="text-amber-300 text-[11px] block mb-3 border-b border-slate-800 pb-1.5">
            {t('audioSection')}
          </span>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-emerald-400" />
                <span>{t('sfxLabel')}</span>
              </div>
              <button
                onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                  settings.soundEnabled ? 'bg-emerald-600 border-white text-white' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                {settings.soundEnabled ? t('sfxOn') : t('sfxOff')}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music size={16} className="text-amber-400" />
                <span>{t('musicLabel')}</span>
              </div>
              <button
                onClick={() => updateSetting('musicEnabled', !settings.musicEnabled)}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                  settings.musicEnabled ? 'bg-amber-500 border-white text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                {settings.musicEnabled ? t('musicOn') : t('musicOff')}
              </button>
            </div>
          </div>
        </div>

        {/* 3. DIFICULTAD */}
        <div className="bg-slate-900/90 border-2 border-slate-700 rounded-xl p-3.5 shadow-[0_3px_0_#020617]">
          <span className="text-amber-300 text-[11px] block mb-3 border-b border-slate-800 pb-1.5">
            {t('aiDifficultySection')}
          </span>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            {(['facil', 'normal', 'dificil'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => updateSetting('difficulty', diff)}
                className={`p-2 rounded-lg border font-bold cursor-pointer uppercase transition-all ${
                  settings.difficulty === diff
                    ? 'bg-amber-400 text-slate-950 border-white shadow-[0_2px_0_#78350f]'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {diff === 'facil' ? t('easy') : diff === 'normal' ? t('normal') : t('hard')}
              </button>
            ))}
          </div>
        </div>

        {/* 4. VIBRACIÓN Y RESPUESTA HÁPTICA */}
        <div className="bg-slate-900/90 border-2 border-slate-700 rounded-xl p-3.5 shadow-[0_3px_0_#020617]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-cyan-400" />
              <span>{t('vibrationLabel')}</span>
            </div>
            <button
              onClick={() => updateSetting('vibration', !settings.vibration)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                settings.vibration ? 'bg-cyan-600 border-white text-white' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {settings.vibration ? t('yes') : t('no')}
            </button>
          </div>
        </div>

        {/* 5. REINICIAR PROGRESO */}
        <div className="bg-rose-950/30 border-2 border-rose-900/70 rounded-xl p-3.5 shadow-[0_3px_0_#020617]">
          <span className="text-rose-400 text-[11px] block mb-2">
            {t('dangerZone')}
          </span>

          {confirmReset ? (
            <div className="bg-slate-950 p-3 rounded-lg border border-rose-500 flex flex-col gap-2">
              <span className="text-[10px] text-white">
                {t('resetConfirmText')}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  {t('resetConfirmYes')}
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-[10px] cursor-pointer"
                >
                  {t('resetConfirmNo')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-3 py-2 bg-slate-900 hover:bg-rose-900/50 border border-rose-700/60 text-rose-300 rounded-lg text-[10px] cursor-pointer flex items-center gap-2"
            >
              <Trash2 size={14} />
              <span>{t('resetProgressBtn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex items-center justify-between text-[9px] font-mono text-slate-500">
        <span>{t('localPreferences')}</span>
        <span>RETRO RUGBY 2D</span>
      </div>
    </div>
  );
};
