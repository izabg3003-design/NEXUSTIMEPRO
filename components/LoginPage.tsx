
import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, ArrowLeft, ShieldAlert, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onLogin: (email: string) => void;
  onBack: () => void;
  t: (key: string) => any;
  externalError?: { title: string, text: string } | null;
}

const LoginPage: React.FC<Props> = ({ onLogin, onBack, t, externalError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<{ title: string, text: string } | null>(null);

  useEffect(() => {
    if (externalError) {
      setErrorMsg(externalError);
    }
  }, [externalError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setErrorMsg({
            title: t('login.blockedTitle'),
            text: t('login.blockedMsg')
          });
          return;
        } else if (error.message.includes('Invalid login credentials')) {
          setErrorMsg({
            title: t('login.invalidTitle'),
            text: t('login.invalidMsg')
          });
          return;
        }
        throw error;
      }

      onLogin(email);
    } catch (error: any) {
      setErrorMsg({
        title: t('login.systemError'),
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>

      <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-2xl border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden">
        
        {/* Top Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-all group bg-slate-800/30 px-4 py-2 rounded-xl border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('common.back')}</span>
          </button>
          
          <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em]">{t('login.secureAccess')}</span>
          </div>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-4xl font-black italic text-white tracking-tighter">NEXUS<span className="text-purple-400">TIME</span></h2>
          <p className="text-slate-500 mt-2 text-[10px] font-black uppercase tracking-[0.3em]">{t('login.platformNote')}</p>
        </div>

        {errorMsg && (
          <div className={`mb-8 p-5 rounded-[1.5rem] space-y-1 animate-[shake_0.5s_ease-in-out] border ${errorMsg.title.includes('BLOQUEADO') || errorMsg.title.includes('SUSPENSO') || errorMsg.title.includes('BLOCKED') ? 'bg-orange-500/10 border-orange-500/30' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className={`flex items-center gap-2 mb-1 ${errorMsg.title.includes('BLOQUEADO') || errorMsg.title.includes('SUSPENSO') || errorMsg.title.includes('BLOCKED') ? 'text-orange-500' : 'text-red-500'}`}>
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest">{errorMsg.title}</p>
            </div>
            <p className={`text-[11px] font-bold leading-relaxed ${errorMsg.title.includes('BLOQUEADO') || errorMsg.title.includes('SUSPENSO') || errorMsg.title.includes('BLOCKED') ? 'text-orange-400/80' : 'text-red-400/80'}`}>{errorMsg.text}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('login.idNexus')}</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
              <input 
                type="email" 
                required
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-14 pr-4 py-5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white font-medium"
                placeholder="nexus@digital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('login.securityKey')}</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
              <input 
                type="password" 
                required
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-14 pr-4 py-5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-purple-900/20 flex items-center justify-center space-x-3 group active:scale-[0.98] disabled:opacity-50 mt-8"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <span className="uppercase tracking-[0.2em] text-sm">{t('login.validateAccess')}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
