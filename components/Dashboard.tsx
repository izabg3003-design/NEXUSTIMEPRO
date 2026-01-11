
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, isSameDay, startOfMonth, addYears, parseISO, differenceInDays } from 'date-fns';
import { pt, enUS, es, fr, de, it, ru, uk, zhCN, ja, hi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Save, Clock, AlertCircle, Coffee, TrendingUp, MapPin, Wallet, MessageSquare, Loader2, CheckCircle2, RefreshCw, Zap, ShieldAlert, Headphones, Activity, X, Megaphone } from 'lucide-react';
import { UserProfile, WorkRecord, AppBanner } from '../types';
import { supabase } from '../lib/supabase';

interface Props {
  user: UserProfile;
  records: Record<string, WorkRecord>;
  onAddRecord: (record: WorkRecord) => Promise<boolean>;
  t: (key: string) => any;
}

const Dashboard: React.FC<Props> = ({ user, records, onAddRecord, t }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Lógica do Banner Modelo 2 (Pós-login)
  const [showPostLoginBanner, setShowPostLoginBanner] = useState(false);
  const [bannerData, setBannerData] = useState<AppBanner | null>(null);

  const [entry, setEntry] = useState('09:00');
  const [exit, setExit] = useState('18:00');
  const [isAbsent, setIsAbsent] = useState(false);
  const [hasLunchBreak, setHasLunchBreak] = useState(true);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [advance, setAdvance] = useState(0);
  const [extraHours, setExtraHours] = useState({ h1: 0, h2: 0, h3: 0 });

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialScroll = useRef(true);

  const lang = user.settings?.language || 'pt-PT';
  const localesMap: Record<string, any> = { 'pt-PT': pt, 'pt-BR': pt, 'en': enUS, 'es-ES': es, 'fr': fr, 'de': de, 'it': it, 'ru': ru, 'uk': uk, 'zh': zhCN, 'ja': ja, 'hi': hi };
  const currentLocale = localesMap[lang] || pt;

  useEffect(() => {
    const fetchPostLoginBanner = async () => {
      try {
        const { data, error } = await supabase
          .from('app_banners')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        // Modelo 2: Pega o segundo banner da lista para ser independente do primeiro (se houver mais de um)
        // Caso só haja um, usa o mesmo, mas a lógica é independente.
        if (!error && data && data.length > 0) {
          const selected = data.length > 1 ? data[1] : data[0];
          setBannerData(selected);
          
          // Mostrar após 800ms de entrar no dashboard
          const timer = setTimeout(() => setShowPostLoginBanner(true), 800);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.warn("Nexus Post-Login Banner: Erro ao carregar.");
      }
    };

    fetchPostLoginBanner();
  }, []);

  const daysRemaining = useMemo(() => {
    try {
      const sub = typeof user.subscription === 'string' ? JSON.parse(user.subscription) : user.subscription;
      if (!sub?.startDate) return null;
      const expiry = addYears(parseISO(sub.startDate), 1);
      return differenceInDays(expiry, new Date());
    } catch { return null; }
  }, [user.subscription]);

  const days = useMemo(() => {
    return eachDayOfInterval({ 
      start: startOfMonth(currentDate), 
      end: endOfMonth(currentDate) 
    });
  }, [currentDate]);

  const dateKey = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  const hasExistingRecord = !!records[dateKey];

  const getNexusId = () => {
    try {
      const sub = user.subscription;
      if (!sub) return user.id?.substring(0, 8) || '---';
      const parsed = typeof sub === 'string' ? JSON.parse(sub) : sub;
      return parsed.id || user.id?.substring(0, 8) || '---';
    } catch (e) { return user.id?.substring(0, 8) || '---'; }
  };

  useEffect(() => {
    const record = records[dateKey];
    setEntry(record?.entry || user.defaultEntry || '09:00');
    setExit(record?.exit || user.defaultExit || '18:00');
    setIsAbsent(record?.isAbsent || false);
    setHasLunchBreak(record?.hasLunchBreak ?? true);
    setNotes(record?.notes || '');
    setLocation(record?.location || '');
    setAdvance(record?.advance || 0);
    setExtraHours(record?.extraHours || { h1: 0, h2: 0, h3: 0 });
    
    if (scrollRef.current) {
      const timer = setTimeout(() => {
        const activeEl = scrollRef.current?.querySelector('[data-active="true"]');
        if (activeEl && (isInitialScroll.current || isSameDay(selectedDate, new Date()))) {
          activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          isInitialScroll.current = false;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedDate, dateKey, user.defaultEntry, user.defaultExit, records]);

  const handleSync = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveSuccess(false);
    const success = await onAddRecord({ 
      date: dateKey, 
      entry, 
      exit, 
      isAbsent, 
      hasLunchBreak, 
      notes, 
      location, 
      advance, 
      extraHours 
    });
    
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
    setIsSaving(false);
  };

  const getDayStatusColor = (day: Date) => {
    const dKey = format(day, 'yyyy-MM-dd');
    const record = records[dKey];
    if (!record) return null;
    if (record.isAbsent) return 'red';
    return 'green';
  };

  const PostLoginBannerOverlay = () => {
    if (!showPostLoginBanner || !bannerData) return null;

    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/70 animate-[fadeIn_0.3s_ease-out]">
        <div className={`relative w-full max-w-4xl bg-slate-900 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)] border border-${bannerData.theme_color}-500/30 animate-[modalScale_0.4s_ease-out]`}>
          
          <button 
            onClick={() => setShowPostLoginBanner(false)}
            className="absolute top-6 right-6 z-50 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>

          {bannerData.image_url ? (
            <div className="relative aspect-[16/10] md:aspect-[16/9]">
              <img src={bannerData.image_url} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
            </div>
          ) : (
            <div className="p-12 md:p-20 text-center flex flex-col items-center justify-center min-h-[500px]">
              <div className={`w-24 h-24 rounded-3xl bg-${bannerData.theme_color}-500/10 border border-${bannerData.theme_color}-500/20 flex items-center justify-center mb-4`}>
                 <Megaphone className={`w-10 h-10 text-${bannerData.theme_color}-400`} />
              </div>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">Digital Nexus Intelligence</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <PostLoginBannerOverlay />
      
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/60 rounded-full border border-white/5 no-print">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado Sistema</span>
            </div>
            <div className="w-[1px] h-4 bg-slate-800"></div>
            <div className="flex items-center gap-2">
               <Activity className="w-3 h-3 text-purple-400" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronização Ativa</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.2em] font-mono">v16.0.4-PRO</p>
      </div>

      {daysRemaining !== null && daysRemaining <= 30 && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-4 md:p-6 rounded-[2.5rem] border border-amber-400/30 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex flex-col md:flex-row items-center justify-between gap-4 animate-soft">
          <div className="flex items-center gap-4 text-white">
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/30">
                <ShieldAlert className="w-6 h-6" />
             </div>
             <div>
                <h4 className="text-sm font-black uppercase tracking-widest leading-none">A sua licença expira em {daysRemaining} dias</h4>
                <p className="text-[10px] font-bold text-white/80 mt-1 uppercase tracking-widest opacity-80 italic">Digital Nexus Solutions • Professional Cloud</p>
             </div>
          </div>
          <button className="w-full md:w-auto px-8 py-3 bg-white text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all">
            Contactar Renovação
          </button>
        </div>
      )}

      <div className="flex justify-between items-center bg-slate-900/40 p-5 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-xl shadow-emerald-900/20">
             {user.name?.charAt(0)}
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-white tracking-tighter uppercase italic leading-none">
              {user.name.split(' ')[0]} 
            </h2>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1.5 leading-none">
              {format(new Date(), 'EEEE, dd MMM', { locale: currentLocale })}
            </p>
            <p className="text-[9px] text-emerald-400 font-mono opacity-60 mt-1 leading-none">
              #{getNexusId()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20">
          <TrendingUp className="w-3 h-3" />
          <span className="text-[8px] font-black uppercase tracking-widest">Live Nexus Status</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
             {format(currentDate, 'MMMM yyyy', { locale: currentLocale })}
           </h3>
           <div className="flex gap-2">
              <button onClick={() => { setCurrentDate(subMonths(currentDate, 1)); isInitialScroll.current = true; }} className="p-2 glass rounded-xl hover:bg-white/10 transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => { setCurrentDate(addMonths(currentDate, 1)); isInitialScroll.current = true; }} className="p-2 glass rounded-xl hover:bg-white/10 transition-all"><ChevronRight className="w-4 h-4" /></button>
           </div>
        </div>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar py-4 px-2 scroll-smooth">
          {days.map(day => {
            const active = isSameDay(day, selectedDate);
            const status = getDayStatusColor(day);
            let statusClasses = "bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/10";
            let dotColor = "bg-emerald-500";
            
            if (!active) {
              if (status === 'green') { statusClasses = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"; dotColor = "bg-emerald-500"; }
              else if (status === 'red') { statusClasses = "bg-red-500/10 border-red-500/30 text-red-400"; dotColor = "bg-red-500"; }
            } else { statusClasses = "btn-primary text-white border-white/20 shadow-lg scale-110 z-10"; }

            return (
              <button key={day.toISOString()} data-active={active} onClick={() => setSelectedDate(day)} className={`flex-shrink-0 w-16 h-24 rounded-[1.5rem] flex flex-col items-center justify-center transition-all duration-300 relative border ${statusClasses}`}>
                <span className={`text-[8px] font-black uppercase mb-1 tracking-widest ${active ? 'text-white' : ''}`}>{format(day, 'EEE', { locale: currentLocale })}</span>
                <span className={`text-xl font-black ${active ? 'text-white' : 'text-slate-300'}`}>{format(day, 'd')}</span>
                {status && !active && <div className={`absolute bottom-3 w-1 h-1 rounded-full ${dotColor}`}></div>}
                {isToday(day) && !active && <div className="absolute top-2 px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30"><span className="text-[6px] font-black text-purple-400 uppercase">{t('common.today')}</span></div>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-[2.5rem] p-6 space-y-6 border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <div className="flex items-center gap-1.5">
                <div className={`w-1 h-1 rounded-full animate-pulse ${hasExistingRecord ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                <p className={`text-[8px] font-black uppercase tracking-widest ${hasExistingRecord ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {t('dashboard.activeOp')}
                </p>
             </div>
             <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
               {isToday(selectedDate) ? t('dashboard.shift') : format(selectedDate, "dd MMM", { locale: currentLocale })}
             </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('dashboard.entry')}</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-500/40" />
                <input type="time" value={entry} onChange={e => setEntry(e.target.value)} disabled={isAbsent} className="w-full bg-slate-950/80 border border-white/5 rounded-2xl pl-9 pr-1 py-3 text-white font-black outline-none focus:ring-1 focus:ring-emerald-500/30 text-[10px] disabled:opacity-20" />
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('dashboard.exit')}</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-500/40" />
                <input type="time" value={exit} onChange={e => setExit(e.target.value)} disabled={isAbsent} className="w-full bg-slate-950/80 border border-white/5 rounded-2xl pl-9 pr-1 py-3 text-white font-black outline-none focus:ring-1 focus:ring-emerald-500/30 text-[10px] disabled:opacity-20" />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('dashboard.location')}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-purple-500/40" />
                <input type="text" placeholder={t('dashboard.locationPlaceholder')} value={location} onChange={e => setLocation(e.target.value)} disabled={isAbsent} className="w-full bg-slate-950/80 border border-white/5 rounded-2xl pl-9 pr-3 py-3 text-white font-black outline-none focus:ring-1 focus:ring-purple-500/30 text-[10px] disabled:opacity-20" />
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('dashboard.advance')}</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500/40" />
                <input type="number" step="0.01" value={advance} onChange={e => setAdvance(Number(e.target.value))} disabled={isAbsent} className="w-full bg-slate-950/80 border border-white/5 rounded-2xl pl-9 pr-3 py-3 text-white font-black outline-none focus:ring-1 focus:ring-amber-500/30 text-[10px] disabled:opacity-20" />
              </div>
           </div>
        </div>

        <div className="space-y-2">
           <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('dashboard.extra')}</label>
           <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                 <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-purple-400/40" />
                 <input type="number" step="0.5" value={extraHours.h1} onChange={e => setExtraHours({...extraHours, h1: Number(e.target.value)})} disabled={isAbsent} className="w-full bg-slate-950/80 border border-white/5 rounded-2xl pl-9 pr-2 py-3 text-white font-black outline-none focus:ring-1 focus:ring-purple-500/30 text-[9px] disabled:opacity-20" placeholder="1ª H" />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-600">1º</span>
              </div>
              <div className="relative">
                 <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-purple-400/40" />
                 <input type="number" step="0.5" value={extraHours.h2} onChange={e => setExtraHours({...extraHours, h2: Number(e.target.value)})} disabled={isAbsent} className="w-full bg-slate-950/80 border border-white/5 rounded-2xl pl-9 pr-2 py-3 text-white font-black outline-none focus:ring-1 focus:ring-purple-500/30 text-[9px] disabled:opacity-20" placeholder="2ª H" />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-600">2º</span>
              </div>
              <div className="relative">
                 <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-purple-400/40" />
                 <input type="number" step="0.5" value={extraHours.h3} onChange={e => setExtraHours({...extraHours, h3: Number(e.target.value)})} disabled={isAbsent} className="w-full bg-slate-950/80 border border-white/5 rounded-2xl pl-9 pr-2 py-3 text-white font-black outline-none focus:ring-1 focus:ring-purple-500/30 text-[9px] disabled:opacity-20" placeholder="3ª H" />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-600">3º</span>
              </div>
           </div>
        </div>

        <div className="space-y-2">
           <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('dashboard.notes')}</label>
           <div className="relative">
             <MessageSquare className="absolute left-3 top-3 w-3 h-3 text-blue-500/40" />
             <textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={isAbsent} rows={2} className="w-full bg-slate-950/80 border border-white/5 rounded-2xl pl-9 pr-3 py-3 text-white font-bold outline-none focus:ring-1 focus:ring-blue-500/30 text-[10px] disabled:opacity-20 resize-none" placeholder="..." />
           </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setIsAbsent(!isAbsent)} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border text-[9px] font-black uppercase transition-all shadow-md active:scale-95 ${isAbsent ? 'bg-red-500 text-white border-red-400' : 'bg-slate-900/60 border-white/5 text-slate-400'}`}>
            <AlertCircle className="w-3.5 h-3.5" /> {t('dashboard.absence')}
          </button>
          <button onClick={() => setHasLunchBreak(!hasLunchBreak)} disabled={isAbsent} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border text-[9px] font-black uppercase transition-all shadow-md active:scale-95 ${hasLunchBreak ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900/60 border-white/5 text-slate-400'}`}>
            <Coffee className="w-3.5 h-3.5" /> {t('dashboard.lunch')}
          </button>
        </div>

        <button 
          onClick={handleSync}
          disabled={isSaving}
          className={`w-full py-5 ${saveSuccess ? 'bg-green-500' : hasExistingRecord ? 'bg-amber-600' : 'btn-primary'} text-white font-black rounded-[2rem] flex items-center justify-center gap-3 shadow-xl hover:brightness-110 active:scale-95 transition-all text-xs uppercase tracking-widest`}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : hasExistingRecord ? <RefreshCw className="w-4 h-4" /> : <Save className="w-4 h-4" />} 
          {isSaving ? t('common.syncing') : saveSuccess ? t('settings.saved') : hasExistingRecord ? t('dashboard.update') : t('dashboard.sync')}
        </button>
      </div>

      <style>{`
        @keyframes modalScale {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
