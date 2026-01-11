
import React from 'react';
import { Globe, ArrowRight, Fingerprint } from 'lucide-react';
import { Language } from '../types';

interface Props {
  onSelect: (lang: Language) => void;
}

const LanguageGate: React.FC<Props> = ({ onSelect }) => {
  const langs: { id: Language; name: string; flag: string; label: string }[] = [
    { id: 'pt-PT', name: 'Português', flag: '🇵🇹', label: 'Selecione o Idioma' },
    { id: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷', label: 'Selecione o Idioma' },
    { id: 'en', name: 'English', flag: '🇺🇸', label: 'Select Language' },
    { id: 'es-ES', name: 'Español', flag: '🇪🇸', label: 'Seleccionar Idioma' },
    { id: 'fr', name: 'Français', flag: '🇫🇷', label: 'Choisir la langue' },
    { id: 'de', name: 'Deutsch', flag: '🇩🇪', label: 'Sprache wählen' },
    { id: 'it', name: 'Italiano', flag: '🇮🇹', label: 'Scegli la lingua' },
    { id: 'uk', name: 'Українська', flag: '🇺🇦', label: 'Оберіть мову' },
    { id: 'ru', name: 'Русский', flag: '🇷🇺', label: 'Выберите язык' },
    { id: 'de-CH', name: 'Schwiiz', flag: '🇨🇭', label: 'Schwiizerdütsch' },
    { id: 'zh', name: '中文', flag: '🇨🇳', label: '选择语言' },
    { id: 'ja', name: '日本語', flag: '🇯🇵', label: '言語を選択' },
    { id: 'hi', name: 'हिन्दी', flag: '🇮🇳', label: 'भाषा चुनें' },
    { id: 'ga', name: 'Gaeilge', flag: '🇮🇪', label: 'Roghnaigh teanga' },
    { id: 'es-AR', name: 'Argentina', flag: '🇦🇷', label: 'Elegir idioma' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 md:p-8 z-[100] overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-5xl bg-slate-900/40 backdrop-blur-3xl border border-slate-800 rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-[modalScale_0.5s_ease-out]">
        
        <div className="p-8 md:p-12 border-b border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-green-500 rounded-2xl flex items-center justify-center shadow-lg group">
              <Globe className="w-10 h-10 text-white animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter">DIGITAL <span className="text-purple-400">NEXUS</span></h2>
              <div className="flex items-center gap-2 mt-1">
                <Fingerprint className="w-3 h-3 text-slate-500" />
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Global Access System v2.0</p>
              </div>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Platform</p>
            <p className="text-[10px] text-green-500 font-black mt-1">SECURE CONNECTION ACTIVE</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
          <h3 className="text-xl font-bold text-slate-300 mb-8 flex items-center gap-3">
             <span className="w-8 h-[1px] bg-slate-700"></span>
             CHOOSE YOUR REGION / ESCOLHA O IDIOMA
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {langs.map((l) => (
              <button
                key={l.id}
                onClick={() => onSelect(l.id)}
                className="group flex items-center justify-between p-6 bg-slate-800/30 border border-slate-800 rounded-2xl hover:bg-purple-600 hover:border-purple-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/20"
              >
                <div className="flex items-center gap-5">
                  <span className="text-3xl filter group-hover:drop-shadow-lg">{l.flag}</span>
                  <div className="text-left">
                    <p className="text-sm font-black text-white group-hover:text-white uppercase tracking-wider">{l.name}</p>
                    <p className="text-[10px] text-slate-500 group-hover:text-purple-200 font-bold mt-0.5">{l.label}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-slate-800/50 bg-slate-950/50 text-center shrink-0">
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.4em]">Digital Nexus Solutions — All Rights Reserved 2025</p>
        </div>
      </div>

      <style>{`
        @keyframes modalScale {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default LanguageGate;
