import React, { useState } from 'react';
import { 
  Users, 
  ShoppingCart, 
  Target, 
  TrendingUp, 
  ArrowUpRight,
  RefreshCw,
  Download,
  AlertTriangle,
  Play,
  Lightbulb,
  GitCompare
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { KpiCard, Card, Badge } from '../ui/Common';
import { Language, Theme } from '../../types';
import { cn } from '../../lib/utils';

const CustomTooltip = ({ active, payload, label, theme, t }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={cn(
        "p-4 rounded-2xl shadow-2xl border backdrop-blur-md",
        theme === 'dark' 
          ? "bg-surface/90 border-surface-muted text-white" 
          : "bg-surface/90 border-surface-muted text-text"
      )}>
        <div className="flex items-center justify-between mb-3 border-b border-surface-muted-light dark:border-surface-muted-dark pb-2">
          <span className="font-bold text-[10px] uppercase tracking-widest opacity-60 flex items-center gap-2">
            <TrendingUp className="w-3 h-3" />
            {t.dashboard.timepoint}: {label}
          </span>
        </div>
        <div className="space-y-3">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between gap-12">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-sm shadow-sm" 
                    style={{ backgroundColor: entry.color || entry.stroke }} 
                  />
                  <span className="text-xs font-bold whitespace-nowrap">
                    {entry.name === 'current' ? t.dashboard.currentPeriod : t.dashboard.previousPeriod}
                  </span>
                </div>
                <span className="font-mono font-bold text-sm">
                  {entry.value.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          
          {payload.length === 2 && (
            <div className={cn(
              "mt-2 p-2 rounded-xl flex items-center justify-between gap-6",
              payload[0].value > payload[1].value 
                ? "bg-error/10 text-error" 
                : "bg-success/10 text-success"
            )}>
              <span className="text-[10px] uppercase font-extrabold tracking-wider">{t.dashboard.deltaVariance}</span>
              <div className="flex items-center gap-1 font-mono font-bold text-xs">
                {payload[0].value > payload[1].value ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3 rotate-180" />
                )}
                {payload[0].value > payload[1].value ? '+' : ''}
                {(((payload[0].value - payload[1].value) / payload[1].value) * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const mockTrendData = [
  { name: 'Oct 1', current: 4000, previous: 2400 },
  { name: 'Oct 5', current: 3000, previous: 1398 },
  { name: 'Oct 10', current: 2000, previous: 9800 },
  { name: 'Oct 15', current: 2780, previous: 3908 },
  { name: 'Oct 20', current: 1890, previous: 4800 },
  { name: 'Oct 25', current: 2390, previous: 3800 },
  { name: 'Oct 30', current: 3490, previous: 4300 },
];

const mockReasonData = [
  { name: 'Shipping Costs', value: 42, color: '#f87171' },
  { name: 'Account Friction', value: 28, color: '#4ade80' },
  { name: 'Payment Delay', value: 15, color: '#60a5fa' },
  { name: 'Site Speed', value: 9, color: '#fbbf24' },
  { name: 'Other', value: 6, color: '#94a3b8' },
];

export const Overview = ({ t, theme, onNavigate }: { t: any, theme?: Theme, onNavigate?: (page: any) => void }) => {
  const [compareMode, setCompareMode] = useState(true);
  const chartColors = {
    grid: theme === 'dark' ? '#334155' : '#E2E8F0',
    axis: theme === 'dark' ? '#94a3b8' : '#64748b',
    tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
    tooltipColor: theme === 'dark' ? '#f8fafc' : '#0f172a'
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">{t.dashboard.title}</h1>
          <p className="text-muted mt-1">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-muted rounded-lg p-1">
            <button className="px-3 py-1.5 text-xs font-bold rounded-md bg-surface shadow-sm">7d</button>
            <button className="px-3 py-1.5 text-xs font-bold rounded-md text-muted">14d</button>
            <button className="px-3 py-1.5 text-xs font-bold rounded-md text-muted italic">30d</button>
          </div>
          <button className="p-2.5 rounded-xl border border-surface-muted hover:bg-surface transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <Download className="w-4 h-4" />
            {t.common.export}
          </button>
        </div>
      </div>

      {/* Model Chip */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-muted w-fit rounded-full text-xs font-medium">
         <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
         <span className="text-muted">{t.dashboard.model}:</span>
         <span className="font-bold">v2.4-stable</span>
         <span className="mx-1 opacity-20">|</span>
         <span className="text-muted">{t.dashboard.threshold}:</span>
         <span className="font-bold">0.82</span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title={t.dashboard.totalSessions} 
          value="124,502" 
          trend="up" 
          trendValue="12%" 
          icon={Users} 
          color="bg-primary" 
        />
        <KpiCard 
          title={t.dashboard.abandonmentRate} 
          value="69.0%" 
          trend="down" 
          trendValue="1.2%" 
          icon={ShoppingCart} 
          color="bg-error" 
        />
        <KpiCard 
          title={t.dashboard.conversionRate} 
          value="11.2%" 
          trend="up" 
          trendValue="0.5%" 
          icon={Target} 
          color="bg-secondary" 
        />
        <KpiCard 
          title={t.dashboard.avgAbandonProb} 
          value="0.42" 
          trend="up" 
          trendValue="2%" 
          icon={TrendingUp} 
          color="bg-warning" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card 
          className="lg:col-span-2 overflow-hidden" 
          title={t.dashboard.abandonmentTrend} 
          icon={TrendingUp}
          headerAction={
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCompareMode(!compareMode)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                  compareMode 
                    ? "bg-primary text-white border-primary shadow-sm" 
                    : "text-muted border-surface-muted hover:bg-surface-muted"
                )}
              >
                <GitCompare className="w-3 h-3" />
                {compareMode ? t.common.comparing : t.common.compare}
              </button>
            </div>
          }
        >
          <div className="h-[300px] w-full mt-4 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1F4D3E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1F4D3E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: chartColors.axis}} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: chartColors.axis}} />
                <Tooltip content={<CustomTooltip theme={theme} t={t} />} />
                <Area 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#4ade80" 
                  strokeWidth={3} 
                  fillOpacity={0.15} 
                  fill="#4ade80" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#4ade80' }}
                />
                {compareMode && (
                  <Area 
                    type="monotone" 
                    dataKey="previous" 
                    stroke="#94a3b8" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    fill="transparent" 
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#94a3b8' }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={t.dashboard.dominantReasonMix} className="overflow-hidden">
          <div className="h-[300px] w-full relative min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockReasonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockReasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartColors.tooltipBg, 
                    color: chartColors.tooltipColor,
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-2xl font-bold">S1</span>
               <span className="text-[10px] text-muted uppercase font-bold tracking-widest">{t.dashboard.primary}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
             {mockReasonData.map((item, idx) => (
               <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-semibold">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold">{item.value}%</span>
               </div>
             ))}
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Funnel & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t.dashboard.recentHighRisk}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-muted text-[10px] uppercase font-bold text-muted tracking-widest">
                  <th className="pb-4">{t.common.session || 'Session'}</th>
                  <th className="pb-4 text-center">{t.common.risk || 'Risk'}</th>
                  <th className="pb-4 text-right">{t.common.probability || 'Probability'}</th>
                  <th className="pb-4 text-right">{t.common.reason || 'Reason'}</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-surface-muted last:border-0 hover:bg-surface-muted transition-colors group cursor-pointer">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center text-[10px]">#S{8920 + i}</div>
                        <span className="font-mono text-xs">8ef2a{i}...</span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                       <Badge variant={i < 3 ? 'error' : 'warning'}>{i < 3 ? 'High' : 'Medium'}</Badge>
                    </td>
                    <td className="py-4 text-right font-bold text-error">{(0.95 - (i * 0.05)).toFixed(2)}</td>
                    <td className="py-4 text-right">
                       <div className="flex flex-col items-end">
                         <span className="text-xs">S1: High Shipping</span>
                         <span className="text-[10px] text-muted">Checkout Step 2</span>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button 
            onClick={() => onNavigate?.('sessions')}
            className="w-full mt-6 py-2.5 text-xs font-bold text-primary rounded-xl hover:opacity-80 transition-all flex items-center justify-center gap-2 border border-surface-muted shadow-sm bg-bg"
          >
             {t.dashboard.viewAllSessions}
             <ArrowUpRight className="w-3 h-3" />
          </button>
        </Card>

        <Card className="bg-primary bg-opacity-5 border-primary border-dashed" title={t.dashboard.nextBestAction}>
           <div className="flex gap-6 items-start">
             <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Lightbulb className="text-white w-6 h-6" />
             </div>
             <div className="flex-1">
               <h4 className="text-lg font-bold text-text">{t.dashboard.guestCheckoutTitle}</h4>
               <p className="text-sm text-muted mt-2 leading-relaxed">
                  Our model suggests that <span className="font-bold text-primary">28% of abandoned sessions</span> dropped off at the login wall. 
                  Implementing guest checkout could recover approximately <span className="font-bold text-primary">$12.4k in potential revenue</span> this month.
               </p>
               <div className="mt-4 flex gap-3">
                 <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-md">
                    Start Implementation
                 </button>
                 <button className="px-4 py-2 bg-surface border border-surface-muted rounded-lg text-xs font-bold text-text">
                    Learn More
                 </button>
               </div>
             </div>
           </div>
           
           <div className="mt-8 pt-8 border-t border-primary border-opacity-10">
              <div className="flex items-center justify-between mb-4">
                 <h5 className="text-xs font-bold uppercase tracking-widest text-muted">{t.dashboard.recoveryStrategy}</h5>
                 <Badge variant="primary">ML Optimized</Badge>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-xs font-medium text-text">Remove mandatory password fields</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-xs font-medium text-text">Add "Order Tracking" via email link</span>
                 </div>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
};
