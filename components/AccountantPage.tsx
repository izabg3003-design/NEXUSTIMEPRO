
import React, { useState, useMemo, useEffect } from 'react';
import { format, endOfYear, eachMonthOfInterval, startOfYear } from 'date-fns';
import { ptBR, enUS, es, fr, de, it, ru, uk, hi, zhCN, ja } from 'date-fns/locale';
import { BriefcaseBusiness, Printer, FileDown, FileCheck, ReceiptText, Calendar, Building2, User as UserIcon, ShieldAlert, Percent, Euro, ShieldCheck } from 'lucide-react';
import { UserProfile, WorkRecord, FinanceSummary } from '../types';

interface Props {
  user: UserProfile;
  records: Record<string, WorkRecord>;
  t: (key: string) => any;
  f: (value: number) => string;
}

const AccountantPage: React.FC<Props> = ({ user, records, t, f }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState<'annual' | 'quarterly'>('annual');
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor((new Date().getMonth() + 3) / 3));

  // Resetar para anual se o regime de freelancer for desativado
  useEffect(() => {
    if (!user.isFreelancer && reportType === 'quarterly') {
      setReportType('annual');
    }
  }, [user.isFreelancer, reportType]);

  const lang = user.settings?.language || 'pt-PT';
  const locales: Record<string, any> = { 
    'pt-BR': ptBR, 'pt-PT': ptBR, 'en': enUS, 'es-ES': es, 'es-AR': es, 
    'fr': fr, 'de': de, 'it': it, 'ru': ru, 'uk': uk, 'hi': hi, 'zh': zhCN, 'ja': ja 
  };
  const currentLocale = locales[lang] || ptBR;

  const calculateMonthSummary = (monthRecords: WorkRecord[]): FinanceSummary => {
    let summary: FinanceSummary = { 
      daysWorked: 0, totalHours: 0, totalExtraHours: 0, extraHoursValue: 0, 
      socialSecurityTotal: 0, irsTotal: 0, advancesTotal: 0, grossTotal: 0, 
      netTotal: 0, ivaTotal: 0 
    };

    monthRecords.forEach(record => {
      if (record.isAbsent) return;
      summary.daysWorked++;
      
      const [hEntry, mEntry] = record.entry.split(':').map(Number);
      const [hExit, mExit] = record.exit.split(':').map(Number);
      let hours = (hExit + mExit/60) - (hEntry + mEntry/60);
      if (record.hasLunchBreak) hours -= 1;
      
      summary.totalHours += hours;
      summary.advancesTotal += record.advance || 0;

      const h1 = record.extraHours?.h1 || 0;
      const h2 = record.extraHours?.h2 || 0;
      const h3 = record.extraHours?.h3 || 0;
      
      const dailyExtraBonus = (h1 * user.hourlyRate * (user.overtimeRates.h1 / 100)) + 
                              (h2 * user.hourlyRate * (user.overtimeRates.h2 / 100)) + 
                              (h3 * user.hourlyRate * (user.overtimeRates.h3 / 100));
      
      summary.totalExtraHours += (h1 + h2 + h3);
      summary.extraHoursValue += dailyExtraBonus;
      summary.grossTotal += (hours * user.hourlyRate) + dailyExtraBonus;
    });

    const calcTax = (base: number, config: { value: number; type: 'percentage' | 'fixed' }) => 
      config.type === 'percentage' ? (base * config.value) / 100 : config.value;

    if (!user.isFreelancer) {
      summary.socialSecurityTotal = calcTax(summary.grossTotal, user.socialSecurity);
      summary.irsTotal = calcTax(summary.grossTotal, user.irs);
    } else {
      summary.ivaTotal = calcTax(summary.grossTotal, user.vat);
    }

    summary.netTotal = summary.grossTotal - summary.socialSecurityTotal - summary.irsTotal - summary.advancesTotal + (user.isFreelancer ? summary.ivaTotal : 0);
    return summary;
  };

  const reportData = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const months = eachMonthOfInterval({ 
      start: yearStart, 
      end: endOfYear(yearStart) 
    });

    let filteredMonths = months;
    if (reportType === 'quarterly' && user.isFreelancer) {
      const startIdx = (selectedQuarter - 1) * 3;
      filteredMonths = months.slice(startIdx, startIdx + 3);
    }

    const monthlyData = filteredMonths.map(month => {
      const monthKey = format(month, 'yyyy-MM');
      const monthRecords = (Object.entries(records) as [string, WorkRecord][])
        .filter(([d]) => d.startsWith(monthKey))
        .map(([_, r]) => r);
      
      return { 
        monthName: format(month, 'MMMM', { locale: currentLocale }),
        monthKey: monthKey,
        summary: calculateMonthSummary(monthRecords) 
      };
    });

    const totals = monthlyData.reduce((acc, curr) => ({
      gross: acc.gross + curr.summary.grossTotal,
      net: acc.net + curr.summary.netTotal,
      irs: acc.irs + curr.summary.irsTotal,
      ss: acc.ss + curr.summary.socialSecurityTotal,
      iva: acc.iva + curr.summary.ivaTotal,
      advances: acc.advances + curr.summary.advancesTotal,
      extraValue: acc.extraValue + curr.summary.extraHoursValue,
      hours: acc.hours + curr.summary.totalHours,
      days: acc.days + curr.summary.daysWorked
    }), { gross: 0, net: 0, irs: 0, ss: 0, iva: 0, advances: 0, extraValue: 0, hours: 0, days: 0 });

    return { monthlyData, totals };
  }, [selectedYear, reportType, selectedQuarter, records, user, currentLocale]);

  const handlePrint = () => {
    const originalTitle = document.title;
    const dateLabel = reportType === 'annual' ? selectedYear : `${selectedYear}_Q${selectedQuarter}`;
    const cleanName = user.name.toUpperCase().replace(/\s+/g, '_');
    document.title = `DIGITAL_NEXUS_RELATORIO_${cleanName}_${dateLabel}`;
    
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 200);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-[fadeIn_0.5s_ease-out] pb-32 px-2 md:px-0">
      {/* Barra de Ações Oculta na Impressão */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Nexus Solutions</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase">NEXUS<span className="text-green-400">_LEDGER</span></h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800/40 p-1 rounded-xl border border-white/5 flex">
            <button 
              onClick={() => setReportType('annual')} 
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${reportType === 'annual' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              Anual
            </button>
            {user.isFreelancer && (
              <button 
                onClick={() => setReportType('quarterly')} 
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${reportType === 'quarterly' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                Trimestre
              </button>
            )}
          </div>

          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-slate-900 font-black px-6 py-3 rounded-xl transition-all shadow-xl active:scale-95 text-[10px] uppercase tracking-widest"
          >
            <Printer className="w-4 h-4" /> Descarregar PDF (A4)
          </button>
        </div>
      </div>

      {/* DOCUMENTO DO RELATÓRIO */}
      <div className="bg-white text-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-2xl overflow-hidden print:p-0 print:shadow-none print:rounded-none print-container">
        
        {/* Cabeçalho Profissional */}
        <header className="flex flex-col md:flex-row justify-between items-start border-b border-slate-100 pb-8 mb-8 gap-6 print:border-black print:pb-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center text-white font-black text-[12px]">DX</div>
              <div>
                <h1 className="font-black text-lg md:text-xl tracking-tighter uppercase leading-none text-slate-900">Digital Nexus Solutions</h1>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Infraestrutura Contabilística v14.0</p>
              </div>
            </div>
            
            <div className="space-y-0.5">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
                {reportType === 'annual' ? 'Declaração Anual de Rendimentos' : 'Declaração Trimestral'}
              </h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                Referência: {selectedYear} {reportType === 'quarterly' ? `— Q${selectedQuarter}` : ''}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl min-w-[280px] space-y-3 print:border-black print:bg-white print:p-4">
            <div className="flex items-center gap-3">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Contribuinte Registado</p>
                <p className="text-sm font-black uppercase text-slate-900">{user.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 print:border-black">
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">NIF Fiscal</p>
                <p className="text-[10px] font-bold text-slate-900">{user.nif || '---'}</p>
              </div>
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                <p className="text-[9px] font-black text-green-600 uppercase">{user.isFreelancer ? 'Prestador de Serviços' : 'Contrato de Trabalho'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Quadro de Totais Separados por Bloco */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 print:grid-cols-6 print:gap-1.5 print:mb-4">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl print:bg-white print:text-black print:border-black border">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 print:text-slate-500">Bruto Total</p>
            <p className="text-base font-black truncate text-slate-900">{f(reportData.totals.gross)}</p>
          </div>
          
          {!user.isFreelancer ? (
            <>
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl print:border-black print:bg-white">
                <div className="flex items-center gap-1.5 mb-1">
                   <p className="text-[7px] font-black text-red-500 uppercase tracking-widest print:text-slate-500">IRS Retido</p>
                </div>
                <p className="text-base font-black text-red-600 truncate">-{f(reportData.totals.irs)}</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl print:border-black print:bg-white">
                <div className="flex items-center gap-1.5 mb-1">
                   <p className="text-[7px] font-black text-blue-600 uppercase tracking-widest print:text-slate-500">Seg. Social</p>
                </div>
                <p className="text-base font-black text-blue-600 truncate">-{f(reportData.totals.ss)}</p>
              </div>
            </>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl print:border-black col-span-2 print:bg-white">
              <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mb-1 print:text-slate-500">IVA Liquidado (23%)</p>
              <p className="text-base font-black text-emerald-600 truncate">+{f(reportData.totals.iva)}</p>
            </div>
          )}
          
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl print:border-black print:bg-white">
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Adiantamentos</p>
            <p className="text-base font-black text-amber-600 truncate">-{f(reportData.totals.advances)}</p>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-500/20 p-4 rounded-2xl print:bg-slate-100 print:text-black print:border-black col-span-2 shadow-sm">
            <p className="text-[7px] font-black text-emerald-700 uppercase tracking-widest mb-1">Rendimento Líquido</p>
            <p className="text-xl font-black text-emerald-700 truncate">{f(reportData.totals.net)}</p>
          </div>
        </div>

        {/* Tabela de Auditoria Fiscal - Design de Fundo Branco Otimizado para Mobile */}
        <div className="rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar print:overflow-visible print:border-black print:rounded-none">
          <table className="w-full text-left text-[10px] border-collapse min-w-[750px] md:min-w-full print:min-w-full print:text-[8pt]">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest border-b border-slate-100 print:bg-slate-100 print:text-black print:border-black">
              <tr>
                <th className="px-4 py-4 w-[14%]">Mês</th>
                <th className="px-3 py-4 text-right w-[15%]">Bruto Total</th>
                <th className="px-3 py-4 text-right w-[15%]">Bónus Extras</th>
                {!user.isFreelancer ? (
                  <>
                    <th className="px-3 py-4 text-right w-[12%] text-red-600">IRS</th>
                    <th className="px-3 py-4 text-right w-[12%] text-blue-600">S.S.</th>
                  </>
                ) : (
                  <th className="px-3 py-4 text-right w-[24%]">IVA (Liq.)</th>
                )}
                <th className="px-3 py-4 text-right w-[13%]">Vales</th>
                <th className="px-4 py-4 text-right bg-slate-100/30 font-black w-[16%] print:bg-slate-200">Líquido Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 print:divide-slate-200">
              {reportData.monthlyData.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30">
                  <td className="px-4 py-3 font-black capitalize text-slate-900 truncate">{m.monthName}</td>
                  <td className="px-3 py-3 text-right font-bold text-slate-700">{f(m.summary.grossTotal)}</td>
                  <td className="px-3 py-3 text-right text-purple-600 font-bold">+{f(m.summary.extraHoursValue)}</td>
                  {!user.isFreelancer ? (
                    <>
                      <td className="px-3 py-3 text-right text-red-500">-{f(m.summary.irsTotal)}</td>
                      <td className="px-3 py-3 text-right text-blue-400">-{f(m.summary.socialSecurityTotal)}</td>
                    </>
                  ) : (
                    <td className="px-3 py-3 text-right text-emerald-600 font-bold">+{f(m.summary.ivaTotal)}</td>
                  )}
                  <td className="px-3 py-3 text-right text-amber-600 font-bold">-{f(m.summary.advancesTotal)}</td>
                  <td className="px-4 py-3 text-right font-black text-slate-950 bg-slate-50/20 print:bg-slate-50">
                    {f(m.summary.netTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* LINHA DE TOTAIS COM FUNDO BRANCO / CLARO */}
            <tfoot className="bg-slate-100 text-slate-900 font-black uppercase text-[9px] border-t-2 border-slate-200 print:bg-white print:text-black print:text-[8pt] print:border-black">
              <tr>
                <td className="px-4 py-6">Totais Consolidados</td>
                <td className="px-3 py-6 text-right">{f(reportData.totals.gross)}</td>
                <td className="px-3 py-6 text-right">{f(reportData.totals.extraValue)}</td>
                {!user.isFreelancer ? (
                  <>
                    <td className="px-3 py-6 text-right text-red-600">{f(reportData.totals.irs)}</td>
                    <td className="px-3 py-6 text-right text-blue-600">{f(reportData.totals.ss)}</td>
                  </>
                ) : (
                  <td className="px-3 py-6 text-right text-emerald-600">{f(reportData.totals.iva)}</td>
                )}
                <td className="px-3 py-6 text-right text-amber-600">{f(reportData.totals.advances)}</td>
                <td className="px-4 py-6 text-right bg-emerald-50 text-emerald-700 border-l border-slate-200 print:bg-white print:text-black print:border-black">{f(reportData.totals.net)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Rodapé Fiscal - Digital Nexus Solutions */}
        <footer className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center opacity-40 print:opacity-100 print:border-black print:mt-8">
          <div className="flex items-center gap-3">
             <Building2 className="w-4 h-4 text-slate-900" />
             <p className="text-[7px] font-black uppercase tracking-widest text-slate-900">
               Auditoria Certificada • NexusTime v14 • Gerado em {format(new Date(), 'dd/MM/yyyy')}
             </p>
          </div>
          <div className="text-[7px] font-bold uppercase tracking-[0.2em] text-slate-900">
            Digital Nexus Solutions — Copyright © 2025
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AccountantPage;
