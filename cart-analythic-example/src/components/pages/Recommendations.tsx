import React from 'react';
import { 
  Plus, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Card, Badge } from '../ui/Common';
import { cn } from '../../lib/utils';
import { Theme } from '../../types';

const mockRecommendations = [
  { id: '1', code: 'S1', title: 'Streamline Shipping Calculation', summary: 'Reduce abandonments during the shipping step by offering flat rates or upfront estimates.', impact: 'High', priority: 'High', status: 'new' },
  { id: '2', code: 'S2', title: 'Enable Guest Checkout', summary: 'Allow users to purchase without forced account creation. High correlation with mobile drop-offs.', impact: 'Critical', priority: 'High', status: 'in-progress' },
  { id: '3', code: 'S5', title: 'Optimize Payment Gateway Response', summary: 'Current gateway takes >2.5s to load. Optimization could reduce price sensitivity drop-offs.', impact: 'Medium', priority: 'Medium', status: 'done' },
  { id: '4', code: 'S4', title: 'Mobile UI Layout Refactor', summary: 'The "Checkout" button is below the fold on iPhone SE screens.', impact: 'Medium', priority: 'Low', status: 'dismissed' },
];

export const Recommendations = ({ t, theme }: { t: any, theme?: Theme }) => {
  const columns = [
    { id: 'new', label: 'New', icon: AlertCircle, color: 'text-primary-light' },
    { id: 'in-progress', label: 'In Progress', icon: Clock, color: 'text-warning-light' },
    { id: 'done', label: 'Done', icon: CheckCircle2, color: 'text-[#166534]' },
    { id: 'dismissed', label: 'Dismissed', icon: XCircle, color: 'text-muted' },
  ];

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return 'bg-error-light';
      case 'Medium': return 'bg-warning-light';
      case 'Low': return 'bg-secondary-light';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Recovery Recommendations</h1>
            <p className="text-sm text-muted">Recovery strategies based on checkout behavior and diagnosis results.</p>
         </div>
         <button className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg font-bold text-sm">
            <Plus className="w-4 h-4" />
            Add Manual Task
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
         {columns.map((col) => (
            <div key={col.id} className="flex flex-col gap-4">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                     <col.icon className={cn("w-4 h-4", col.color)} />
                     <span className="font-bold text-sm">{col.label}</span>
                     <span className="bg-surface-muted-light px-2 py-0.5 rounded-full text-[10px] font-bold text-muted">
                        {mockRecommendations.filter(r => r.status === col.id).length}
                     </span>
                  </div>
                  <button className="text-muted p-1 hover:bg-surface-muted-light rounded transition-all">
                     <MoreVertical className="w-4 h-4" />
                  </button>
               </div>

               <div className={cn(
                 "flex-1 rounded-xl p-2 space-y-3 bg-surface-muted-light bg-opacity-30 border border-surface-muted-light border-dashed",
                 col.id === 'new' && "border-primary-light border-opacity-20"
               )}>
                  {mockRecommendations.filter(r => r.status === col.id).map((rec) => (
                     <Card key={rec.id} className="p-4 cursor-grab active:cursor-grabbing border-opacity-50">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-1.5">
                              <Badge variant="primary" className="text-[9px] px-1.5 py-0.5">{rec.code}</Badge>
                              <div className={cn("w-1.5 h-1.5 rounded-full", getPriorityColor(rec.priority))} />
                           </div>
                           <div className="flex items-center gap-1 text-[8px] font-bold text-muted uppercase tracking-widest">
                               <Zap className="w-2.5 h-2.5 text-primary-light" />
                               Gemini
                           </div>
                        </div>
                        <h5 className="font-bold text-xs leading-tight">{rec.title}</h5>
                        <p className="text-[10px] text-muted mt-2 line-clamp-2 leading-relaxed">{rec.summary}</p>
                        
                        <div className="mt-4 flex items-center justify-between">
                           <div className="flex -space-x-2">
                              {[1, 2].map(u => (
                                 <div key={u} className="w-5 h-5 rounded-full border-2 border-white bg-surface-muted-light" />
                              ))}
                           </div>
                           <button className="group flex items-center gap-1 text-[9px] font-bold text-primary-light uppercase tracking-widest hover:underline">
                              Action 
                           </button>
                        </div>
                     </Card>
                  ))}
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};
