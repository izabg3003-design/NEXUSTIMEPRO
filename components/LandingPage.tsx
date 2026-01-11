
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, CheckCircle2, Sparkles, ShieldCheck, Zap, Clock, Wallet, Mail, ShieldAlert, Star, TrendingUp, FileText, Quote, Globe, Info, Megaphone, X
} from 'lucide-react';
import { Language, AppBanner } from '../types';
import { supabase } from '../lib/supabase';

interface Props {
  onLogin: () => void;
  onSubscribe: () => void;
  onPrivacy: () => void;
  onTerms: () => void;
  onAbout: () => void;
  t: (key: string) => any;
  lang: Language;
  setLang: (l: Language) => void;
}

const LandingPage: React.FC<Props> = ({ onLogin, onSubscribe, onPrivacy, onTerms, onAbout, t, lang, setLang }) => {
  const [scrolled, setScrolled] = useState(false);
  const [activeBanners, setActiveBanners] = useState<AppBanner[]>([]);
  const [showBannerOverlay, setShowBannerOverlay] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase.from('app_banners').select('*').eq('is_active', true).order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setActiveBanners(data);
          // Mostrar o banner overlay após 1.5 segundos
          setTimeout(() => setShowBannerOverlay(true), 1500);
        }
      } catch (e) {
        console.warn("Nexus Banners: Tabela não configurada ou inacessível.");
      }
    };
    fetchBanners();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const BannerOverlay = () => {
    if (!showBannerOverlay || activeBanners.length === 0) return null;
    
    const banner = activeBanners[0]; // Mostra o mais recente

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/60 animate-[fadeIn_0.3s_ease-out]">
        <div className={`relative w-full max-w-4xl bg-slate-900 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-${banner.theme_color}-500/30 animate-[modalScale_0.4s_ease-out]`}>
          
          {/* Botão Fechar (O único elemento de interação restante) */}
          <button 
            onClick={() => setShowBannerOverlay(false)}
            className="absolute top-6 right-6 z-50 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>

          {banner.image_url ? (
            <div className="relative aspect-[16/10] md:aspect-[16/9]">
              <img src={banner.image_url} className="w-full h-full object-cover" alt={banner.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
            </div>
          ) : (
            <div className="p-12 md:p-20 text-center flex flex-col items-center justify-center min-h-[450px]">
              <div className={`w-24 h-24 rounded-3xl bg-${banner.theme_color}-500/10 border border-${banner.theme_color}-500/20 flex items-center justify-center`}>
                 <Megaphone className={`w-10 h-10 text-${banner.theme_color}-400`} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PromoBanner = () => (
    <div className="max-w-4xl mx-auto px-6 mb-12 animate-soft">
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 rounded-[3rem] p-8 md:p-12 border border-emerald-500/30 shadow-[0_30px_70px_rgba(0,0,0,0.4)] overflow-hidden ring-1 ring-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Star className="w-32 h-32 text-emerald-500 fill-emerald-500" />
        </div>
        
        <div className="absolute top-6 right-6 bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-pulse z-20">
          {t('landing.promo.badge')}
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-center relative z-10">
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Licença Digital Nexus
              </p>
              <h3 className="text-3xl md:text-4xl font-black text-white italic uppercase leading-tight tracking-tighter">
                {t('landing.promo.title')} <br/><span className="text-emerald-400">{t('landing.promo.highlight')}</span>
              </h3>
            </div>
            
            <ul className="grid grid-cols-1 gap-4">
              {Array.isArray(t('landing.promo.advantages')) && t('landing.promo.advantages').map((adv: string, i: number) => (
                <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-300 group/item">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform">
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="group-hover/item:text-white transition-colors">{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center p-10 bg-slate-950/60 rounded-[3rem] border border-white/5 min-w-[280px] shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-500 line-through text-lg font-bold opacity-40 italic">29,90€</span>
              <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-[8px] font-black uppercase">50% OFF</span>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white tracking-tighter">14,99€</span>
              <div className="flex flex-col">
                <span className="text-xs font-black text-emerald-500 uppercase leading-none">{t('landing.promo.period')}</span>
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-1">C/ IVA</span>
              </div>
            </div>
            
            <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mt-3 mb-8">{t('landing.promo.sub')}</p>
            
            <button 
              onClick={onSubscribe}
              className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest shadow-[0_15px_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {t('landing.promo.cta')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden selection:bg-emerald-500/30 font-inter">
      <BannerOverlay />
      
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[100%] h-[50%] bg-emerald-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[100%] h-[50%] bg-purple-600/5 rounded-full blur-[120px]"></div>
      </div>

      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'py-4 bg-slate-950/90 backdrop-blur-xl border-b border-white/5' : 'py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 btn-primary rounded-lg flex items-center justify-center font-black text-white text-[10px] shadow-lg">DX</div>
            <span className="font-bold text-lg tracking-tighter text-white">Nexus<span className="text-emerald-400">Time</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onAbout} className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors mr-4">Sobre a Empresa</button>
            <button onClick={onLogin} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">{t('common.login')}</button>
            <button onClick={onSubscribe} className="px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 hover:bg-emerald-400">{t('common.activate')}</button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="pt-40 md:pt-56 pb-6 px-6">
           <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400">{t('landing.badge')}</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black tracking-tight text-white mb-6 leading-[0.9] uppercase italic">
              {t('landing.hero')} <br/>
              <span className="text-gradient">{t('landing.heroHighlight')}</span>
            </h1>
            
            <p className="text-sm md:text-xl text-slate-400 mb-12 max-w-xl mx-auto font-medium leading-relaxed">
              {t('landing.subhero')}
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-md mx-auto">
               <button onClick={onSubscribe} className="w-full px-8 py-5 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all shadow-xl active:scale-95">Começar Agora</button>
               <button onClick={onAbout} className="w-full px-8 py-5 bg-slate-900 border border-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                 <Info className="w-4 h-4" /> Ecossistema Nexus
               </button>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-slate-950/40 border-y border-white/5">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="glass p-10 rounded-[2.5rem] border-red-500/20 bg-red-500/[0.01]">
              <h2 className="text-xl font-bold text-white mb-6 uppercase flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500" /> {t('landing.painTitle')}
              </h2>
              <ul className="space-y-4">
                {Array.isArray(t('landing.pains')) && t('landing.pains').map((p: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-400 font-medium">
                    <span className="text-red-500 font-black">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass p-10 rounded-[2.5rem] border-emerald-500/20 bg-emerald-500/[0.03]">
              <h2 className="text-xl font-bold text-white mb-6 uppercase flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> {t('landing.solutionTitle')}
              </h2>
              <ul className="space-y-4">
                {Array.isArray(t('landing.solutions')) && t('landing.solutions').map((s: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-200 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="pt-12">
          <PromoBanner />
        </div>

        <section className="py-24 px-6 text-center">
          <div className="max-w-2xl mx-auto glass p-12 rounded-[3.5rem] border-white/10 shadow-2xl">
            <Mail className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white mb-4 uppercase italic">{t('landing.support.title')}</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-md mx-auto">
              {t('landing.support.desc')}
            </p>
            <a href="mailto:suporte@digitalnexus.com" className="text-2xl font-black text-emerald-400 underline decoration-emerald-500/30 underline-offset-8 hover:text-white transition-colors">
              suporte@digitalnexus.com
            </a>
          </div>
        </section>

        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 -z-10 animate-pulse"></div>
          <div className="max-w-3xl mx-auto space-y-10">
            <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.8]">
              {t('landing.final.title')} <br/><span className="text-emerald-400">{t('landing.final.highlight')}</span>
            </h2>
            <div className="max-w-sm mx-auto">
               <button onClick={onSubscribe} className="w-full px-12 py-7 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-[2rem] text-xl shadow-[0_0_60px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-3">
                <span>{t('landing.final.cta')}</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-16 px-6 border-t border-white/5 bg-slate-950 text-center">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-[10px]">DX</div>
              <span className="font-bold text-sm tracking-tighter opacity-50 uppercase">Digital Nexus Solutions</span>
            </div>
            <div className="flex gap-10 text-[10px] font-black text-slate-700 uppercase tracking-widest">
              <button onClick={onAbout} className="hover:text-emerald-500 transition-colors">Sobre a Nexus</button>
              <button onClick={onPrivacy} className="hover:text-emerald-500 transition-colors">{t('landing.footer.privacy')}</button>
              <button onClick={onTerms} className="hover:text-emerald-500 transition-colors">{t('landing.footer.terms')}</button>
            </div>
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.5em]">© 2026 {t('landing.footer.note')}</p>
          </div>
      </footer>

      <style>{`
        @keyframes modalScale {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
