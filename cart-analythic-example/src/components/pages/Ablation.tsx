import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  BarChart3, 
  ArrowRight, 
  Zap,
  Activity,
  History,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Inbox,
  RefreshCcw,
  Plus
} from 'lucide-react';
import { Card, Badge, KpiCard } from '../ui/Common';
import { cn } from '../../lib/utils';
import { Theme } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from 'recharts';

const comparisonData = [
  { model: 'Default', abandoned: 72, confidence: 85 },
  { model: 'v2.4-stable', abandoned: 69, confidence: 94 },
  { model: 'v3.0-beta', abandoned: 65, confidence: 88 },
];

const Skeleton = ({ className }: { className?: string, key?: React.Key }) => (
  <div className={cn("animate-pulse bg-surface-muted rounded-xl", className)} />
);

const AblationSkeleton = () => (
   <div className="space-y-8">
      <div className="flex justify-between items-center">
         <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
         </div>
         <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>

      <Card className="h-[400px]">
         <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-[300px] w-full" />
         </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Skeleton className="h-[300px] w-full" />
         <Skeleton className="h-[300px] w-full" />
      </div>
   </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
   <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 bg-error bg-opacity-10 rounded-2xl flex items-center justify-center text-error mb-6">
         <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold mb-2">Failed to load study data</h3>
      <p className="text-muted text-sm max-w-sm mb-8">
         We encountered an error while fetching the ablation study comparisons. This might be a temporary network issue.
      </p>
      <button 
         onClick={onRetry}
         className="flex items-center gap-2 px-6 py-3 bg-surface-muted hover:bg-opacity-80 transition-all rounded-xl font-bold text-sm"
      >
         <RefreshCcw className="w-4 h-4" />
         Try Again
      </button>
   </div>
);

const EmptyState = () => (
   <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-2xl flex items-center justify-center text-primary mb-6">
         <Inbox className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold mb-2">No ablation studies yet</h3>
      <p className="text-muted text-sm max-w-sm mb-8">
         You haven't run any model comparisons or ablation studies. Start one to see how your models perform against each other.
      </p>
      <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all">
         <Plus className="w-4 h-4" />
         Run Your First Study
      </button>
   </div>
);

export const AblationStudy = ({ t, theme }: { t: any, theme?: Theme }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setError(false);
    // Simulate API call
    setTimeout(() => {
      setData(comparisonData);
      setLoading(false);
    }, 1500);
  };

  const chartColors = {
    grid: theme === 'dark' ? '#334155' : '#E2E8F0',
    axis: theme === 'dark' ? '#94a3b8' : '#64748b',
    tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
    tooltipColor: theme === 'dark' ? '#f8fafc' : '#0f172a'
  };

  if (loading) return <AblationSkeleton />;
  if (error) return <ErrorState onRetry={loadData} />;
  if (data.length === 0) return <EmptyState />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Ablation & Model Comparison</h1>
          <p className="text-sm text-muted">A/B testing and performance delta analysis between model variants.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm">
           <GitCompare className="w-4 h-4" />
           Run New Study
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <KpiCard title="Abandonment Delta" value="-12.4%" trend="up" trendValue="4.2%" icon={Activity} color="bg-success" />
         <KpiCard title="Confidence Delta" value="+8.2%" trend="up" trendValue="1.5%" icon={ShieldCheck} color="bg-primary" />
         <KpiCard title="Avg Prediction Time" value="42ms" trend="down" trendValue="12ms" icon={History} color="bg-secondary" />
      </div>

      <Card title="Model Comparison Performance" className="overflow-hidden">
         <div className="h-[300px] mt-6 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                  <XAxis dataKey="model" fontSize={10} axisLine={false} tickLine={false} tick={{fill: chartColors.axis}} />
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
                  <Bar dataKey="abandoned" name="Abandonment Rate (%)" radius={[4, 4, 0, 0]} barSize={40}>
                     {comparisonData.map((entry, index) => (
                        <Cell key={index} fill={entry.model === 'v2.4-stable' ? '#4ade80' : '#cbd5e1'} />
                     ))}
                  </Bar>
                  <Bar dataKey="confidence" name="Confidence Score" radius={[4, 4, 0, 0]} fill="#60a5fa" opacity={0.5} barSize={40} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card title="Ablation Details">
            <div className="space-y-4">
               {[
                 { feature: 'Shipping Calculation Step', status: 'Enabled', impact: '+3.2%', significance: 'High' },
                 { feature: 'Payment Threshold Logic', status: 'Disabled', impact: '-1.4%', significance: 'Medium' },
                 { feature: 'Device Intent Mapping', status: 'Enabled', impact: '+5.6%', significance: 'Critical' },
               ].map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-bg rounded-xl border border-surface-muted">
                     <div>
                        <p className="text-sm font-bold text-text">{f.feature}</p>
                        <p className="text-[10px] text-muted uppercase font-bold tracking-widest">{f.status}</p>
                     </div>
                     <div className="text-right">
                        <p className={cn("text-sm font-bold", f.impact.startsWith('+') ? "text-primary" : "text-error")}>{f.impact}</p>
                        <Badge variant={f.significance === 'Critical' ? 'error' : 'default'} className={cn(f.significance === 'Critical' ? "bg-error bg-opacity-10 text-error border-none" : "")}>{f.significance}</Badge>
                     </div>
                  </div>
               ))}
            </div>
         </Card>

         <Card title="Variant Recommendations">
            <div className="p-6 bg-primary bg-opacity-5 rounded-2xl border border-primary border-opacity-10">
               <h4 className="font-bold text-sm mb-2">Switch to v3.0-beta?</h4>
               <p className="text-xs text-muted leading-relaxed mb-6">
                  Our current study shows that v3.0-beta reduces False Positives by 14.2% while maintaining similar throughput. However, memory consumption is 22% higher.
               </p>
               <button className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                  Promote to Staging
                  <ArrowRight className="w-4 h-4" />
               </button>
            </div>
         </Card>
      </div>
    </div>
  );
};
