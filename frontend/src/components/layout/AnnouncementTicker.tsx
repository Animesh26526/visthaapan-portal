import React, { useState } from 'react';
import { useLanguage } from '../../i18n';

export interface TickerAlert {
  id: string;
  type: 'critical' | 'weather' | 'road' | 'shelter' | 'system';
  typeLabelKey: 'tickerCriticalAlert' | 'tickerWeather' | 'tickerRoad' | 'tickerShelter' | 'tickerStatus';
  text: string;
  time: string;
}

const DEFAULT_ALERTS: TickerAlert[] = [
  {
    id: 'alt-1',
    type: 'critical',
    typeLabelKey: 'tickerCriticalAlert',
    text: 'Active subsidence rate in Joshimath Ward 4-7 recorded at 4.2mm/day (ISRO Bhuvan InSAR). Red zone evacuation protocol initiated.',
    time: '10:45 IST',
  },
  {
    id: 'alt-2',
    type: 'weather',
    typeLabelKey: 'tickerWeather',
    text: 'IMD Doppler Radar: Orange alert for upper catchment area of Alaknanda & Dhauliganga basins. 48hr precipitation index elevated.',
    time: '11:15 IST',
  },
  {
    id: 'alt-3',
    type: 'road',
    typeLabelKey: 'tickerRoad',
    text: 'NH-07 Helang-Joshimath corridor operational with BRO heavy-clearing earthmovers positioned at KM 44.',
    time: '11:30 IST',
  },
  {
    id: 'alt-4',
    type: 'shelter',
    typeLabelKey: 'tickerShelter',
    text: 'Gauchar Aerodrome Hub (5,500 cap) and Karnaprayag Hub (3,800 cap) audited. Field hospitals operational.',
    time: '11:40 IST',
  },
  {
    id: 'alt-5',
    type: 'system',
    typeLabelKey: 'tickerStatus',
    text: 'Baseline Plan #VST-2026-CHM-014 verified by Google OR-Tools SCIP in 12ms. 100% feasibility (0 unmet demand).',
    time: 'LIVE',
  },
];

export const AnnouncementTicker: React.FC = () => {
  const { t } = useLanguage();
  const [isPaused, setIsPaused] = useState(false);

  const getTypeStyle = (type: TickerAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-600 text-white font-black';
      case 'weather':
        return 'bg-amber-500 text-slate-950 font-bold';
      case 'road':
        return 'bg-blue-600 text-white font-bold';
      case 'shelter':
        return 'bg-emerald-600 text-white font-bold';
      case 'system':
      default:
        return 'bg-indigo-600 text-white font-bold';
    }
  };

  return (
    <div
      className="bg-[#001c38] text-slate-200 border-b border-[#003366] text-xs h-8 flex items-center select-none overflow-hidden relative z-[55] w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Disaster Announcement Ticker"
    >
      {/* Fixed Leading Badge */}
      <div className="bg-[#b91c1c] text-white px-2.5 h-full flex items-center gap-1.5 shrink-0 font-bold text-[11px] tracking-wider uppercase shadow-md z-10">
        <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping"></span>
        <span className="hidden xs:inline">LIVE UPDATES</span>
        <span className="xs:hidden">LIVE</span>
      </div>

      {/* Marquee Content */}
      <div className="flex-1 overflow-hidden relative flex items-center h-full">
        <div
          className="flex items-center gap-8 whitespace-nowrap will-change-transform animate-marquee"
          style={{
            animationDuration: '40s',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {/* Double repeat for seamless infinite looping */}
          {[...DEFAULT_ALERTS, ...DEFAULT_ALERTS].map((alert, idx) => (
            <div key={`${alert.id}-${idx}`} className="inline-flex items-center gap-2 text-[11px]">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] tracking-wide font-mono ${getTypeStyle(
                  alert.type
                )}`}
              >
                {t(alert.typeLabelKey)}
              </span>
              <span className="text-slate-200 font-medium">{alert.text}</span>
              <span className="text-slate-400 font-mono text-[10px]">[{alert.time}]</span>
              <span className="text-slate-600 text-xs px-2">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pause/Hover Indicator */}
      <div className="hidden md:flex items-center gap-1 px-2.5 text-[10px] text-slate-400 font-mono shrink-0 bg-[#001c38]/90 z-10 border-l border-[#003366]">
        <span className="material-symbols-outlined text-[12px]">
          {isPaused ? 'pause_circle' : 'motion_photos_on'}
        </span>
        <span>{isPaused ? 'PAUSED' : 'HOVER TO PAUSE'}</span>
      </div>
    </div>
  );
};
