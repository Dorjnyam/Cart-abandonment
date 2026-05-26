import React, { useState } from 'react';
import { 
  Building2, 
  BarChart3, 
  Users, 
  Search, 
  MoreHorizontal, 
  ExternalLink,
  Lock,
  EyeOff
} from 'lucide-react';
import { Card, Badge } from '../ui/Common';
import { cn } from '../../lib/utils';
import { Theme } from '../../types';

export const AdminTenants = ({ t, theme }: { t: any, theme?: Theme }) => {
  const [search, setSearch] = useState('');

  const tenants = [
    { id: '1', store: 'Urban Gear', email: 'owner@urbangear.com', tier: 'Pro', status: 'Active', created: 'Oct 1, 2024', rate: '12%' },
    { id: '2', store: 'TechHub', email: 'contact@techhub.mn', tier: 'Enterprise', status: 'Active', created: 'Sep 24, 2024', rate: '8%' },
    { id: '3', store: 'Eco Fashion', email: 'info@eco.site', tier: 'Basic', status: 'Inactive', created: 'Aug 12, 2024', rate: '45%' },
    { id: '4', store: 'Modern Home', email: 'sales@mhome.io', tier: 'Pro', status: 'Active', created: 'July 30, 2024', rate: '22%' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center pb-4 border-b">
         <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Tenant Administration</h1>
            <p className="text-sm text-muted">Manage store accounts, billing tiers, and pipeline health.</p>
         </div>
         <button className="px-4 py-2 bg-surface-muted-light border rounded-lg text-sm font-bold flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Admin Lockdown
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-6 bg-primary-light bg-opacity-5 border-primary-light border-opacity-20">
            <div className="flex flex-col gap-2">
               <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Global Pipeline Health</span>
               <span className="text-3xl font-display font-extrabold text-primary-light">99.98%</span>
               <div className="flex items-center gap-2 mt-2">
                  <div className="h-1 flex-1 bg-surface-muted-light rounded-full overflow-hidden">
                     <div className="h-full bg-primary-light" style={{ width: '99.9%' }} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-light">Nominal</span>
               </div>
            </div>
         </Card>
         <Card className="p-6">
             <div className="flex flex-col gap-2">
               <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Active Storefronts</span>
               <span className="text-3xl font-display font-extrabold text-foreground">1,240</span>
               <span className="text-[10px] font-bold text-[#166534] bg-[#dcfce7] w-fit px-1.5 py-0.5 rounded">+12 this week</span>
            </div>
         </Card>
         <Card className="p-6">
             <div className="flex flex-col gap-2">
               <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Total MRR (Est)</span>
               <span className="text-3xl font-display font-extrabold text-foreground">$42.4k</span>
               <span className="text-[10px] font-bold text-primary-light">Projected Growth</span>
            </div>
         </Card>
      </div>

      <Card className="p-0">
         <div className="p-4 border-b border-surface-muted-light flex justify-between items-center">
            <div className="relative max-w-sm flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
               <input 
                 type="text" 
                 placeholder="Search by store or email..." 
                 className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-bg-light outline-none"
               />
            </div>
            <div className="flex gap-2">
               <Badge variant="default" className="cursor-pointer hover:bg-surface-muted-light">All</Badge>
               <Badge variant="success" className="cursor-pointer">Active</Badge>
               <Badge variant="error" className="cursor-pointer opacity-50">Suspended</Badge>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-bg-light text-[10px] uppercase font-bold text-muted border-b">
                  <tr>
                     <th className="px-6 py-4">Storefront</th>
                     <th className="px-6 py-4">Subscription</th>
                     <th className="px-6 py-4 text-center">Abandon Rate</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="text-sm">
                  {tenants.map((t, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-bg-light transition-colors">
                       <td className="px-6 py-4">
                          <div className="flex flex-col">
                             <span className="font-bold flex items-center gap-1">
                                {t.store}
                                <ExternalLink className="w-3 h-3 text-muted" />
                             </span>
                             <span className="text-[10px] text-muted font-mono">{t.email}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex flex-col">
                             <span className="font-semibold">{t.tier}</span>
                             <span className="text-[10px] text-muted">{t.created}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-center">
                          <div className="font-bold">{t.rate}</div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <div className={cn("w-2 h-2 rounded-full", t.status === 'Active' ? 'bg-success-light' : 'bg-muted')} />
                             <span className="font-medium">{t.status}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                             <button className="p-2 hover:bg-surface-muted-light rounded-lg transition-all"><EyeOff className="w-4 h-4 text-muted" /></button>
                             <button className="p-2 hover:bg-surface-muted-light rounded-lg transition-all"><MoreHorizontal className="w-4 h-4 text-muted" /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
};
