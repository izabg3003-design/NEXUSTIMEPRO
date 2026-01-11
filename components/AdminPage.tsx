
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShieldCheck, Search, Loader2, RefreshCw, UserPlus, X, Trash2, ShieldAlert, Phone, Hash, User, ShoppingCart, Mail, Settings2, Save, Euro, CheckCircle, Fingerprint, BriefcaseBusiness, LifeBuoy, Eye, Clock, Lock, Tag, UserPlus2, Percent, CalendarDays, Activity, Settings, Megaphone, Plus, Power, Image as ImageIcon, Upload, ExternalLink, Database, Copy, Award, KeySquare, BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile, AppBanner } from '../types';
import { differenceInDays, parseISO, addYears } from 'date-fns';
import AdminPartnerReports from './AdminPartnerReports';
import AdminGlobalAnalytics from './AdminGlobalAnalytics';
import AdminPlatformLedger from './AdminPlatformLedger';
import SettingsPage from './SettingsPage';

interface Props {
  currentUser?: UserProfile;
  f: (val: number) => string;
  onLogout: () => void;
  onViewVendor?: (id: string) => void;
  onViewVendorSales?: (vendor: any) => void;
  t: (key: string) => any;
  onUpdateProfile: (user: UserProfile) => Promise<boolean>;
}

const generateNexusId = () => {
  const year = new Date().getFullYear();
  const hex = Math.random().toString(16).substr(2, 4).toUpperCase();
  const serial = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `DX-${year}-${hex}-${serial}-NX`;
};

const generateVendorCode = () => {
  return 'NX-' + Math.random().toString(36).substr(2, 5).toUpperCase();
};

const AdminPage: React.FC<Props> = ({ currentUser, f, onLogout, onViewVendor, onViewVendorSales, t, onUpdateProfile }) => {
  const isMaster = currentUser?.email === 'master@digitalnexus.com';
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'vendors' | 'reports' | 'analytics' | 'support' | 'profile' | 'banners' | 'ledger'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [supportStaff, setSupportStaff] = useState<UserProfile[]>([]);
  const [banners, setBanners] = useState<AppBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: 'user' | 'vendor' | 'support' | 'banner' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vendorCode: ''
  });

  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    commission: 1.50
  });

  const [editingCommissionVendor, setEditingCommissionVendor] = useState<any | null>(null);
  const [newCommRate, setNewCommRate] = useState<number>(0);
  const [newDiscRate, setNewDiscRate] = useState<number>(5);
  const [isSavingComm, setIsSavingComm] = useState(false);
  
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const [newBanner, setNewBanner] = useState<Partial<AppBanner>>({
    title: '', highlight: '', subtitle: '', cta_text: 'Ver Oferta', theme_color: 'emerald', is_active: true, image_url: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'users') {
        const { data } = await supabase.from('profiles').select('*').neq('role', 'vendor').neq('role', 'support').neq('email', 'master@digitalnexus.com');
        setUsers(data || []);
      } else if (activeSubTab === 'vendors') {
        const { data: vData } = await supabase.from('vendors').select('*');
        const { data: pData } = await supabase.from('profiles').select('*').in('id', vData?.map(v => v.id) || []);
        setVendors(vData?.map(v => ({ ...v, profile: pData?.find(p => p.id === v.id) })) || []);
      } else if (activeSubTab === 'support') {
        const { data } = await supabase.from('profiles').select('*').eq('role', 'support');
        setSupportStaff(data || []);
      } else if (activeSubTab === 'banners') {
        const { data, error } = await supabase.from('app_banners').select('*').order('created_at', { ascending: false });
        if (error && error.code === '42P01') {
          setBanners([]);
          setShowSqlHelp(true);
        } else {
          setBanners(data || []);
        }
      }
    } catch (e) { 
      console.error("Nexus Admin Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    if (!['profile', 'reports', 'analytics', 'ledger'].includes(activeSubTab)) fetchData(); 
  }, [activeSubTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    if (newUser.password !== newUser.confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    
    setIsCreating(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: { 
          data: { 
            full_name: newUser.name, 
            phone: newUser.phone
          } 
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          vendor_code: newUser.vendorCode.trim().toUpperCase() || null,
          role: 'user',
          hourlyRate: 10,
          isFreelancer: false,
          subscription: {
            id: generateNexusId(),
            startDate: new Date().toISOString(), 
            isActive: true,
            status: 'ACTIVE_ADMIN_CREATED'
          }
        });

        if (profileError) throw profileError;
        
        setShowAddUser(false);
        setNewUser({ name: '', email: '', phone: '', password: '', confirmPassword: '', vendorCode: '' });
        fetchData();
      }
    } catch (e: any) {
      alert(`Erro ao criar membro: ${e.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    if (newVendor.password !== newVendor.confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    
    setIsCreating(true);
    try {
      const generatedCode = generateVendorCode();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newVendor.email,
        password: newVendor.password,
        options: { 
          data: { 
            full_name: newVendor.name, 
            phone: newVendor.phone
          } 
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 1. Perfil
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          name: newVendor.name,
          email: newVendor.email,
          phone: newVendor.phone,
          vendor_code: generatedCode,
          role: 'vendor',
          hourlyRate: 10,
          isFreelancer: false,
          subscription: {
            id: generateNexusId(),
            startDate: new Date().toISOString(), 
            isActive: true,
            status: 'VENDOR_ACTIVE'
          }
        });

        if (profileError) throw profileError;

        // 2. Tabela Vendors
        const { error: vendorTableError } = await supabase.from('vendors').insert({
          id: authData.user.id,
          name: newVendor.name,
          email: newVendor.email,
          code: generatedCode,
          commission_rate: newVendor.commission,
          total_sales: 0
        });

        if (vendorTableError) throw vendorTableError;
        
        setShowAddVendor(false);
        setNewVendor({ name: '', email: '', phone: '', password: '', confirmPassword: '', commission: 1.50 });
        fetchData();
      }
    } catch (e: any) {
      alert(`Erro ao criar parceiro: ${e.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBanner(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const bannerData = {
        title: newBanner.title || 'Sem Título',
        highlight: newBanner.highlight || '',
        subtitle: newBanner.subtitle || '',
        cta_text: newBanner.cta_text || 'Saber Mais',
        cta_link: newBanner.cta_link || '',
        theme_color: newBanner.theme_color || 'emerald',
        is_active: true,
        image_url: newBanner.image_url || null
      };
      
      const { error } = await supabase.from('app_banners').insert([bannerData]);
      
      if (error) {
        if (error.code === '42P01') {
          setShowSqlHelp(true);
          throw new Error("A tabela 'app_banners' não existe. Clique no botão de ajuda SQL no topo.");
        }
        throw error;
      }
      
      setShowAddBanner(false);
      setNewBanner({ title: '', highlight: '', subtitle: '', cta_text: 'Ver Oferta', theme_color: 'emerald', is_active: true, image_url: '' });
      fetchData();
    } catch (e: any) { 
      alert(`Erro Nexus: ${e.message}`);
    } finally { 
      setIsCreating(false); 
    }
  };

  const handleToggleBanner = async (banner: AppBanner) => {
    setUpdatingId(banner.id);
    try {
      await supabase.from('app_banners').update({ is_active: !banner.is_active }).eq('id', banner.id);
      fetchData();
    } catch (e) { console.error(e); } finally { setUpdatingId(null); }
  };

  const handleToggleUserStatus = async (inputUser: any) => {
    setUpdatingId(inputUser.id);
    try {
      // Extrair a subscrição quer do utilizador (User) quer do parceiro (Vendor -> profile)
      const rawSub = inputUser.subscription || inputUser.profile?.subscription;
      let sub: any = {};
      
      if (typeof rawSub === 'string') {
        try { sub = JSON.parse(rawSub); } catch(e) { sub = {}; }
      } else {
        sub = rawSub || {};
      }
      
      // Inverter o estado: Se isActive não for false, suspendemos. Se for false, ativamos.
      const currentStatus = sub.isActive !== false;
      const nextStatus = !currentStatus;
      
      const updatedSub = { ...sub, isActive: nextStatus };
      
      const { error } = await supabase.from('profiles').update({ 
        subscription: updatedSub 
      }).eq('id', inputUser.id);
      
      if (error) throw error;
      await fetchData();
    } catch (e: any) {
      alert(`Erro ao mudar status: ${e.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateVendorCommission = async () => {
    if (!editingCommissionVendor || isSavingComm) return;
    setIsSavingComm(true);
    
    const vendorId = editingCommissionVendor.id;
    
    try {
      // 1. Atualizar tabela Vendors (apenas a coluna que garantidamente existe)
      const { error: vError } = await supabase.from('vendors').update({ 
        commission_rate: newCommRate
      }).eq('id', vendorId);
      
      if (vError) throw vError;

      // 2. Buscar perfil mais recente para sincronizar metadados da subscrição
      const { data: profileData } = await supabase.from('profiles').select('subscription').eq('id', vendorId).maybeSingle();
      
      if (profileData) {
        let sub: any = {};
        if (typeof profileData.subscription === 'string') {
          try { sub = JSON.parse(profileData.subscription); } catch(e) { sub = {}; }
        } else {
          sub = profileData.subscription || {};
        }
        
        // Salvamos ambos os valores no JSONB da subscrição (que é flexível)
        const updatedSub = { 
          ...sub, 
          custom_commission: newCommRate,
          custom_discount: newDiscRate 
        };

        const { error: pError } = await supabase.from('profiles').update({ 
          subscription: updatedSub 
        }).eq('id', vendorId);

        if (pError) throw pError;
      }
      
      setEditingCommissionVendor(null);
      await fetchData();
    } catch (e: any) {
      alert(`Erro Nexus: ${e.message || 'Falha na comunicação com a base de dados.'}`);
    } finally {
      setIsSavingComm(false);
    }
  };

  const executeDeletion = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'banner') {
        await supabase.from('app_banners').delete().eq('id', itemToDelete.id);
      } else {
        if (itemToDelete.type === 'vendor') await supabase.from('vendors').delete().eq('id', itemToDelete.id);
        await supabase.from('profiles').delete().eq('id', itemToDelete.id);
      }
      fetchData();
      setItemToDelete(null);
    } catch (e: any) { alert(e.message); } finally { setIsDeleting(false); }
  };

  const getDaysRemaining = (profile: any) => {
    try {
      const sub = typeof profile.subscription === 'string' ? JSON.parse(profile.subscription) : profile.subscription;
      const startDate = sub?.startDate ? parseISO(sub.startDate) : (profile.created_at ? parseISO(profile.created_at) : new Date());
      const expiryDate = addYears(startDate, 1);
      const remaining = differenceInDays(expiryDate, new Date());
      return remaining > 0 ? remaining : 0;
    } catch { return 0; }
  };

  const getNexusIdForUser = (user: any) => {
    try {
      const sub = typeof user.subscription === 'string' ? JSON.parse(user.subscription) : (user.subscription || {});
      return sub.id || user.id?.substring(0, 8).toUpperCase() || '---';
    } catch (e) { return user.id?.substring(0, 8).toUpperCase() || '---'; }
  };

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (activeSubTab === 'users') return users.filter(u => u.name.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term));
    if (activeSubTab === 'vendors') return vendors.filter(v => v.name.toLowerCase().includes(term) || v.code.toLowerCase().includes(term));
    if (activeSubTab === 'support') return supportStaff.filter(s => s.name.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term));
    if (activeSubTab === 'banners') return banners.filter(b => b.title.toLowerCase().includes(term) || b.highlight.toLowerCase().includes(term));
    return [];
  }, [searchTerm, users, vendors, supportStaff, banners, activeSubTab]);

  const SQL_SNIPPET = `-- COPIE E COLE NO SQL EDITOR DO SUPABASE
CREATE TABLE IF NOT EXISTS app_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  highlight TEXT,
  subtitle TEXT,
  cta_text TEXT DEFAULT 'Ver Mais',
  cta_link TEXT,
  image_url TEXT,
  theme_color TEXT DEFAULT 'emerald',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE app_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública de banners" ON app_banners FOR SELECT USING (true);
CREATE POLICY "Gestão total para admins" ON app_banners FOR ALL USING (true);`;

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out] pb-64">
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${isMaster ? 'text-amber-500' : 'text-purple-400'}`} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{isMaster ? 'Nexus Master Core Management' : 'Digital Nexus Command OS'}</span>
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">NEXUS <span className={isMaster ? 'text-amber-500' : 'text-purple-400'}>{isMaster ? 'MASTER' : 'COMMAND'}</span></h2>
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-800/40 rounded-2xl border border-slate-700/50 flex-wrap">
          {isMaster && <button onClick={() => setActiveSubTab('analytics')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'analytics' ? 'bg-amber-600 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-3xl'}`}>Estatísticas</button>}
          {isMaster && <button onClick={() => setActiveSubTab('ledger')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'ledger' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Plataforma</button>}
          <button onClick={() => setActiveSubTab('users')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'users' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Membros</button>
          <button onClick={() => setActiveSubTab('banners')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'banners' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Banners</button>
          <button onClick={() => setActiveSubTab('vendors')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'vendors' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Parceiros</button>
          <button onClick={() => setActiveSubTab('support')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'support' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Suporte</button>
          <button onClick={() => setActiveSubTab('reports')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'reports' ? 'bg-amber-600 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}>Comissões</button>
          <button onClick={() => setActiveSubTab('profile')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'profile' ? 'bg-slate-200 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}><Settings className="w-3.5 h-3.5 inline mr-1" /> Perfil</button>
        </div>
      </div>

      {activeSubTab === 'analytics' ? <AdminGlobalAnalytics f={f} /> : 
       activeSubTab === 'ledger' ? <AdminPlatformLedger f={f} /> :
       activeSubTab === 'reports' ? <AdminPartnerReports f={f} /> : 
       activeSubTab === 'profile' ? <SettingsPage user={currentUser!} setUser={onUpdateProfile} t={t} /> : (
        <div className="bg-slate-800/20 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl relative">
          <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row gap-6 justify-between items-center bg-slate-900/40">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Pesquisar..." className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white text-sm outline-none focus:ring-2 focus:ring-purple-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="flex gap-3">
              {activeSubTab === 'banners' && (
                <button onClick={() => setShowSqlHelp(true)} className="px-6 py-4 bg-slate-900 text-amber-500 border border-amber-500/30 font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-amber-500/10"><Database className="w-4 h-4" /> DB Setup</button>
              )}
              {activeSubTab === 'banners' ? (
                <button onClick={() => setShowAddBanner(true)} className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"><Plus className="w-4 h-4" /> Novo Banner</button>
              ) : activeSubTab === 'users' ? (
                <button onClick={() => setShowAddUser(true)} className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"><UserPlus className="w-4 h-4" /> Novo Membro</button>
              ) : activeSubTab === 'vendors' ? (
                <button onClick={() => setShowAddVendor(true)} className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"><Plus className="w-4 h-4" /> Novo Parceiro</button>
              ) : (
                <button onClick={fetchData} className="p-4 bg-slate-900 text-slate-500 hover:text-white rounded-xl border border-white/5 transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/30 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-800">
                  <th className="px-10 py-6">{activeSubTab === 'banners' ? 'Mídia / Título' : 'Identidade'}</th>
                  <th className="px-6 py-6 text-center">{activeSubTab === 'banners' ? 'Cor' : activeSubTab === 'users' ? 'Nexus ID' : 'Canal'}</th>
                  <th className="px-6 py-6 text-center">Status</th>
                  {activeSubTab !== 'banners' && <th className="px-6 py-6 text-center">Expiração</th>}
                  <th className="px-10 py-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-10 h-10 text-white animate-spin mx-auto" /></td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-600 font-bold uppercase tracking-widest">Nenhum registo encontrado.</td></tr>
                ) : activeSubTab === 'banners' ? (
                  (filteredData as AppBanner[]).map((b) => (
                    <tr key={b.id} className="transition-all hover:bg-slate-800/40">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-10 rounded-lg bg-${b.theme_color}-500/20 border border-${b.theme_color}-500/30 flex items-center justify-center overflow-hidden`}>
                             {b.image_url ? <img src={b.image_url} className="w-full h-full object-cover" alt="" /> : <Megaphone className={`w-5 h-5 text-${b.theme_color}-400`} />}
                          </div>
                          <div><p className="font-bold text-white text-sm">{b.title}</p><p className="text-[9px] text-slate-500 uppercase font-black">{b.highlight}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className={`w-4 h-4 rounded-full mx-auto bg-${b.theme_color}-500 shadow-lg shadow-${b.theme_color}-500/20`}></div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${ b.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{b.is_active ? 'EXIBINDO' : 'PAUSADO'}</div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleToggleBanner(b)} disabled={updatingId === b.id} className={`p-2.5 rounded-xl transition-all ${b.is_active ? 'bg-slate-950 text-slate-500' : 'bg-green-600/20 text-green-500'}`}>
                            <Power className={`w-4 h-4 ${updatingId === b.id ? 'animate-spin' : ''}`} />
                          </button>
                          <button onClick={() => setItemToDelete({ id: b.id, name: b.title, type: 'banner' })} className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : activeSubTab === 'vendors' ? (
                   (filteredData as any[]).map((v: any) => {
                     const isSuspended = v.profile?.subscription ? (typeof v.profile.subscription === 'string' ? JSON.parse(v.profile.subscription).isActive === false : v.profile.subscription.isActive === false) : false;
                     const remaining = getDaysRemaining(v.profile || v);
                     return (
                      <tr key={v.id} className="transition-all hover:bg-slate-800/40 group print:text-black">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-green-600/20 border border-green-600/30 flex items-center justify-center font-black text-green-400 text-lg shadow-xl">{v.name?.charAt(0)}</div>
                            <div>
                               <p className="font-bold text-white text-sm print:text-black">{v.name}</p>
                               <div className="flex items-center gap-2 bg-slate-950 px-2 py-0.5 rounded border border-white/5 mt-1 w-fit">
                                  <Tag className="w-2.5 h-2.5 text-slate-500" />
                                  <p className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest">{v.code}</p>
                               </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                           <p className="text-white text-[11px] font-medium">{v.email}</p>
                           <p className="text-[9px] text-green-500 font-black uppercase mt-1">Comm: {f(v.commission_rate)}</p>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${ !isSuspended ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{!isSuspended ? 'ATIVO' : 'SUSPENSO'}</div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="space-y-1">
                            <span className={`text-[11px] font-black ${remaining < 30 ? 'text-rose-500' : 'text-slate-300'}`}>{remaining} dias</span>
                            <div className="w-16 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${(remaining / 365) * 100}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button title="Ver Página" onClick={() => onViewVendor?.(v.id)} className="p-2.5 bg-slate-950 text-slate-500 border border-white/5 rounded-xl hover:text-white transition-all"><Award className="w-4 h-4" /></button>
                            <button title="Ver Gaveta de Vendas" onClick={() => onViewVendorSales?.(v)} className="p-2.5 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><ShoppingCart className="w-4 h-4" /></button>
                            <button title="Configurar Comissões" onClick={() => { 
                                setEditingCommissionVendor(v); 
                                setNewCommRate(v.commission_rate); 
                                const sub = typeof v.profile?.subscription === 'string' ? JSON.parse(v.profile.subscription) : v.profile?.subscription;
                                setNewDiscRate(sub?.custom_discount ?? 5); 
                            }} className="p-2.5 bg-amber-600/10 text-amber-500 border border-amber-600/20 rounded-xl hover:bg-amber-600 hover:text-slate-950 transition-all"><Settings2 className="w-4 h-4" /></button>
                            <button title={!isSuspended ? "Desativar" : "Ativar"} onClick={() => handleToggleUserStatus(v)} disabled={updatingId === v.id} className={`p-2.5 rounded-xl transition-all ${!isSuspended ? 'bg-slate-950 text-slate-500' : 'bg-green-600/20 text-green-500'}`}>
                              <Power className="w-4 h-4" />
                            </button>
                            <button onClick={() => setItemToDelete({ id: v.id, name: v.name, type: 'vendor' })} className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                     );
                   })
                ) : (
                  (filteredData as UserProfile[]).map((u: any) => {
                    const remaining = getDaysRemaining(u);
                    const isSuspended = u.subscription ? (typeof u.subscription === 'string' ? JSON.parse(u.subscription).isActive === false : u.subscription.isActive === false) : false;
                    return (
                      <tr key={u.id} className="transition-all hover:bg-slate-800/40">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-purple-400 text-xs">{u.name?.charAt(0)}</div>
                            <div>
                               <p className="font-bold text-white text-sm">{u.name}</p>
                               <p className="text-[9px] text-slate-500 uppercase font-black">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className="text-[10px] font-mono font-black text-purple-400 tracking-wider bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                            {getNexusIdForUser(u)}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-center">
                           <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${ !isSuspended ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{!isSuspended ? 'ATIVO' : 'SUSPENSO'}</div>
                        </td>
                        <td className="px-6 py-6 text-center">
                           <div className="space-y-1">
                             <span className={`text-[11px] font-black ${remaining < 30 ? 'text-rose-500' : 'text-slate-300'}`}>{remaining} dias</span>
                             <div className="w-16 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
                               <div className="h-full bg-purple-500" style={{ width: `${(remaining / 365) * 100}%` }}></div>
                             </div>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button title={!isSuspended ? "Desativar" : "Ativar"} onClick={() => handleToggleUserStatus(u)} disabled={updatingId === u.id} className={`p-2.5 rounded-xl transition-all ${!isSuspended ? 'bg-slate-950 text-slate-500' : 'bg-green-600/20 text-green-500'}`}>
                              <Power className={`w-4 h-4 ${updatingId === u.id ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={() => setItemToDelete({ id: u.id, name: u.name, type: activeSubTab === 'support' ? 'support' : 'user' })} className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NOVO MEMBRO (STYLE CHECKOUT) */}
      {showAddUser && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/90">
          <form onSubmit={handleCreateUser} className="bg-slate-900 border border-purple-500/30 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-[modalScale_0.3s_ease-out]">
            <div className="p-8 bg-purple-600/10 border-b border-purple-500/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <UserPlus2 className="w-6 h-6 text-purple-400" />
                 <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Registrar <span className="text-purple-400">Novo Membro</span></h3>
              </div>
              <button type="button" onClick={() => setShowAddUser(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-10 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-purple-500" placeholder="Nome do Membro" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email de Acesso</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-purple-500" placeholder="email@nexus.com" />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Telemóvel (Opcional)</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input type="tel" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-purple-500" placeholder="+351..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Código do Parceiro</label>
                    <div className="relative">
                      <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input type="text" value={newUser.vendorCode} onChange={e => setNewUser({...newUser, vendorCode: e.target.value.toUpperCase()})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-purple-500" placeholder="EX: NX-12345" />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Definir Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-purple-500" placeholder="••••••••" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Confirmar Senha</label>
                    <div className="relative">
                      <KeySquare className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input required type="password" value={newUser.confirmPassword} onChange={e => setNewUser({...newUser, confirmPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-purple-500" placeholder="••••••••" />
                    </div>
                  </div>
               </div>

               <div className="pt-4 flex flex-col gap-4">
                  <button type="submit" disabled={isCreating} className="w-full py-6 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />} ATIVAR ACESSO IMEDIATO
                  </button>
                  <p className="text-[9px] text-slate-600 font-black uppercase text-center tracking-widest flex items-center justify-center gap-2">
                    <Fingerprint className="w-3 h-3" /> ID Nexus gerado automaticamente em sincronia cloud
                  </p>
               </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: NOVO PARCEIRO */}
      {showAddVendor && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/90">
          <form onSubmit={handleCreateVendor} className="bg-slate-900 border border-green-500/30 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-[modalScale_0.3s_ease-out]">
            <div className="p-8 bg-green-600/10 border-b border-green-500/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <BriefcaseBusiness className="w-6 h-6 text-green-400" />
                 <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Registrar <span className="text-green-400">Novo Parceiro</span></h3>
              </div>
              <button type="button" onClick={() => setShowAddVendor(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-10 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nome do Parceiro</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input required type="text" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-green-500" placeholder="Nome da Empresa/Pessoa" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email Comercial</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input required type="email" value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-green-500" placeholder="comercial@parceiro.com" />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Telemóvel</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input type="tel" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-green-500" placeholder="+351..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Comissão (€ por venda)</label>
                    <div className="relative">
                      <Euro className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input type="number" step="0.01" value={newVendor.commission} onChange={e => setNewVendor({...newVendor, commission: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-green-500" />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Definir Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input required type="password" value={newVendor.password} onChange={e => setNewVendor({...newVendor, password: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-green-500" placeholder="••••••••" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Confirmar Senha</label>
                    <div className="relative">
                      <KeySquare className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input required type="password" value={newVendor.confirmPassword} onChange={e => setNewVendor({...newVendor, confirmPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-green-500" placeholder="••••••••" />
                    </div>
                  </div>
               </div>

               <div className="pt-4 flex flex-col gap-4">
                  <button type="submit" disabled={isCreating} className="w-full py-6 bg-green-600 hover:bg-green-500 text-slate-950 font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />} ATIVAR CANAL DE PARCEIRO
                  </button>
                  <p className="text-[9px] text-slate-600 font-black uppercase text-center tracking-widest flex items-center justify-center gap-2">
                    <Tag className="w-3 h-3" /> Código NX-XXXXX gerado automaticamente para o novo parceiro
                  </p>
               </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CONFIGURAR COMISSÃO E DESCONTO */}
      {editingCommissionVendor && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/90">
           <div className="bg-slate-900 border border-amber-500/40 w-full max-w-md rounded-[3rem] p-10 space-y-8 animate-[modalScale_0.3s_ease-out]">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Settings2 className="w-6 h-6 text-amber-500" />
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Gestão de <span className="text-amber-500">Taxas</span></h3>
                 </div>
                 <button onClick={() => setEditingCommissionVendor(null)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center font-black text-amber-500">{editingCommissionVendor.name?.charAt(0)}</div>
                    <div><p className="text-xs font-black text-white uppercase">{editingCommissionVendor.name}</p><p className="text-[9px] text-slate-500 font-mono">{editingCommissionVendor.code}</p></div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Valor da Comissão (€)</label>
                    <div className="relative">
                       <Euro className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/40" />
                       <input 
                         type="number" 
                         step="0.01" 
                         value={newCommRate} 
                         onChange={e => setNewCommRate(Number(e.target.value))} 
                         className="w-full bg-slate-950 border border-amber-500/20 rounded-2xl pl-14 pr-6 py-5 text-white font-black text-lg outline-none focus:ring-2 focus:ring-amber-500" 
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Desconto Online (%)</label>
                    <div className="relative">
                       <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/40" />
                       <input 
                         type="number" 
                         step="0.1" 
                         value={newDiscRate} 
                         onChange={e => setNewDiscRate(Number(e.target.value))} 
                         className="w-full bg-slate-950 border border-amber-500/20 rounded-2xl pl-14 pr-6 py-5 text-white font-black text-lg outline-none focus:ring-2 focus:ring-amber-500" 
                       />
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setEditingCommissionVendor(null)} className="flex-1 py-4 bg-slate-800 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Cancelar</button>
                 <button type="button" onClick={handleUpdateVendorCommission} disabled={isSavingComm} className="flex-1 py-4 bg-amber-600 text-slate-950 font-black rounded-2xl uppercase text-[10px] shadow-xl flex items-center justify-center gap-2 hover:bg-amber-500 transition-all">
                    {isSavingComm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} APLICAR TAXAS
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: SQL HELP */}
      {showSqlHelp && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/90">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-2xl rounded-[3rem] p-10 space-y-6 animate-[modalScale_0.3s_ease-out] shadow-2xl shadow-amber-500/10">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-amber-500" />
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Setup de Base de Dados</h3>
               </div>
               <button onClick={() => setShowSqlHelp(false)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              A tabela de banners não foi encontrada no seu Supabase. Copie o código abaixo, vá para o seu painel Supabase, clique em **SQL Editor** e execute para criar a infraestrutura necessária.
            </p>
            <div className="relative group">
              <pre className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-[10px] text-amber-500 font-mono overflow-x-auto max-h-[300px]">
                {SQL_SNIPPET}
              </pre>
              <button 
                onClick={() => { navigator.clipboard.writeText(SQL_SNIPPET); alert("Código SQL copiado!"); }}
                className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-amber-600 hover:text-white transition-all"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => { setShowSqlHelp(false); fetchData(); }} className="w-full py-5 bg-amber-600 text-slate-950 font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-xl hover:bg-amber-500 transition-all">
              JÁ EXECUTEI O COMANDO NO SUPABASE
            </button>
          </div>
        </div>
      )}

      {/* MODAL: NOVO BANNER */}
      {showAddBanner && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/80">
          <form onSubmit={handleCreateBanner} className="bg-slate-900 border border-rose-500/30 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-[modalScale_0.3s_ease-out]">
            <div className="p-8 bg-rose-600/10 border-b border-rose-500/20 flex justify-between items-center">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Configurar <span className="text-rose-400">Banner Nexus</span></h3>
              <button type="button" onClick={() => setShowAddBanner(false)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Título Interno</label><input required value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white" placeholder="ex: Campanha Férias" /></div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Arte do Banner (Upload)</label>
                    <div 
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="w-full aspect-video bg-slate-950 border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-rose-500/50 transition-all overflow-hidden group"
                    >
                       {newBanner.image_url ? (
                         <img src={newBanner.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Preview" />
                       ) : (
                         <>
                           <Upload className="w-8 h-8 text-slate-700 mb-2 group-hover:text-rose-500" />
                           <p className="text-[9px] font-black text-slate-600 uppercase">Clique para carregar imagem</p>
                         </>
                       )}
                    </div>
                    <input type="file" ref={bannerFileInputRef} className="hidden" accept="image/*" onChange={handleBannerImageUpload} />
                    <p className="text-[8px] text-slate-600 font-bold uppercase text-center">Recomendado: 1200x400px ou Proporção 3:1</p>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Destaque (se não usar imagem)</label><input value={newBanner.highlight} onChange={e => setNewBanner({...newBanner, highlight: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white" placeholder="ex: 20% OFF" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Subtítulo</label><input value={newBanner.subtitle} onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white" placeholder="Descrição curta..." /></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Tema</label>
                    <select value={newBanner.theme_color} onChange={e => setNewBanner({...newBanner, theme_color: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white">
                      <option value="emerald">Verde</option>
                      <option value="purple">Roxo</option>
                      <option value="amber">Laranja</option>
                      <option value="rose">Rosa</option>
                      <option value="blue">Azul</option>
                    </select>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Texto Botão</label><input value={newBanner.cta_text} onChange={e => setNewBanner({...newBanner, cta_text: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white" /></div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={isCreating} className="w-full py-5 bg-rose-600 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-rose-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} PUBLICAR AGORA
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EXCLUIR */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/90">
          <div className="bg-slate-900 border border-red-500/40 w-full max-w-md rounded-[3rem] p-10 text-center space-y-8 animate-[modalScale_0.3s_ease-out]">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 text-red-500 mx-auto"><Trash2 className="w-10 h-10" /></div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">ELIMINAR <span className="text-red-500">DEFINITIVAMENTE?</span></h3>
            <p className="text-slate-400 text-sm">{itemToDelete.name}</p>
            <div className="flex gap-4">
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-4 bg-slate-800 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Cancelar</button>
              <button onClick={executeDeletion} disabled={isDeleting} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl flex items-center justify-center gap-2">
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
