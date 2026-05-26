import React from 'react';
import { 
  Activity, 
  Database, 
  Server, 
  Cpu, 
  HardDrive, 
  Zap, 
  AlertTriangle, 
  CheckCircle2,
  List
} from 'lucide-react';
import { Card, Badge } from '../ui/Common';
import { cn } from '../../lib/utils';
import { Theme } from '../../types';

export const Pipeline = ({ t, theme }: { t: any, theme?: Theme }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Pipeline Monitor</h1>
            <p className="text-sm text-muted">Real-time infrastructure and data processing health.</p>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className={cn("w-2 h-2 rounded-full animate-pulse", theme === 'light' ? "bg-success-light" : "bg-primary-dark")} />
               <span className={cn("text-xs font-bold uppercase tracking-widest", theme === 'light' ? "text-success-light" : "text-primary-dark")}>System Online</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { title: 'Event Ingestion', value: '45.2k', sub: 'events/min', icon: Zap, status: 'normal' },
           { title: 'ML Predictions', value: '12.8k', sub: 'inferences/min', icon: Cpu, status: 'normal' },
           { title: 'Consumer Lag', value: '12ms', sub: 'latency', icon: Activity, status: 'fast' },
           { title: 'API Failures', value: '0.01%', sub: 'error rate', icon: AlertTriangle, status: 'good' },
         ].map((m, idx) => (
           <Card key={idx} className="p-6 relative overflow-hidden" noPadding>
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-[10px] uppercase font-bold text-muted tracking-widest mb-1">{m.title}</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-3xl font-display font-extrabold">{m.value}</span>
                       <span className="text-xs text-muted font-bold">{m.sub}</span>
                    </div>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-surface-muted-light dark:bg-surface-muted-dark flex items-center justify-center">
                    <m.icon className="w-5 h-5 text-muted" />
                 </div>
              </div>
              <div className={cn(
                "absolute bottom-0 left-0 h-1 w-full",
                m.status === 'normal' ? "bg-primary-light" : m.status === 'fast' ? "bg-[#166534]" : "bg-warning-light"
              )} />
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2" title="Service Health Matrix">
            <div className="overflow-x-auto mt-4">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-[10px] uppercase font-bold text-muted tracking-widest border-b">
                        <th className="pb-4">Service Name</th>
                        <th className="pb-4">Endpoint</th>
                        <th className="pb-4">Uptime</th>
                        <th className="pb-4">Load</th>
                        <th className="pb-4 text-right">Status</th>
                     </tr>
                  </thead>
                  <tbody className="text-xs">
                     {[
                       { name: 'Observer Edge', url: 'ingest-v1.cart.io', uptime: '99.99%', load: '14%', status: 'Healthy' },
                       { name: 'ML Classifier', url: 'ml-inference:8080', uptime: '99.98%', load: '62%', status: 'Heavy' },
                       { name: 'Redis Cache', url: 'cache.internal', uptime: '100%', load: '8%', status: 'Healthy' },
                       { name: 'Kafka Cluster', url: 'broker.cluster', uptime: '99.95%', load: '28%', status: 'Healthy' },
                     ].map((s, idx) => (
                        <tr key={idx} className="border-b border-surface-muted-light dark:border-surface-muted-dark last:border-0 hover:bg-opacity-10 transition-colors">
                           <td className="py-4 font-bold">{s.name}</td>
                           <td className="py-4 font-mono text-[10px] text-muted">{s.url}</td>
                           <td className="py-4">{s.uptime}</td>
                           <td className="py-4">
                              <div className="w-24 bg-surface-muted-light dark:bg-surface-muted-dark h-1.5 rounded-full overflow-hidden">
                                 <div className="bg-primary-light dark:bg-primary-dark h-full" style={{ width: s.load }} />
                              </div>
                           </td>
                           <td className="py-4 text-right">
                              <Badge variant={s.status === 'Heavy' ? 'warning' : 'success'}>{s.status}</Badge>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </Card>

         <Card title="Latest System Logs" icon={List}>
            <div className="space-y-4 mt-4">
                {[
                 { type: 'Info', msg: 'Model retraining started', time: '2m ago' },
                 { type: 'Warn', msg: 'Redis usage exceeded 80%', time: '14m ago' },
                 { type: 'Info', msg: 'New tenant registered: CA-9921', time: '1h ago' },
                 { type: 'Err', msg: 'Callback timeout SES-8812', time: '2h ago' },
               ].map((l, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-3 bg-surface-muted-light dark:bg-surface-muted-dark bg-opacity-30 rounded-lg border border-surface-muted-light dark:border-surface-muted-dark">
                     <div className={cn(
                       "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                       l.type === 'Err' ? "text-error-light" : l.type === 'Warn' ? "text-warning-light" : "text-primary-light"
                     )} />
                     <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-bold uppercase tracking-widest">{l.type}</span>
                           <span className="text-[10px] text-muted">{l.time}</span>
                        </div>
                        <p className="text-[11px] font-medium leading-tight font-mono">{l.msg}</p>
                     </div>
                  </div>
               ))}
            </div>
            <button className="w-full mt-6 py-2 text-xs font-bold bg-surface-muted-light rounded-lg hover:bg-opacity-80 transition-all">
               View Full Logs
            </button>
         </Card>
      </div>
    </div>
  );
};
