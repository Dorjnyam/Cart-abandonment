import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Key, 
  Users as UsersIcon, 
  CreditCard, 
  Trash2, 
  ShieldAlert,
  Search,
  Plus
} from 'lucide-react';
import { Card, Badge } from '../ui/Common';
import { cn } from '../../lib/utils';
import { Theme } from '../../types';

export const Settings = ({ t, theme }: { t: any, theme?: Theme }) => {
  const [activeTab, setActiveTab] = useState('company');

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'api', label: 'Tracking & API Keys', icon: Key },
    { id: 'team', label: 'Team Members', icon: UsersIcon },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col gap-1">
         <h1 className="text-2xl font-display font-bold">Settings</h1>
         <p className="text-sm text-muted">Manage your organization and workspace preferences.</p>
      </div>

      <div className="flex border-b border-surface-muted-light gap-8 overflow-x-auto custom-scrollbar no-scrollbar scroll-smooth">
         {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 pb-4 text-sm font-bold transition-all shrink-0 relative",
                activeTab === tab.id ? "text-primary-light" : "text-muted hover:text-foreground"
              )}
            >
               <tab.icon className="w-4 h-4" />
               {tab.label}
               {activeTab === tab.id && (
                 <motion.div layoutId="settingTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-light" />
               )}
            </button>
         ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
         {activeTab === 'api' && (
            <Card title="Tracking & API Integration" subtitle="Manage your access keys for the observer API.">
               <div className="space-y-6">
                  <div className={cn("flex justify-between items-center p-4 rounded-xl border", theme === 'light' ? "bg-bg-light border-surface-muted-light" : "bg-bg-dark border-surface-muted-dark")}>
                     <div className="space-y-1">
                        <h4 className="text-sm font-bold">Production Secret Key</h4>
                        <p className="text-xs text-muted font-mono tracking-tight">sk_live_9a2...x82z</p>
                     </div>
                     <Badge variant="success">Active</Badge>
                  </div>
                  
                  <div className="p-6 bg-warning-light bg-opacity-5 border border-warning-light border-opacity-10 rounded-xl space-y-4">
                     <div className="flex items-start gap-4">
                        <ShieldAlert className="w-6 h-6 text-warning-light shrink-0" />
                        <div className="space-y-1">
                           <h4 className="text-sm font-bold">Security Advisory</h4>
                           <p className="text-xs text-muted leading-relaxed">
                              Your API keys grant full access to your store intelligence. Never commit them to version control or share them in client-side code.
                           </p>
                        </div>
                     </div>
                     <button className="px-4 py-2 bg-white border border-warning-light border-opacity-20 rounded-lg text-xs font-bold text-warning-light hover:bg-warning-light hover:bg-opacity-10 transition-all">
                        Rotate API Secret
                     </button>
                  </div>
               </div>
            </Card>
         )}

         {activeTab === 'team' && (
            <Card title="Workspace Members" icon={UsersIcon}>
               <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                     <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input type="text" placeholder="Search team..." className={cn("w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none", theme === 'light' ? "bg-bg-light border-surface-muted-light" : "bg-bg-dark border-surface-muted-dark")} />
                     </div>
                     <button className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg font-bold text-sm">
                        <Plus className="w-4 h-4" />
                        Invite Member
                     </button>
                  </div>

                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="text-[10px] uppercase font-bold text-muted border-b">
                              <th className="pb-4">Member</th>
                              <th className="pb-4">Role</th>
                              <th className="pb-4">Status</th>
                              <th className="pb-4 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="text-sm">
                           {[
                             { name: 'Doko MG', email: 'doko@cartanalytics.ai', role: 'Owner', status: 'Active' },
                             { name: 'Sarah Chen', email: 'sarah.c@company.com', role: 'Developer', status: 'Active' },
                             { name: 'Marcus Aurelius', email: 'm.aurelius@hist.io', role: 'Member', status: 'Invited' },
                           ].map((m, idx) => (
                             <tr key={idx} className="border-b last:border-0 border-surface-muted-light">
                                <td className="py-4">
                                   <div className="flex flex-col">
                                      <span className="font-bold">{m.name}</span>
                                      <span className="text-xs text-muted font-mono">{m.email}</span>
                                   </div>
                                </td>
                                <td className="py-4"><Badge variant="default" className="bg-bg-light">{m.role}</Badge></td>
                                <td className="py-4">
                                   <div className="flex items-center gap-2">
                                      <div className={cn("w-1.5 h-1.5 rounded-full", m.status === 'Active' ? 'bg-success-light' : 'bg-warning-light')} />
                                      <span className="text-xs font-medium">{m.status}</span>
                                   </div>
                                </td>
                                <td className="py-4 text-right">
                                   <button className="p-2 hover:bg-surface-muted-light rounded transition-all"><Trash2 className="w-4 h-4 text-muted" /></button>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </Card>
         )}

         {activeTab === 'company' && (
            <Card title="Organization Details">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-muted uppercase tracking-widest italic">Store Name</label>
                        <input type="text" defaultValue="Enterprise Storefront Alpha" className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary-light" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-muted uppercase tracking-widest italic">Company Email</label>
                        <input type="email" defaultValue="admin@company.com" className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary-light" />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-muted uppercase tracking-widest italic">Industry</label>
                        <select className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary-light bg-white">
                           <option>Apparel & Fashion</option>
                           <option>Electronics</option>
                           <option>Digital Goods</option>
                        </select>
                     </div>
                  </div>
               </div>
               <div className="mt-8 pt-8 border-t border-surface-muted-light flex justify-end gap-3">
                  <button className="px-6 py-2.5 rounded-xl font-bold bg-bg-light border hover:bg-surface-muted-light transition-all">Cancel</button>
                  <button className="px-6 py-2.5 rounded-xl font-bold bg-primary-light text-white shadow-lg shadow-primary-light/20 transition-all">Save Changes</button>
               </div>
            </Card>
         )}
      </div>
    </div>
  );
};
