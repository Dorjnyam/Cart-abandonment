import React from 'react';
import { 
  Cpu, 
  Target, 
  Activity, 
  BarChart2, 
  Database, 
  Code,
  PieChart as PieIcon,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList,
  LineChart,
  Line
} from 'recharts';
import { Card, Badge } from '../ui/Common';
import { cn } from '../../lib/utils';
import { Theme } from '../../types';

const featureData = [
  { name: 'Time on Checkout', value: 82, contribution: '+12.4%' },
  { name: 'Cart Value', value: 65, contribution: '+8.2%' },
  { name: 'Prev Abandonments', value: 45, contribution: '+5.1%' },
  { name: 'Browser Latency', value: 30, contribution: '-2.3%' },
  { name: 'Mobile Device', value: 25, contribution: '+1.4%' },
];

const histogramData = [
  { prob: '0.0-0.1', count: 450 },
  { prob: '0.1-0.2', count: 320 },
  { prob: '0.2-0.3', count: 210 },
  { prob: '0.3-0.4', count: 180 },
  { prob: '0.5-0.6', count: 540 },
  { prob: '0.7-0.8', count: 890 },
  { prob: '0.9-1.0', count: 1205 },
];

const mockTrendData = [
  { name: 'Oct 1', current: 4000, previous: 2400 },
  { name: 'Oct 5', current: 3000, previous: 1398 },
  { name: 'Oct 10', current: 2000, previous: 9800 },
  { name: 'Oct 15', current: 2780, previous: 3908 },
  { name: 'Oct 20', current: 1890, previous: 4800 },
  { name: 'Oct 25', current: 2390, previous: 3800 },
  { name: 'Oct 30', current: 3490, previous: 4300 },
];

export const Analytics = ({ t, theme }: { t: any, theme?: Theme }) => {
  const chartColors = {
    grid: theme === 'dark' ? '#334155' : '#E2E8F0',
    axis: theme === 'dark' ? '#94a3b8' : '#64748b',
    tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
    tooltipColor: theme === 'dark' ? '#f8fafc' : '#0f172a'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">{t.analytics.title}</h1>
            <p className="text-sm text-muted">{t.analytics.subtitle}</p>
         </div>
         <Badge variant="success" className="h-fit">{t.common.trainingActive}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <Card className="lg:col-span-3" title={t.analytics.performanceMetrics}>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-8 text-center">
               {[
                 { label: t.analytics.accuracy, value: '94.2%', trend: '+0.4%' },
                 { label: t.analytics.precision, value: '91.5%', trend: '+1.2%' },
                 { label: t.analytics.recall, value: '89.8%', trend: '-0.2%' },
                 { label: t.analytics.f1Score, value: '90.6%', trend: '+0.5%' },
                 { label: t.analytics.rocAuc, value: '0.962', trend: '+0.01' },
                 { label: t.analytics.logLoss, value: '0.124', trend: '-0.02' },
               ].map((m, idx) => (
                 <div key={idx} className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-widest">{m.label}</span>
                    <span className="text-2xl font-display font-extrabold">{m.value}</span>
                    <span className={cn("text-[10px] font-bold", m.trend.startsWith('+') ? "text-[#166534]" : "text-error-light")}>
                       {m.trend}
                    </span>
                 </div>
               ))}
            </div>
         </Card>
         <Card title={t.analytics.modelMeta}>
            <div className="space-y-4">
               {[
                 { label: t.analytics.variant, value: 'cart-boost-v4' },
                 { label: t.analytics.trained, value: 'Oct 12, 2024' },
                 { label: t.analytics.dataset, value: '4.2M Sessions' },
                 { label: t.analytics.threshold, value: '0.82' },
               ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-surface-muted-light last:border-0">
                     <span className="text-xs text-muted font-medium">{item.label}</span>
                     <span className="text-xs font-bold">{item.value}</span>
                  </div>
               ))}
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card title={t.analytics.probHistogram} className="overflow-hidden">
            <div className="h-[250px] w-full mt-4 min-w-0">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                     <XAxis dataKey="prob" fontSize={10} axisLine={false} tickLine={false} tick={{fill: chartColors.axis}} />
                     <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: chartColors.axis}} />
                     <Tooltip 
                        cursor={{fill: 'transparent'}} 
                        contentStyle={{ 
                           backgroundColor: chartColors.tooltipBg, 
                           color: chartColors.tooltipColor,
                           borderRadius: '12px', 
                           border: 'none' 
                        }} 
                     />
                     <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {histogramData.map((entry, index) => (
                           <Cell key={index} fill={parseFloat(entry.prob) > 0.5 ? '#4ade80' : '#cbd5e1'} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted mt-4 text-center italic">
               {t.analytics.histogramDesc}
            </p>
         </Card>

         <Card title={t.analytics.topFeatures}>
             <div className="h-[300px] w-full mt-4 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart
                      data={featureData}
                      layout="vertical"
                      margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
                   >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
                      <XAxis type="number" hide />
                      <YAxis 
                         dataKey="name" 
                         type="category" 
                         width={140} 
                         fontSize={11} 
                         axisLine={false} 
                         tickLine={false} 
                         tick={{fill: chartColors.axis, fontWeight: 600}}
                      />
                      <Tooltip 
                         cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                         contentStyle={{ 
                            backgroundColor: chartColors.tooltipBg, 
                            color: chartColors.tooltipColor,
                            borderRadius: '12px', 
                            border: 'none',
                            fontSize: '11px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                         }} 
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                         {featureData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.contribution.startsWith('+') ? '#4ade80' : '#f87171'} />
                         ))}
                         <LabelList 
                            dataKey="contribution" 
                            position="right" 
                            style={{ fontSize: '10px', fontWeight: 'bold', fill: chartColors.axis }} 
                         />
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-muted uppercase tracking-tighter">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
                   <span>{t.analytics.posInfluence}</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#f87171]" />
                   <span>{t.analytics.negInfluence}</span>
                </div>
             </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1" title={t.analytics.confMatrix}>
            <div className="aspect-square w-full grid grid-cols-2 mt-4 border border-surface-muted-light dark:border-surface-muted-dark rounded-lg overflow-hidden">
               <div className="bg-primary-light bg-opacity-20 flex flex-col items-center justify-center p-4 border-r border-b border-surface-muted-light dark:border-surface-muted-dark">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">34k</span>
                  <span className="text-[10px] font-bold text-primary-light">{t.analytics.trueNegative}</span>
               </div>
               <div className="bg-error-light bg-opacity-10 flex flex-col items-center justify-center p-4 border-b border-surface-muted-light dark:border-surface-muted-dark">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">1.2k</span>
                  <span className="text-[10px] font-bold text-error-light">{t.analytics.falsePositive}</span>
               </div>
               <div className="bg-error-light bg-opacity-10 flex flex-col items-center justify-center p-4 border-r border-surface-muted-light dark:border-surface-muted-dark">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">0.8k</span>
                  <span className="text-[10px] font-bold text-error-light">{t.analytics.falseNegative}</span>
               </div>
               <div className="bg-primary-light bg-opacity-20 flex flex-col items-center justify-center p-4">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">12k</span>
                  <span className="text-[10px] font-bold text-primary-light">{t.analytics.truePositive}</span>
               </div>
            </div>
            <div className="mt-4 flex justify-between text-[10px] font-bold text-muted uppercase tracking-widest">
               <span>{t.analytics.actualAbandon}</span>
               <span>{t.analytics.actualConvert}</span>
            </div>
         </Card>

         <Card className="lg:col-span-2 overflow-hidden" title={t.analytics.shapDashboard}>
            <div className="h-[250px] w-full mt-4 min-w-0">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockTrendData}>
                     <XAxis dataKey="name" fontSize={10} hide />
                     <YAxis fontSize={10} hide />
                     <Tooltip 
                        contentStyle={{ 
                           backgroundColor: chartColors.tooltipBg, 
                           color: chartColors.tooltipColor,
                           borderRadius: '12px', 
                           border: 'none' 
                        }} 
                     />
                     <Line type="monotone" dataKey="current" stroke="#4ade80" strokeWidth={2} dot={false} />
                     <Line type="step" dataKey="previous" stroke="#94a3b8" strokeWidth={1} dot={false} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
            <div className={cn("p-4 rounded-lg mt-4 border", theme === 'light' ? "bg-bg-light border-surface-muted-light" : "bg-bg-dark border-surface-muted-dark")}>
               <div className="flex gap-4 items-start">
                  <AlertCircle className="w-5 h-5 text-primary-light shrink-0" />
                  <p className="text-xs leading-relaxed">
                     <span className="font-bold">{t.common.summary}:</span> {t.analytics.shapSummary}
                  </p>
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
};
