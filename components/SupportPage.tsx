import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User, LayoutDashboard, DollarSign, FileText, LifeBuoy, X, ArrowLeft, Info, ExternalLink, ShieldCheck, Mail, Phone, Calendar, MessageSquare, Clock, Send, Headphones, CheckCircle, ReceiptText, Euro, ShieldAlert, Percent, Fingerprint } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile, WorkRecord } from '../types';

interface Props {
  user: UserProfile;
  f: (val: number) => string;
  t: (key: string) => any;
}

const SupportPage: React.FC<Props> = ({ user, f, t }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'active_chats' | 'resolved'>('active_chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<'info' | 'dashboard' | 'chat'>('chat');
  
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const replyingRef = useRef(false);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [chatMessages]);

  const fetchTickets = async () => {
    // Buscar ativos
    const { data: active } = await supabase
      .from('support_tickets')
      .select('*, profiles(*)')
      .eq('status', 'open')
      .order('updated_at', { ascending: false });
    setActiveChats(active || []);

    // Buscar resolvidos
    const { data: resolved } = await supabase
      .from('support_tickets')
      .select('*, profiles(*)')
      .eq('status', 'resolved')
      .order('updated_at', { ascending: false })
      .limit(50);
    setResolvedTickets(resolved || []);
  };

  useEffect(() => {
    fetchTickets();
    const ticketChannel = supabase.channel('nexus_support_global_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => { fetchTickets(); })
      .subscribe();
    return () => { supabase.removeChannel(ticketChannel); };
  }, []);

  useEffect(() => {
    if (activeView !== 'chat' || !selectedUser?.id) return;
    const fetchMsgs = async () => {
       const { data } = await supabase.from('chat_messages').select('*').eq('user_id', selectedUser.id).order('created_at', { ascending: true });
       setChatMessages(data || []);
    };
    fetchMsgs();
    const chatChannel = supabase.channel(`nexus_chat_agent_sync_${selectedUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${selectedUser.id}` }, payload => {
        setChatMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      }).subscribe();
    return () => { supabase.removeChannel(chatChannel); };
  }, [activeView, selectedUser?.id]);

  const getProfileFromTicket = (ticket: any): UserProfile | null => {
    if (!ticket.profiles) return null;
    return Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles;
  };

  const selectUser = async (target: UserProfile) => {
    if (!target?.id) return;
    setLoading(true);
    
    // Tentar atualizar ticket para este agente (removido agent_id por erro de esquema)
    const { data, error: updateError } = await supabase
      .from('support_tickets')
      .update({ 
        status: 'open',
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', target.id)
      .eq('status', 'open')
      .select();

    // Se não encontrou ticket para atualizar (via pesquisa), criar novo
    if (!updateError && (!data || data.length === 0)) {
      await supabase.from('support_tickets').insert({
        user_id: target.id,
        status: 'open',
        last_message: 'Atendimento iniciado pelo staff.',
        updated_at: new Date().toISOString()
      });
    }

    setSelectedUser(target);
    setActiveView('chat');
    setLoading(false);
  };

  const backToList = async () => {
    setSelectedUser(null);
    fetchTickets();
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUser?.id || replyingRef.current) return;
    
    const currentReply = replyText.trim();
    setReplyText('');
    replyingRef.current = true;
    
    try {
      await supabase.from('chat_messages').insert({ user_id: selectedUser.id, text: currentReply, sender_role: 'support' });
      await supabase.from('support_tickets').update({ 
        last_message: currentReply, 
        updated_at: new Date().toISOString() 
      }).eq('user_id', selectedUser.id).eq('status', 'open');
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      replyingRef.current = false;
    }
  };

  const resolveTicket = async (userId: string) => {
    if (!userId || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: 'resolved', 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .neq('status', 'resolved');

      if (error) throw error;

      setSelectedUser(null);
      await fetchTickets();
    } catch (err: any) {
      let displayMsg = "Erro na comunicação com o servidor.";
      
      if (err) {
        if (typeof err === 'string') {
          displayMsg = err;
        } else if (err.message) {
          displayMsg = err.message;
        } else if (err.error_description) {
          displayMsg = err.error_description;
        } else if (err.details) {
          displayMsg = err.details;
        } else {
          try {
            const stringified = JSON.stringify(err);
            displayMsg = (stringified === '{}' || stringified === 'undefined') ? "Erro técnico (dados não legíveis)" : stringified;
          } catch {
            displayMsg = "Falha crítica de resposta do servidor.";
          }
        }
      }

      console.error("Nexus Resolve Error Details:", displayMsg);
      alert(`Erro ao encerrar ticket: ${displayMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`).limit(20);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const getNexusId = (profile: any) => {
    try {
      const sub = typeof profile.subscription === 'string' ? JSON.parse(profile.subscription) : profile.subscription;
      return sub?.id || profile.id?.substring(0, 8);
    } catch { return profile.id?.substring(0, 8); }
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out] pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Staff Atendimento Hub</span>
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">PAINEL DE <span className="text-blue-400">SUPORTE</span></h2>
        </div>
        <div className="flex p-1 bg-slate-800/40 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
           <button onClick={() => setActiveTab('active_chats')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'active_chats' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Fila ({activeChats.length})</button>
           <button onClick={() => setActiveTab('resolved')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'resolved' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Resolvidos ({resolvedTickets.length})</button>
           <button onClick={() => setActiveTab('search')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'search' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Pesquisar</button>
        </div>
      </div>

      {selectedUser ? (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
           <div className="bg-slate-800/40 p-6 rounded-[2.5rem] border border-blue-500/20 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
              <div className="flex items-center gap-4">
                 <button onClick={backToList} className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:text-white transition-all text-slate-500 hover:bg-slate-900"><ArrowLeft className="w-4 h-4" /></button>
                 <div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Em Atendimento</p></div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mt-1">{selectedUser.name}</h3>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => resolveTicket(selectedUser.id!)} disabled={loading} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-500 transition-all shadow-lg disabled:opacity-50">
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} 
                   Marcar Resolvido
                 </button>
                 <div className="bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800 flex">
                    {[{ id: 'chat', label: 'Conversa', icon: MessageSquare }, { id: 'info', label: 'Ficha Nexus', icon: Info }].map(v => (
                        <button key={v.id} onClick={() => setActiveView(v.id as any)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeView === v.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                          <v.icon className="w-3.5 h-3.5" /> {v.label}
                        </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="bg-slate-800/20 border border-slate-800 rounded-[3rem] p-4 md:p-10 min-h-[550px] shadow-2xl relative overflow-hidden">
              {activeView === 'chat' && (
                <div className="flex flex-col h-[550px] bg-slate-950/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-inner">
                   <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                      {chatMessages.map(m => (
                        <div key={m.id} className={`flex ${m.sender_role === 'support' ? 'justify-end' : 'justify-start'} animate-[slideUp_0.2s_ease-out]`}>
                           <div className={`p-4 rounded-2xl max-w-[75%] shadow-md ${m.sender_role === 'support' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-900 text-slate-300 rounded-tl-none border border-white/5'}`}>
                              <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                              <p className={`text-[8px] font-black uppercase opacity-50 mt-2 ${m.sender_role === 'support' ? 'text-right' : 'text-left'}`}>{new Date(m.created_at).toLocaleTimeString()}</p>
                           </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                   </div>
                   <form onSubmit={handleSendReply} className="p-5 bg-slate-900 border-t border-white/5 flex gap-3 items-center">
                      <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Responder em direto..." />
                      <button type="submit" disabled={!replyText.trim() || replyingRef.current} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all disabled:opacity-20 shadow-xl group"><Send className="w-5 h-5" /></button>
                   </form>
                </div>
              )}
              {activeView === 'info' && (
                <div className="space-y-10 animate-[fadeIn_0.5s_ease-out]">
                   <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                      <div className="w-24 h-24 bg-slate-950 border-2 border-blue-500/20 rounded-3xl flex items-center justify-center"><User className="w-12 h-12 text-blue-400" /></div>
                      <div>
                         <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase">{selectedUser.name}</h4>
                         <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mt-1">Nexus Identity: <span className="text-white">#{getNexusId(selectedUser)}</span></p>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="space-y-6">
                         <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><Mail className="w-3 h-3" /> Contactos</h5>
                         <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-black text-slate-600 uppercase mb-1">E-mail</p>
                            <p className="text-sm font-bold text-white">{selectedUser.email}</p>
                         </div>
                      </div>
                      <div className="space-y-6">
                         <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><DollarSign className="w-3 h-3" /> Financeiro</h5>
                         <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Valor/Hora</p>
                            <p className="text-lg font-black text-green-400">{f(selectedUser.hourlyRate)}</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      ) : activeTab === 'active_chats' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
           {activeChats.length === 0 ? (
             <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4 opacity-30 border-2 border-dashed border-slate-800 rounded-[3rem]">
               <MessageSquare className="w-16 h-16 text-slate-600" />
               <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.4em]">Fila Vazia</p>
             </div>
           ) : activeChats.map(ticket => {
             const tp = getProfileFromTicket(ticket);
             if (!tp) return null;
             return (
               <button key={ticket.id} onClick={() => selectUser(tp)} className="bg-slate-800/20 border border-slate-800 p-8 rounded-[2.5rem] hover:border-blue-500/50 hover:bg-slate-800/40 transition-all text-left group shadow-lg">
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center font-black text-blue-400 text-2xl">{tp.name.charAt(0)}</div>
                     <div className="px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 text-[8px] font-black text-blue-400 uppercase">Aberto</div>
                  </div>
                  <h4 className="text-xl font-black text-white uppercase italic mb-2">{tp.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">"{ticket.last_message}"</p>
               </button>
             );
           })}
        </div>
      ) : activeTab === 'resolved' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
           {resolvedTickets.length === 0 ? (
             <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4 opacity-30 border-2 border-dashed border-slate-800 rounded-[3rem]">
               <CheckCircle className="w-16 h-16 text-slate-600" />
               <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.4em]">Sem Histórico</p>
             </div>
           ) : resolvedTickets.map(ticket => {
             const tp = getProfileFromTicket(ticket);
             if (!tp) return null;
             return (
               <div key={ticket.id} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] text-left group shadow-lg opacity-80">
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center font-black text-slate-500 text-2xl">{tp.name.charAt(0)}</div>
                     <div className="px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20 text-[8px] font-black text-green-400 uppercase">Resolvido</div>
                  </div>
                  <h4 className="text-xl font-black text-white uppercase italic mb-2">{tp.name}</h4>
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-4 flex items-center gap-2"><Clock className="w-3 h-3" /> {new Date(ticket.updated_at).toLocaleDateString()}</p>
                  <p className="text-[11px] text-slate-500 italic">"{ticket.last_message}"</p>
               </div>
             );
           })}
        </div>
      ) : (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
           <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="text" placeholder="Nome ou Email..." className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] pl-16 py-6 text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </form>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading && <div className="col-span-full py-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}
              {!loading && searchResults.map(res => (
                <button key={res.id} onClick={() => selectUser(res)} className="flex items-center justify-between p-6 bg-slate-900/40 border border-slate-800 rounded-3xl hover:bg-slate-800/60 transition-all">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-blue-400">{res.name.charAt(0)}</div>
                      <div className="text-left">
                         <p className="text-sm font-bold text-white">{res.name}</p>
                         <p className="text-[10px] text-slate-500 mt-2 uppercase font-black">{res.email}</p>
                      </div>
                   </div>
                   <ExternalLink className="w-5 h-5 text-slate-700" />
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;