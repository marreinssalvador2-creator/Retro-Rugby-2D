/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MatchEventMessage } from '../types/rugby';
import { ShieldAlert, Activity, Radio, Zap } from 'lucide-react';
import { useTranslation } from '../i18n/context';

interface RivalDriveOverlayProps {
  stage?: 'pelota_perdida' | 'rival_avanza' | 'rack' | 'outcome_recovered' | 'outcome_try' | 'outcome_conversion';
  eventMessage: MatchEventMessage | null;
  rivalName: string;
  onSkip?: () => void;
}

export const RivalDriveOverlay: React.FC<RivalDriveOverlayProps> = ({
  stage = 'rival_avanza',
  eventMessage,
  rivalName,
  onSkip,
}) => {
  const { t } = useTranslation();

  const getBannerData = () => {
    switch (stage) {
      case 'pelota_perdida':
        return {
          title: t('rivalHasBall'),
          subtitle: `${rivalName.toUpperCase()}`,
          color: 'bg-red-600 border-yellow-300 text-yellow-300',
          icon: <ShieldAlert size={28} className="animate-bounce text-yellow-300" />,
        };
      case 'rival_avanza':
        return {
          title: t('rivalGainsMeters'),
          subtitle: `${rivalName.toUpperCase()}`,
          color: 'bg-amber-600 border-white text-white',
          icon: <Activity size={28} className="animate-pulse text-amber-200" />,
        };
      case 'rack':
        return {
          title: t('rivalFormingRuck'),
          subtitle: 'RUCK CONTEST',
          color: 'bg-purple-700 border-amber-400 text-amber-300',
          icon: <Zap size={28} className="animate-ping text-amber-300" />,
        };
      case 'outcome_recovered':
        return {
          title: t('rivalBallRecovered'),
          subtitle: 'TURNOVER!',
          color: 'bg-emerald-600 border-white text-white',
          icon: <Radio size={28} className="animate-bounce text-emerald-200" />,
        };
      case 'outcome_try':
        return {
          title: t('rivalTryScored'),
          subtitle: `+5 PTS: ${rivalName.toUpperCase()}`,
          color: 'bg-red-700 border-white text-white',
          icon: <ShieldAlert size={28} className="text-white" />,
        };
      case 'outcome_conversion':
        return {
          title: eventMessage?.text || t('rivalConversionScored'),
          subtitle: eventMessage?.subtext || 'KICK AT GOAL',
          color: 'bg-slate-900 border-amber-400 text-amber-300',
          icon: <Zap size={28} className="text-amber-400" />,
        };
      default:
        return {
          title: eventMessage?.text || t('rivalPossessionTitle'),
          subtitle: eventMessage?.subtext || rivalName.toUpperCase(),
          color: 'bg-slate-900 border-amber-400 text-amber-300',
          icon: <Radio size={28} className="text-amber-400" />,
        };
    }
  };

  const data = getBannerData();

  return (
    <div 
      onClick={onSkip}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-auto cursor-pointer select-none bg-black/60 backdrop-blur-xs animate-fade-in p-4"
    >
      {/* Top Retro Broadcast Ticker */}
      <div className="absolute top-12 md:top-14 flex items-center gap-2 bg-slate-950/90 border border-slate-700 px-4 py-1.5 rounded-full shadow-2xl">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
        <span className="text-[10px] md:text-xs font-retro text-slate-200 tracking-wider">
          {t('rivalPossessionTitle')}
        </span>
      </div>

      {/* Main Full-Screen Center Retro Card */}
      <div className={`w-full max-w-lg p-6 md:p-8 rounded-2xl border-4 shadow-2xl flex flex-col items-center text-center transform transition-all scale-100 ${data.color}`}>
        <div className="mb-3">{data.icon}</div>
        
        <h1 className="font-retro text-xl md:text-3xl font-black tracking-widest drop-shadow-md mb-2">
          {data.title}
        </h1>

        <p className="font-retro text-[10px] md:text-xs tracking-wide opacity-95 max-w-md uppercase leading-relaxed">
          {data.subtitle}
        </p>

        {/* Dynamic retro animated meter / progress bar */}
        <div className="w-full max-w-xs mt-6 bg-black/40 h-3 rounded-full overflow-hidden p-0.5 border border-white/30">
          <div className="h-full bg-white/80 rounded-full animate-pulse w-full" />
        </div>

        {/* Skip Callout Badge */}
        <div className="mt-4 px-3 py-1 bg-black/50 border border-white/40 rounded-full text-[10px] font-retro text-white animate-bounce flex items-center gap-1.5">
          <span>⚡ {t('touchToSkip')}</span>
        </div>
      </div>
    </div>
  );
};
