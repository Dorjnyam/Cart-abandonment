import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Smartphone, 
  Monitor, 
  Tablet, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Clock,
  AlertTriangle,
  ArrowLeft,
  User,
  Globe,
  Settings,
  Database,
  ArrowRight,
  Activity,
  Zap,
  Info,
  ExternalLink,
  Code2,
  Lightbulb,
  Calendar,
  X
} from 'lucide-react';
import { Card, Badge, KpiCard } from '../ui/Common';
import { cn } from '../../lib/utils';
import { Theme } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

const mockSessions = [
  { id: 'SES-8921A', time: '10:42 AM', date: 'May 12', fullDate: '2026-05-12', device: 'Mobile', value: '$245.00', status: 'Abandoned', risk: 'High', reason: 'S1: Shipping Cost', probability: 0.92 },
  { id: 'SES-8920B', time: '10:35 AM', date: 'May 12', fullDate: '2026-05-12', device: 'Desktop', value: '$1,120.50', status: 'Completed', risk: 'Low', reason: '-', probability: 0.05 },
  { id: 'SES-8919C', time: '10:15 AM', date: 'May 11', fullDate: '2026-05-11', device: 'Mobile', value: '$85.00', status: 'Active', risk: 'Medium', reason: 'Idle for 5 mins', probability: 0.45 },
  { id: 'SES-8918D', time: '09:50 AM', date: 'May 11', fullDate: '2026-05-11', device: 'Tablet', value: '$450.00', status: 'Abandoned', risk: 'High', reason: 'S1: Shipping Cost', probability: 0.88 },
  { id: 'SES-8917E', time: '09:12 AM', date: 'May 10', fullDate: '2026-05-10', device: 'Desktop', value: '$312.00', status: 'Abandoned', risk: 'Medium', reason: 'S3: Price Sensitivity', probability: 0.62 },
];

const SessionDrawer = ({ session, isOpen, onClose, theme, t }: { session: any, isOpen: boolean, onClose: () => void, theme?: Theme, t: any }) => {
  const scores = [
    { label: 'S1: Shipping', score: 92, color: 'text-error', bar: 'bg-error' },
    { label: 'S2: Price', score: 45, color: 'text-warning', bar: 'bg-warning' },
    { label: 'S3: Trust', score: 12, color: 'text-success', bar: 'bg-success' },
    { label: 'S4: Mobile UI', score: 88, scoreColor: 'text-error', bar: 'bg-error' },
    { label: 'S5: Payment', score: 30, color: 'text-warning', bar: 'bg-warning' },
    { label: 'S6: Speed', score: 65, color: 'text-warning', bar: 'bg-warning' },
    { label: 'S7: Stock', score: 5, color: 'text-success', bar: 'bg-success' },
  ];

  const timeline = [
    { time: '10:38:02', event: 'Session Started', icon: Activity, desc: 'User landed on Homepage' },
    { time: '10:39:15', event: 'Product Viewed', icon: Eye, desc: 'Nike Air Max 270 (Ref: 9912)' },
    { time: '10:40:45', event: 'Added to Cart', icon: Zap, desc: 'Item value: $245.00' },
    { time: '10:41:20', event: 'Checkout Started', icon: ArrowRight, desc: 'User entered email' },
    { time: '10:42:01', event: 'Shipping Step', icon: Globe, desc: 'Requesting shipping rates...' },
    { time: '10:42:15', event: 'Abandoned', icon: AlertTriangle, desc: 'Session terminated after 15s idle' },
  ];

  const developerPayload = {
    session_id: session?.id,
    user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
    metadata: {
      ip: "192.168.1.104",
      geo: { city: "New York", country: "US" },
      browser: "Safari Mobile",
      os: "iOS 16.0"
    },
    cart: {
      items: [{ id: "9912", pk: "sku_882", price: 245.00, qty: 1 }],
      total: 245.00,
      currency: "USD"
    },
    ml_results: {
      prediction: "abandonment",
      confidence: 0.92,
      model_version: "v2.4-stable",
      top_features: [
        { name: "shipping_cost_delta", value: 0.85 },
        { name: "checkout_time", value: 0.12 },
        { name: "previous_abandonments", value: 0.03 }
      ]
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed right-0 top-0 h-full w-full max-w-2xl z-50 shadow-2xl flex flex-col",
              "bg-bg"
            )}
          >
            <div className={cn(
              "flex justify-between items-center p-6 border-b border-surface-muted"
            )}>
              <div className="flex items-center gap-4">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-surface-muted rounded-full transition-all"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
                <div>
                   <h2 className="text-xl font-bold font-display tracking-tight text-text">{t.sessions.details}</h2>
                   <p className="text-xs font-mono text-muted">{session?.id}</p>
                </div>
              </div>
              <div className="flex gap-2">
                 <Badge variant="error" className="bg-error bg-opacity-10 text-error border-none">{t.common.highRisk}</Badge>
                 <button className="p-2 text-muted hover:text-primary transition-all">
                    <ExternalLink className="w-4 h-4" />
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title={t.sessions.predictionConfidence} icon={Activity} className="shadow-sm">
                  <div className="flex flex-col items-center py-6">
                     <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                           <circle
                             cx="64"
                             cy="64"
                             r="58"
                             stroke="currentColor"
                             strokeWidth="8"
                             fill="transparent"
                             className="text-surface-muted-light dark:text-surface-muted-dark opacity-10"
                           />
                        <motion.circle
                             cx="64"
                             cy="64"
                             r="58"
                             stroke="currentColor"
                             strokeWidth="8"
                             fill="transparent"
                             initial={{ strokeDashoffset: 364.4 }}
                             animate={{ strokeDashoffset: 364.4 * (1 - (session?.probability || 0)) }}
                             strokeDasharray={364.4}
                             className={cn(
                               (session?.probability || 0) > 0.8 ? "text-error-light" : 
                               (session?.probability || 0) > 0.5 ? "text-warning-light" : "text-success-light"
                             )}
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                             {Math.round((session?.probability || 0) * 100)}%
                           </span>
                           <span className="text-[10px] uppercase font-bold text-muted tracking-widest">{t.common.probability}</span>
                        </div>
                     </div>
                     <div className="mt-6 w-full space-y-3">
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-muted">{t.sessions.modelVersion}</span>
                           <span className="font-mono font-bold text-slate-900 dark:text-white">V2.4-STABLE</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-muted">{t.sessions.dominantDriver}</span>
                           <span className="font-bold text-error-light truncate ml-4 text-right">
                             {session?.reason || 'No specific driver'}
                           </span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-surface-muted-light dark:border-surface-muted-dark pt-3">
                           <span className="text-muted">{t.sessions.predictedClass}</span>
                           <Badge 
                             variant={session?.status === 'Abandoned' ? 'error' : session?.status === 'Active' ? 'warning' : 'success'} 
                             className="bg-opacity-10 border-none text-[10px]"
                           >
                             {session?.status === 'Completed' ? t.common.completed : session?.status || 'Unknown'}
                           </Badge>
                        </div>
                     </div>
                  </div>
                </Card>

                <Card title={t.common.metadata} icon={Settings} className="shadow-sm">
                   <div className="space-y-3 pt-2">
                     <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-surface-muted hover:border-primary/30 transition-all cursor-default">
                        <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                           <Globe className="w-4 h-4 text-muted" />
                        </div>
                        <div className="min-w-0 flex-1">
                           <p className="text-[10px] uppercase font-bold text-muted tracking-widest">{t.common.location}</p>
                           <p className="text-xs font-bold truncate text-text">New York, US</p>
                        </div>
                        <span className="text-[9px] font-mono text-muted">192.x.x.104</span>
                     </div>
                     <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-surface-muted hover:border-primary/30 transition-all cursor-default">
                        <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                           <Monitor className="w-4 h-4 text-muted" />
                        </div>
                        <div className="min-w-0 flex-1">
                           <p className="text-[10px] uppercase font-bold text-muted tracking-widest">{t.common.environment}</p>
                           <p className="text-xs font-bold truncate text-text">
                             {session?.device || 'Desktop'} · Safari/iOS 16
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-surface-muted hover:border-primary/30 transition-all cursor-default">
                        <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                           <User className="w-4 h-4 text-muted" />
                        </div>
                        <div className="min-w-0 flex-1">
                           <p className="text-[10px] uppercase font-bold text-muted tracking-widest">{t.common.userId}</p>
                           <p className="text-xs font-bold truncate text-text">guest_002917</p>
                        </div>
                     </div>
                  </div>
                </Card>
              </div>

              <Card title={t.dashboard.reasonScores} icon={Zap} className="shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-2">
                  {scores.map((s) => (
                    <div key={s.label} className="space-y-1.5 p-3 rounded-xl bg-surface-muted/10 border border-transparent hover:border-surface-muted transition-all">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-muted uppercase tracking-tighter">{s.label}</span>
                        <span className={s.color}>{s.score}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${s.score}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={cn("h-full", s.bar)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card title={t.sessions.eventTimeline} icon={Clock} className="shadow-sm">
                  <div className="relative space-y-6 mt-4 before:absolute before:inset-0 before:left-3.5 before:w-px before:bg-surface-muted before:h-full">
                    {timeline.map((t, i) => (
                      <div key={i} className="relative flex gap-4 pl-10">
                        <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-bg border-2 border-surface-muted flex items-center justify-center z-10 shrink-0">
                          <t.icon className={cn("w-3 h-3 text-muted", i === timeline.length - 1 && "text-error")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className={cn("text-xs font-bold text-text", i === timeline.length - 1 && "text-error")}>{t.event}</h4>
                            <span className="text-[10px] font-mono text-muted">{t.time}</span>
                          </div>
                          <p className="text-[11px] text-muted mt-1 truncate">{t.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title={t.sessions.actionableInsight} icon={Lightbulb} className={cn("shadow-sm border-primary/20", "bg-primary/5")}>
                   <div className="space-y-4 pt-2">
                      <p className="text-sm leading-relaxed font-medium italic text-muted">
                        "User sensitivity to shipping fee detected ($15.99). High probability of recovery if offered a $10 discount or free shipping for this basket value."
                      </p>
                      <button className="w-full py-4 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                         {t.sessions.generateVoucher}
                      </button>
                      <div className="pt-2">
                        <p className="text-[10px] uppercase font-bold text-muted tracking-widest mb-2">{t.sessions.simulatedOutcome}</p>
                        <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-surface-muted text-xs">
                           <span className="text-muted">{t.sessions.probConversion}</span>
                           <span className="text-success font-bold">+ 38.5%</span>
                        </div>
                      </div>
                   </div>
                </Card>
              </div>

              <Card title={t.analytics.topFeatures} icon={Database} className="shadow-sm">
                <div className="space-y-3 mt-4">
                   {[
                     { name: 'shipping_cost_delta', weight: '0.85', desc: 'Shipping cost vs item price ratio is unusually high' },
                     { name: 'checkout_step_latency', weight: '0.12', desc: 'Prolonged interaction time on step 2' },
                     { name: 'historical_abandonment', weight: '0.03', desc: 'Similar patterns detected in last 30 days' },
                   ].map((f, i) => (
                     <div key={i} className="p-3 bg-bg border border-surface-muted rounded-xl flex gap-4 items-start hover:border-primary/20 transition-all group">
                        <span className="px-2 py-1 bg-surface-muted rounded font-mono text-[10px] font-bold shrink-0 group-hover:bg-primary group-hover:text-white transition-all">{f.weight}</span>
                        <div>
                           <h5 className="text-xs font-bold font-mono text-text">{f.name}</h5>
                           <p className="text-xs text-muted leading-tight mt-1">{f.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </Card>

              <Card title={t.sessions.devPayload} icon={Code2} className="shadow-sm">
                 <div className="mt-4 p-4 bg-bg-dark rounded-xl font-mono text-[9px] text-primary-dark overflow-auto max-h-80 border border-surface-muted-dark">
                    <pre>{JSON.stringify(developerPayload, null, 2)}</pre>
                 </div>
              </Card>
            </div>

            <div className={cn(
              "p-4 border-t",
              "bg-surface border-surface-muted"
            )}>
              <div className="flex gap-3">
                 <button className="flex-1 py-3 border border-surface-muted rounded-xl text-xs font-bold text-muted hover:bg-surface-muted transition-all">
                    {t.sessions.dismissRisk}
                 </button>
                 <button className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all">
                    {t.sessions.contactSupport}
                 </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const SessionsList = ({ t, theme }: { t: any, theme?: Theme }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    // Format to YYYY-MM-DD for input[type="date"]
    const formatDate = (date: Date) => {
      const d = new Date(date);
      let month = '' + (d.getMonth() + 1);
      let day = '' + d.getDate();
      const year = d.getFullYear();

      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;

      return [year, month, day].join('-');
    };

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const filteredSessions = mockSessions.filter(session => {
    const matchesSearch = session.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         session.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || session.risk === riskFilter;
    const matchesReason = reasonFilter === 'all' || session.reason.startsWith(reasonFilter);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(session.status);
    
    const sessionDate = session.fullDate;
    const matchesStartDate = !startDate || sessionDate >= startDate;
    const matchesEndDate = !endDate || sessionDate <= endDate;
    
    return matchesSearch && matchesRisk && matchesReason && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Mobile': return <Smartphone className="w-4 h-4" />;
      case 'Desktop': return <Monitor className="w-4 h-4" />;
      case 'Tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Abandoned': return <Badge variant="error">{t.common.abandoned}</Badge>;
      case 'Completed': return <Badge variant="success">{t.common.completed}</Badge>;
      case 'Active': return <Badge variant="warning">{t.common.active}</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'High': return <Badge variant="error" className="bg-opacity-5">{t.common.high}</Badge>;
      case 'Medium': return <Badge variant="warning" className="bg-opacity-5">{t.common.medium}</Badge>;
      case 'Low': return <Badge variant="success" className="bg-opacity-5">{t.common.low}</Badge>;
      default: return <Badge>N/A</Badge>;
    }
  };

  const selectedSession = mockSessions.find(s => s.id === selectedSessionId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SessionDrawer 
        session={selectedSession} 
        isOpen={!!selectedSessionId} 
        onClose={() => setSelectedSessionId(null)} 
        theme={theme} 
        t={t}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">{t.sessions.sessionsOverview}</h1>
          <p className="text-sm text-muted">{t.sessions.subtitle}</p>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-surface-muted-light transition-all">
             <Download className="w-4 h-4" />
             {t.common.exportCsv}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <Card className="p-4 flex items-center gap-4" noPadding>
            <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center">
               <Clock className="w-5 h-5 text-muted" />
            </div>
            <div>
               <p className="text-[10px] uppercase font-bold text-muted tracking-widest">{t.dashboard.totalSessions}</p>
               <p className="text-xl font-bold">2,450</p>
            </div>
         </Card>
         <Card className="p-4 flex items-center gap-4" noPadding>
            <div className="w-10 h-10 rounded-full bg-error bg-opacity-10 flex items-center justify-center">
               <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
               <p className="text-[10px] uppercase font-bold text-muted tracking-widest">{t.common.highRisk}</p>
               <p className="text-xl font-bold text-error">342</p>
            </div>
         </Card>
         {/* More KPI small cards if needed */}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className={cn("p-4 border-b flex flex-col md:flex-row gap-4 justify-between", "bg-surface-muted bg-opacity-30 border-surface-muted")}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.sessions.searchPlaceholder}
              className={cn("w-full pl-10 pr-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary text-sm", "border-surface-muted bg-surface")}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select 
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className={cn("px-3 py-2 border rounded-lg text-xs font-bold outline-none", "bg-surface border-surface-muted")}
            >
              <option value="all">{t.common.allRisks}</option>
              <option value="High">{t.common.high} {t.common.risk}</option>
              <option value="Medium">{t.common.medium} {t.common.risk}</option>
              <option value="Low">{t.common.low} {t.common.risk}</option>
            </select>

            <select 
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className={cn("px-3 py-2 border rounded-lg text-xs font-bold outline-none", "bg-surface border-surface-muted")}
            >
              <option value="all">{t.common.allReasons}</option>
              <option value="S1">{t.diagnosis.s1}</option>
              <option value="S2">{t.diagnosis.s2}</option>
              <option value="S3">{t.diagnosis.s3}</option>
              <option value="S4">{t.diagnosis.s4}</option>
              <option value="S5">{t.diagnosis.s5}</option>
              <option value="S6">{t.diagnosis.s6}</option>
              <option value="S7">{t.diagnosis.s7}</option>
            </select>

            <div className="flex bg-surface-muted p-1 rounded-xl gap-1">
              {['Abandoned', 'Active', 'Completed'].map((status) => {
                const isActive = selectedStatuses.includes(status);
                const label = status === 'Abandoned' ? t.common.abandoned : status === 'Active' ? t.common.active : t.common.completed;
                return (
                  <button
                    key={status}
                    onClick={() => {
                      setSelectedStatuses(prev => 
                        prev.includes(status) 
                          ? prev.filter(s => s !== status) 
                          : [...prev, status]
                      );
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      isActive 
                        ? "bg-surface text-primary shadow-sm" 
                        : "text-muted hover:text-text"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
              {selectedStatuses.length > 0 && (
                <button 
                  onClick={() => setSelectedStatuses([])}
                  className="px-2 text-muted hover:text-error transition-all"
                  title={t.common.allStatuses}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className={cn("flex items-center gap-2 border rounded-xl px-4 py-1.5 shadow-sm", "bg-surface border-surface-muted")}>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-muted leading-none mb-1">{t.common.startDate}</span>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent outline-none text-[11px] font-bold uppercase text-text w-24"
                    />
                  </div>
                  <div className="w-px h-6 bg-surface-muted mx-1" />
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-muted leading-none mb-1">{t.common.endDate}</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent outline-none text-[11px] font-bold uppercase text-text w-24"
                    />
                  </div>
                </div>
                {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="ml-2 p-1.5 hover:bg-surface-muted rounded-full transition-all text-muted"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              <div className="flex gap-1">
                <button 
                  onClick={() => setQuickRange(7)}
                  className="px-3 py-2 bg-surface-muted rounded-lg text-[10px] font-bold text-muted hover:text-primary transition-all"
                >
                  7D
                </button>
                <button 
                  onClick={() => setQuickRange(30)}
                  className="px-3 py-2 bg-surface-muted rounded-lg text-[10px] font-bold text-muted hover:text-primary transition-all"
                >
                  30D
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-surface-muted bg-opacity-50">
               <tr className={cn("text-[10px] uppercase font-bold text-muted tracking-widest border-b border-surface-muted")}>
                 <th className="px-6 py-4">{t.sessions.table.sessionId}</th>
                 <th className="px-6 py-4">{t.common.time}</th>
                 <th className="px-6 py-4 text-center">{t.common.device}</th>
                 <th className="px-6 py-4 text-right">{t.sessions.table.cartValue}</th>
                 <th className="px-6 py-4 text-center">{t.common.status}</th>
                 <th className="px-6 py-4 text-center">{t.sessions.table.riskScore}</th>
                 <th className="px-6 py-4">{t.sessions.table.reason}</th>
                 <th className="px-6 py-4 text-right">{t.common.actions}</th>
               </tr>
             </thead>
             <tbody className="text-sm">
               {filteredSessions.map((session) => (
                 <tr 
                   key={session.id} 
                   onClick={() => setSelectedSessionId(session.id)}
                   className="border-b border-surface-muted last:border-0 hover:bg-surface-muted transition-colors group cursor-pointer"
                 >
                    <td className="px-6 py-4 font-mono font-bold text-primary">{session.id}</td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="font-semibold text-text">{session.time}</span>
                          <span className="text-[10px] text-muted">{session.date}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-center gap-2">
                          {getDeviceIcon(session.device)}
                          <span className="text-xs text-muted">{session.device}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold tracking-tight text-text">{session.value}</td>
                    <td className="px-6 py-4 text-center">
                       {getStatusBadge(session.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex flex-col items-center gap-1">
                          <div className="w-full max-w-[60px] bg-surface-muted h-1.5 rounded-full overflow-hidden">
                             <div 
                               className={cn("h-full", session.risk === 'High' ? "bg-error" : "bg-warning")} 
                               style={{ width: `${session.probability * 100}%` }} 
                             />
                          </div>
                          {getRiskBadge(session.risk)}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs max-w-[150px] truncate text-muted">
                       {session.reason}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setSelectedSessionId(session.id); }}
                         className="p-2 hover:bg-primary hover:bg-opacity-10 rounded-lg transition-all text-primary"
                       >
                          <Eye className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); }}
                         className="p-2 hover:bg-surface-muted rounded-lg transition-all text-muted"
                       >
                          <MoreVertical className="w-4 h-4" />
                       </button>
                    </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-surface-muted flex items-center justify-between bg-surface-muted bg-opacity-30">
          <span className="text-xs text-muted font-medium">
            {t.common.showingEntries.replace('{start}', '1').replace('{end}', '10').replace('{total}', '2,450')}
          </span>
          <div className="flex gap-2">
             <button className="p-2 border border-surface-muted rounded-lg hover:bg-surface transition-all disabled:opacity-50" disabled>
                <ChevronLeft className="w-4 h-4 text-muted" />
             </button>
             <div className="flex gap-1 items-center px-4 font-bold text-sm">
                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white shadow-md">1</span>
                <span className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface transition-all cursor-pointer">2</span>
                <span className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface transition-all cursor-pointer">3</span>
                <span className="mx-1">...</span>
                <span className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface transition-all cursor-pointer">24</span>
             </div>
             <button className="p-2 border border-surface-muted rounded-lg hover:bg-surface transition-all">
                <ChevronRight className="w-4 h-4 text-muted" />
             </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
