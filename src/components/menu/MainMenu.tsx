/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Trophy, Play, Award, HelpCircle, Settings, Volume2, VolumeX, Music, Sparkles, Globe } from 'lucide-react';
import { retroAudio } from '../../audio/retroAudio';
import { GameScene } from '../../types/career';
import { useTranslation } from '../../i18n/context';

interface MainMenuProps {
  onNavigate: (scene: GameScene) => void;
  hasSavedCareer: boolean;
  onContinueCareer: () => void;
  onNewCareer: () => void;
  onQuickMatch: () => void;
  isMuted: boolean;
  isMusicMuted: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onNavigate,
  hasSavedCareer,
  onContinueCareer,
  onNewCareer,
  onQuickMatch,
  isMuted,
  isMusicMuted,
  onToggleMute,
  onToggleMusic,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t, language, setLanguage, languages } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Background animated pitch with H-posts and mini pixel players
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const renderBg = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Retro Sky
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // 2. Simple Grandstand / Stadium crowd silhouette
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, h * 0.22, w, h * 0.18);
      // Crowd pixels
      for (let i = 0; i < w; i += 8) {
        ctx.fillStyle = (i + tick) % 16 === 0 ? '#facc15' : ((i + tick) % 32 === 0 ? '#38bdf8' : '#334155');
        ctx.fillRect(i, h * 0.24, 4, 3);
      }

      // Stadium floodlight glow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(w * 0.1, 0);
      ctx.lineTo(w * 0.4, h);
      ctx.lineTo(w * 0.6, h);
      ctx.lineTo(w * 0.9, 0);
      ctx.fill();

      // 3. Green Grass Turf (Lateral Pitch View)
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, h * 0.4, w, h * 0.6);

      // Striped grass lanes
      for (let x = 0; x < w; x += 40) {
        ctx.fillStyle = (x / 40) % 2 === 0 ? '#16a34a' : '#15803d';
        ctx.fillRect(x, h * 0.4, 40, h * 0.6);
      }

      // Pitch white chalk line
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, h * 0.45, w, 2);
      ctx.fillRect(0, h * 0.85, w, 3);

      // 4. Retro H-Goal Posts on left & right
      const drawPost = (postX: number) => {
        ctx.fillStyle = '#ffffff';
        // Uprights
        ctx.fillRect(postX - 2, h * 0.25, 4, h * 0.45);
        ctx.fillRect(postX + 22, h * 0.25, 4, h * 0.45);
        // Crossbar
        ctx.fillRect(postX - 2, h * 0.48, 28, 4);
      };
      drawPost(40);
      drawPost(w - 70);

      // 5. Mini Animated Pixel Rugby Players running across the background
      const runnerX = (tick * 1.5) % (w + 100) - 50;
      const runnerY = h * 0.62;

      // Player A (carrier - sky blue)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(runnerX, runnerY - 12, 10, 10);
      ctx.fillStyle = '#ffffff'; // shorts
      ctx.fillRect(runnerX + 1, runnerY - 2, 8, 4);
      // Legs stride
      ctx.fillStyle = '#fde047'; // skin
      ctx.fillRect(runnerX + 2, runnerY + 2, 2, 4);
      ctx.fillRect(runnerX + 6, runnerY + (tick % 8 < 4 ? 4 : 1), 2, 4);
      // Oval ball in arm
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(runnerX + 8, runnerY - 8, 5, 4);

      // Chasing Player B (black/gold All Black)
      const chaserX = runnerX - 35;
      ctx.fillStyle = '#111111';
      ctx.fillRect(chaserX, runnerY - 12, 10, 10);
      ctx.fillStyle = '#111111';
      ctx.fillRect(chaserX + 1, runnerY - 2, 8, 4);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(chaserX + 2, runnerY + (tick % 8 < 4 ? 2 : 4), 2, 4);
      ctx.fillRect(chaserX + 6, runnerY + 2, 2, 4);

      animId = requestAnimationFrame(renderBg);
    };

    renderBg();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleClick = (action: () => void) => {
    retroAudio.playButtonPress();
    action();
  };

  const currentLangInfo = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-between p-4 md:p-6 overflow-hidden select-none bg-[#0b130e] text-white">
      {/* Background Animated Pixel Canvas */}
      <canvas
        ref={canvasRef}
        width={426}
        height={240}
        className="absolute inset-0 w-full h-full object-cover pixelated opacity-80"
      />

      {/* CRT Scanline overlay */}
      <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />

      {/* Top Header: Audio, Language & Version Controls */}
      <div className="relative z-20 w-full max-w-2xl flex items-center justify-between text-[10px] md:text-xs font-retro text-amber-300">
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 shadow-md">
          <Sparkles size={14} className="text-amber-400" />
          <span>{t('appEdition')}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector Dropdown / Button */}
          <div className="relative">
            <button
              onClick={() => {
                retroAudio.playButtonPress();
                setShowLangMenu(prev => !prev);
              }}
              className="p-1.5 px-2.5 rounded-lg border bg-slate-900/90 hover:bg-slate-800 border-amber-400/60 text-amber-300 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              title={t('language')}
            >
              <Globe size={13} className="text-amber-400" />
              <span>{currentLangInfo.flag}</span>
              <span className="font-bold">{currentLangInfo.code.toUpperCase()}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1.5 bg-slate-950/95 border-2 border-slate-700 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 min-w-[120px] z-50">
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      retroAudio.playButtonPress();
                      setLanguage(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-retro text-left cursor-pointer transition-colors ${
                      language === l.code
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Music Toggle */}
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onToggleMusic();
            }}
            className={`p-2 rounded-lg border transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
              !isMusicMuted 
                ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                : 'bg-slate-900/80 border-slate-700 text-slate-500'
            }`}
            title={t('music')}
          >
            <Music size={14} />
            <span className="hidden sm:inline">{t('music')}</span>
          </button>

          {/* SFX Toggle */}
          <button
            onClick={() => {
              retroAudio.playButtonPress();
              onToggleMute();
            }}
            className={`p-2 rounded-lg border transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
              !isMuted 
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                : 'bg-slate-900/80 border-slate-700 text-slate-500'
            }`}
            title={t('sfx')}
          >
            {!isMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span className="hidden sm:inline">{t('sfx')}</span>
          </button>
        </div>
      </div>

      {/* Main Logo & Title */}
      <div className="relative z-10 flex flex-col items-center mt-2 md:mt-4 text-center">
        {/* Pixel Art Oval Rugby Ball Graphic */}
        <div className="flex items-center gap-3 mb-2 animate-bounce">
          <div className="w-8 h-5 bg-white border-2 border-slate-950 rounded-full shadow-lg transform -rotate-12 flex items-center justify-center">
            <div className="w-1.5 h-full bg-slate-900/70" />
          </div>
          <span className="font-retro text-[10px] md:text-xs tracking-widest text-amber-300 bg-slate-950/90 px-3 py-1 rounded border border-amber-400">
            {t('rugbyUnion')}
          </span>
          <div className="w-8 h-5 bg-white border-2 border-slate-950 rounded-full shadow-lg transform rotate-12 flex items-center justify-center">
            <div className="w-1.5 h-full bg-slate-900/70" />
          </div>
        </div>

        <h1 className="font-retro text-2xl md:text-5xl font-black tracking-wider text-white drop-shadow-[0_4px_0_#0f172a] uppercase">
          {t('gameTitle1')} <span className="text-amber-400">{t('gameTitle2')}</span>
        </h1>
        <p className="font-retro text-[9px] md:text-[11px] text-slate-300 mt-1 tracking-widest">
          {t('gameSubtitle')}
        </p>
      </div>

      {/* Buttons Column (Chunky 3D Retro Bowl Buttons) */}
      <div className="relative z-10 w-full max-w-sm flex flex-col gap-2.5 my-auto">
        {/* 1. CARRERA (Botón Principal, Grande y Destacado) */}
        <button
          onClick={() => handleClick(hasSavedCareer ? onContinueCareer : onNewCareer)}
          className="group relative w-full py-3.5 px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:translate-y-1 text-slate-950 font-retro text-xs md:text-sm rounded-xl border-3 border-white shadow-[0_6px_0_#78350f] active:shadow-[0_2px_0_#78350f] cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Trophy size={20} className="text-slate-950 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col text-left">
              <span className="font-black tracking-wider">{t('careerMode')}</span>
              <span className="text-[8px] font-sans font-bold opacity-80">
                {hasSavedCareer ? t('continueDynasty') : t('newSeasonClub')}
              </span>
            </div>
          </div>
          <span className="text-xs bg-slate-950 text-amber-300 px-2 py-0.5 rounded font-mono">
            {hasSavedCareer ? t('loadCareer') : t('newCareer')}
          </span>
        </button>

        {/* 2. PARTIDO RÁPIDO */}
        <button
          onClick={() => handleClick(onQuickMatch)}
          className="w-full py-2.5 px-5 bg-slate-900/90 hover:bg-slate-800 active:translate-y-1 text-white font-retro text-[11px] md:text-xs rounded-xl border-2 border-slate-600 shadow-[0_4px_0_#0f172a] active:shadow-[0_1px_0_#0f172a] cursor-pointer transition-all flex items-center gap-3"
        >
          <Play size={18} className="text-emerald-400" />
          <div className="flex flex-col text-left">
            <span className="font-bold">{t('quickMatch')}</span>
            <span className="text-[8px] font-sans text-slate-400">{t('quickMatchSub')}</span>
          </div>
        </button>

        {/* 3. CAMPEONATOS */}
        <button
          onClick={() => handleClick(() => onNavigate('CHAMPIONSHIPS'))}
          className="w-full py-2.5 px-5 bg-slate-900/90 hover:bg-slate-800 active:translate-y-1 text-white font-retro text-[11px] md:text-xs rounded-xl border-2 border-slate-600 shadow-[0_4px_0_#0f172a] active:shadow-[0_1px_0_#0f172a] cursor-pointer transition-all flex items-center gap-3"
        >
          <Award size={18} className="text-amber-400" />
          <div className="flex flex-col text-left">
            <span className="font-bold">{t('championships')}</span>
            <span className="text-[8px] font-sans text-slate-400">{t('championshipsSub')}</span>
          </div>
        </button>

        {/* 4. TUTORIAL */}
        <button
          onClick={() => handleClick(() => onNavigate('TUTORIAL'))}
          className="w-full py-2.5 px-5 bg-slate-900/90 hover:bg-slate-800 active:translate-y-1 text-white font-retro text-[11px] md:text-xs rounded-xl border-2 border-slate-600 shadow-[0_4px_0_#0f172a] active:shadow-[0_1px_0_#0f172a] cursor-pointer transition-all flex items-center gap-3"
        >
          <HelpCircle size={18} className="text-cyan-400" />
          <div className="flex flex-col text-left">
            <span className="font-bold">{t('tutorial')}</span>
            <span className="text-[8px] font-sans text-slate-400">{t('tutorialSub')}</span>
          </div>
        </button>

        {/* 5. AJUSTES */}
        <button
          onClick={() => handleClick(() => onNavigate('SETTINGS'))}
          className="w-full py-2.5 px-5 bg-slate-900/90 hover:bg-slate-800 active:translate-y-1 text-white font-retro text-[11px] md:text-xs rounded-xl border-2 border-slate-600 shadow-[0_4px_0_#0f172a] active:shadow-[0_1px_0_#0f172a] cursor-pointer transition-all flex items-center gap-3"
        >
          <Settings size={18} className="text-purple-400" />
          <div className="flex flex-col text-left">
            <span className="font-bold">{t('settings')}</span>
            <span className="text-[8px] font-sans text-slate-400">{t('settingsSub')}</span>
          </div>
        </button>
      </div>

      {/* Footer / Credits / Version */}
      <div className="relative z-10 w-full max-w-2xl flex items-center justify-between text-[9px] md:text-[10px] font-mono text-slate-400 bg-slate-950/80 px-4 py-2 rounded-lg border border-slate-800">
        <span>{t('version')}</span>
        <span className="text-amber-400">{t('controlsInfo')}</span>
        <span>{t('copyright')}</span>
      </div>
    </div>
  );
};
