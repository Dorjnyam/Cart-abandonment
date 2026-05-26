import React from 'react';
import { 
  Activity, 
  Info, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CreditCard,
  MousePointer2,
  Globe
} from 'lucide-react';
import { Card, Badge } from '../ui/Common';
import { cn } from '../../lib/utils';
import { Theme } from '../../types';

const reasons = [
  { code: 'S1', icon: AlertTriangle, status: 'High', score: 82, color: 'text-error-light', bg: 'bg-error-light' },
  { code: 'S2', icon: Smartphone, status: 'High', score: 75, color: 'text-error-light', bg: 'bg-error-light' },
  { code: 'S3', icon: ShieldCheck, status: 'Medium', score: 54, color: 'text-warning-light', bg: 'bg-warning-light' },
  { code: 'S4', icon: MousePointer2, status: 'Medium', score: 48, color: 'text-warning-light', bg: 'bg-warning-light' },
  { code: 'S5', icon: CreditCard, status: 'Low', score: 32, color: 'text-secondary-light', bg: 'bg-secondary-light' },
  { code: 'S6', icon: Activity, status: 'Low', score: 18, color: 'text-muted', bg: 'bg-muted' },
  { code: 'S7', icon: Globe, status: 'Low', score: 12, color: 'text-muted', bg: 'bg-muted' },
];

export const Diagnosis = ({ t, theme }: { t: any, theme?: Theme }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-6 pb-2 border-b border-surface-muted-light dark:border-surface-muted-dark">
         <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900 dark:text-white">{t.diagnosis.title}</h1>
            <p className="text-sm text-muted">{t.diagnosis.subtitle}</p>
         </div>
         <div className={cn("flex rounded-xl border p-1 self-start", theme === 'light' ? "bg-bg-light" : "bg-bg-dark border-surface-muted-dark")}>
            <button className={cn("px-4 py-2 text-xs font-bold rounded-lg shadow-sm", theme === 'light' ? "bg-white" : "bg-surface-dark text-white")}>{t.common.quantitative}</button>
            <button className="px-4 py-2 text-xs font-bold text-muted">{t.common.qualitative}</button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
         {reasons.map((r) => (
            <Card key={r.code} className="p-4 flex flex-col items-center text-center group hover:border-primary-light h-full" noPadding>
               <span className="text-[10px] font-bold text-muted mb-2 tracking-widest">{r.code}</span>
               <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110", r.bg, "bg-opacity-10")}>
                  <r.icon className={cn("w-6 h-6", r.color)} />
               </div>
               <h3 className="text-xs font-bold leading-tight h-10 flex items-center mb-2">
                  {t.diagnosis[`s${r.code.slice(1)}` as keyof typeof t.diagnosis]}
               </h3>
               <div className="mt-auto w-full">
                  <div className="flex items-end justify-center gap-1 mb-2">
                    <span className="text-xl font-display font-extrabold">{r.score}</span>
                    <span className="text-[10px] text-muted font-bold pb-1">/100</span>
                  </div>
                  <Badge variant={r.status === 'High' ? 'error' : r.status === 'Medium' ? 'warning' : 'default'} className="w-full">
                    {r.status === 'High' ? t.common.high : r.status === 'Medium' ? t.common.medium : t.common.low}
                  </Badge>
               </div>
            </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-1" title={t.diagnosis.primaryDriverLogic}>
            <div className="space-y-6 mt-4">
               <div className="p-4 bg-error-light bg-opacity-5 border border-error-light border-opacity-10 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-bold text-error-light uppercase tracking-widest">{t.diagnosis.selectedInvariant}</span>
                     <Badge variant="error" className="bg-error-light bg-opacity-10 text-error-light border-none">S1 {t.diagnosis.driver}</Badge>
                  </div>
                  <p className="text-xs font-mono text-error-light bg-white dark:bg-bg-dark p-2 rounded border border-error-light border-opacity-10">
                     IF (ship_cost / cart_total) &gt; 0.15 AND step == 2 THEN prob += 0.42
                  </p>
               </div>
               <p className="text-xs text-muted leading-relaxed">
                  The model has identified that the ratio of shipping cost to total cart value is the single largest predictor of bounce behavior in your current flow.
               </p>
               <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                     <div className="w-1.5 h-1.5 rounded-full bg-error-light" />
                     <span>{t.diagnosis.affectedSessions}: <span className="font-bold">12,450 (32%)</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                     <div className="w-1.5 h-1.5 rounded-full bg-error-light" />
                     <span>{t.diagnosis.potentialRecovery}: <span className="font-bold text-[#166534]">$8.2k/mo</span></span>
                  </div>
               </div>
            </div>
         </Card>

         <Card className="lg:col-span-2" title={t.diagnosis.detailedSectorBreakdown}>
            <div className="space-y-8 mt-4">
               {[
                 { code: 'S1', title: t.diagnosis.s1, desc: t.diagnosis.s1Desc, action: t.diagnosis.s1Action },
                 { code: 'S2', title: t.diagnosis.s2, desc: t.diagnosis.s2Desc, action: t.diagnosis.s2Action },
                 { code: 'S3', title: t.diagnosis.s3, desc: t.diagnosis.s3Desc, action: t.diagnosis.s3Action },
               ].map((item, idx) => (
                  <div key={idx} className="flex gap-6 pb-6 border-b border-surface-muted-light dark:border-surface-muted-dark last:border-0 last:pb-0 group">
                     <div className="w-10 h-10 rounded-xl bg-surface-muted-light dark:bg-surface-muted-dark shrink-0 flex items-center justify-center font-bold text-xs group-hover:bg-primary-light group-hover:text-white transition-all text-muted">
                        {item.code}
                     </div>
                     <div className="space-y-1">
                        <h4 className="font-bold text-sm tracking-tight">{item.title}</h4>
                        <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-primary-light uppercase tracking-widest pt-1 cursor-pointer hover:underline">
                           {t.diagnosis.implementationGuide} <ArrowRight className="w-2.5 h-2.5" />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </Card>
      </div>
    </div>
  );
};
