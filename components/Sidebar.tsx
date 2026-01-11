
import React from 'react';
import { Settings, LogOut, FileText, LayoutDashboard, DollarSign, ShieldCheck, BriefcaseBusiness, Award, ShoppingCart, LifeBuoy, Info } from 'lucide-react';
import { UserProfile, AppState } from '../types';

interface Props {
  activeTab: AppState;
  setActiveTab: (tab: AppState) => void;
  user: UserProfile;
  onLogout: () => void;
  t: (key: string) => any;
}

const Sidebar: React.FC<Props> = ({ activeTab, setActiveTab, user, onLogout, t }) => {
  const isMaster = user.email === 'master@digitalnexus.com';
  const isVendor = user.role === 'vendor';
  const isSupport = user.role === 'support';
  const isAdmin = user.role === 'admin' || user.email === 'admin@digitalnexus.com' || isMaster;
  
  const tabs = [
    { id: 'dashboard' as AppState, icon: LayoutDashboard, label: 'Registro de dia', show: !isMaster && !isVendor && !isSupport },
    { id: 'finance' as AppState, icon: DollarSign, label: 'Finanças', show: !isMaster && !isVendor && !isSupport },
    { id: 'reports' as AppState, icon: FileText, label: 'Relatórios', show: !isMaster && !isVendor && !isSupport },
    { id: 'accountant' as AppState, icon: BriefcaseBusiness, label: 'Contabilista', show: !isMaster && !isVendor && !isSupport },
    
    { id: 'vendor-detail' as AppState, icon: Award, label: 'Minha Rede', show: isVendor },
    { id: 'vendor-sales' as AppState, icon: ShoppingCart, label: 'Minhas Vendas', show: isVendor },
    
    // Suporte (Staff ou Admin)
    { id: 'support' as AppState, icon: LifeBuoy, label: 'Atendimento', show: isSupport || isAdmin },
    
    // Suporte (Usuário Comum)
    { id: 'user-support' as AppState, icon: LifeBuoy, label: 'Suporte', show: !isAdmin && !isSupport && !isMaster && !isVendor },
    
    { id: 'admin' as AppState, icon: ShieldCheck, label: 'Nexus Master', show: isAdmin },
    { id: 'about-nexus' as AppState, icon: Info, label: 'Digital Nexus', show: true },
    { id: 'settings' as AppState, icon: Settings, label: 'Perfil', show: !isMaster },
  ];

  const filteredTabs = tabs.filter(t => t.show);

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-24 bg-slate-950 border-r border-white/5 z-[100] flex-col items-center py-10">
        <div className="w-10 h-10 btn-primary rounded-xl flex items-center justify-center font-black text-white text-xs mb-12 shadow-lg shadow-purple-500/20">DX</div>
        <nav className="flex-1 space-y-4 w-full px-2">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex flex-col items-center justify-center py-3 rounded-2xl transition-all relative group ${activeTab === tab.id ? 'bg-white/5 text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              <span className="text-[7px] font-black uppercase tracking-tighter mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-center px-1">
                {tab.label}
              </span>
              {activeTab === tab.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 btn-primary rounded-r-full"></div>}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="p-4 text-slate-700 hover:text-red-500 transition-colors group flex flex-col items-center">
          <LogOut className="w-6 h-6" />
          <span className="text-[7px] font-black uppercase mt-1 opacity-0 group-hover:opacity-100">Sair</span>
        </button>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-[#020617]/95 backdrop-blur-2xl z-[500] flex items-center justify-around px-2 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
        {filteredTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`flex flex-col items-center gap-1.5 p-1 transition-all duration-300 flex-1 relative ${isActive ? 'text-purple-400' : 'text-slate-500'}`}
            >
              <div className={`transition-all duration-300 ${isActive ? 'scale-110 -translate-y-1' : 'opacity-60'}`}>
                <tab.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              </div>
              <span className={`text-[7px] font-black uppercase tracking-widest text-center whitespace-nowrap transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`}>
                {tab.id === 'dashboard' ? 'Log' : tab.id === 'accountant' ? 'Contas' : tab.id === 'admin' ? 'Master' : tab.id === 'reports' ? 'Relat.' : tab.id === 'user-support' || tab.id === 'support' ? 'Suporte' : tab.id === 'vendor-detail' ? 'Rede' : tab.id === 'vendor-sales' ? 'Vendas' : tab.id === 'about-nexus' ? 'Empresa' : tab.label}
              </span>
              {isActive && (
                <div className="absolute -top-1 w-6 h-0.5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
              )}
            </button>
          );
        })}
        
        <button 
          onClick={onLogout}
          className="flex flex-col items-center gap-1.5 p-1 transition-all duration-300 flex-1 text-slate-500 hover:text-red-400 active:scale-95"
        >
          <div className="opacity-60 group-active:scale-110">
            <LogOut className="w-5 h-5 stroke-[1.5px]" />
          </div>
          <span className="text-[7px] font-black uppercase tracking-widest text-center opacity-40">
            Sair
          </span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
