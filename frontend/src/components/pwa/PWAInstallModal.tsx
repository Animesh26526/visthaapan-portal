import React from 'react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#003366] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="VISTHAAPAN"
              className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-md"
            />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">Install VISTHAAPAN</h3>
              <p className="text-[11px] text-slate-300">Standalone Disaster Management App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 text-slate-700 text-xs sm:text-sm">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#003366] text-[20px] shrink-0 mt-0.5">
              bolt
            </span>
            <div className="text-xs text-slate-700 leading-relaxed">
              Installing enables <strong>instant offline launch</strong>, full-screen map views, and faster emergency response coordination.
            </div>
          </div>

          {isIOS ? (
            /* iOS Instructions */
            <div className="space-y-3">
              <p className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">
                How to install on iOS / Safari:
              </p>
              <ol className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 font-mono font-bold text-slate-800 flex items-center justify-center text-[10px] shrink-0">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button (
                    <span className="material-symbols-outlined text-[14px] align-middle text-[#003366]">ios_share</span>
                    ) in Safari's bottom toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 font-mono font-bold text-slate-800 flex items-center justify-center text-[10px] shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong> (
                    <span className="material-symbols-outlined text-[14px] align-middle text-slate-800">add_box</span>
                    ).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 font-mono font-bold text-slate-800 flex items-center justify-center text-[10px] shrink-0">
                    3
                  </span>
                  <span>Tap <strong>Add</strong> in the top-right corner to finish.</span>
                </li>
              </ol>
            </div>
          ) : (
            /* Android / Chrome / Edge Instructions */
            <div className="space-y-3">
              <p className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">
                How to install on Android or PC:
              </p>
              <ol className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 font-mono font-bold text-slate-800 flex items-center justify-center text-[10px] shrink-0">
                    1
                  </span>
                  <span>
                    Tap the browser menu (
                    <span className="material-symbols-outlined text-[14px] align-middle text-slate-800">more_vert</span>
                    ) in Chrome or Edge, or look for the Install icon in the address bar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 font-mono font-bold text-slate-800 flex items-center justify-center text-[10px] shrink-0">
                    2
                  </span>
                  <span>
                    Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 font-mono font-bold text-slate-800 flex items-center justify-center text-[10px] shrink-0">
                    3
                  </span>
                  <span>Confirm by clicking <strong>Install</strong>.</span>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
