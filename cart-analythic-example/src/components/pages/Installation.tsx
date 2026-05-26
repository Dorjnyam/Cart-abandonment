import React from 'react';
import { 
  Terminal, 
  CheckCircle2, 
  Copy, 
  Settings, 
  Shield, 
  Code, 
  Share2,
  ExternalLink,
  Zap
} from 'lucide-react';
import { Card, Badge } from '../ui/Common';
import { cn } from '../../lib/utils';
import { Theme } from '../../types';

export const Installation = ({ t, theme }: { t: any, theme?: Theme }) => {
  const codeSnippet = `<!-- CartAnalytics Observer Snippet -->
<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'ca.start':
  new Date().getTime(),event:'ca.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='caData'?'&l='+l:'';j.async=true;
  j.src='https://cdn.cartanalytics.com/v1/observer.js?id='+i+dl;
  f.parentNode.insertBefore(j,f);
  })(window,document,'script','caData','CA-8291-X');
</script>`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
         <div className="w-16 h-16 bg-primary-light bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Terminal className="text-primary-light w-8 h-8" />
         </div>
         <h1 className="text-3xl font-display font-extrabold tracking-tight">Installation & Setup</h1>
         <p className="text-muted text-lg">Connect your storefront to start receiving intelligence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { step: '1', title: 'Generate API Key', status: 'done', icon: Shield },
           { step: '2', title: 'Install Observer', status: 'current', icon: Code },
           { step: '3', title: 'Verify Events', status: 'pending', icon: Zap },
         ].map((s) => (
           <Card key={s.step} className={cn(
             "p-4 text-center border-2",
             s.status === 'current' ? "border-primary-light bg-primary-light bg-opacity-5" : "border-transparent"
           )} noPadding>
              <div className="flex flex-col items-center gap-2">
                 <div className={cn(
                   "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                   s.status === 'done' ? "bg-success-light text-white" : s.status === 'current' ? "bg-primary-light text-white" : "bg-bg-light"
                 )}>
                    {s.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                 </div>
                 <span className="font-bold text-sm tracking-tight">{s.title}</span>
              </div>
           </Card>
         ))}
      </div>

      <Card title="Install Observer Snippet" subtitle="Paste this code into the <head> of your website.">
         <div className="relative group">
            <pre className="bg-[#0E1110] text-[#86D9A7] p-6 rounded-xl font-mono text-[12px] leading-relaxed overflow-x-auto border border-white/10">
               <code>{codeSnippet}</code>
            </pre>
            <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-md">
               <Copy className="w-4 h-4" />
            </button>
         </div>
         <div className="mt-6 flex items-center gap-4 p-4 bg-muted bg-opacity-10 rounded-xl">
            <Settings className="w-6 h-6 text-muted shrink-0" />
            <div className="space-y-1">
               <h4 className="text-xs font-bold">Observer Endpoint Configuration</h4>
               <p className="text-[10px] text-muted leading-relaxed">
                  Traffic is routed through our global edge network. Your unique endpoint is <span className="font-mono bg-bg-light px-1">https://ingest.cartanalytics.com/v1/evt/8291x</span>
               </p>
            </div>
         </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card title="Quick Test Storefront" icon={ExternalLink}>
            <p className="text-xs text-muted leading-relaxed mb-6">
               Need to verify your setup before deploying to production? Use our playground environment to simulate checkout events.
            </p>
            <div className="flex gap-3">
               <button className={cn("flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2", theme === 'light' ? "bg-bg-light hover:bg-surface-muted-light" : "bg-surface-muted-dark hover:bg-opacity-80 border border-surface-muted-dark")}>
                  Launch Demo Store
                  <ExternalLink className="w-4 h-4" />
               </button>
               <button className={cn("flex-1 py-3 rounded-xl font-bold text-xs transition-all", theme === 'light' ? "bg-bg-light hover:bg-surface-muted-light" : "bg-surface-muted-dark hover:bg-opacity-80 border border-surface-muted-dark")}>
                  Documentation
               </button>
            </div>
         </Card>

         <Card title="Recent Storefront Events">
             <div className="space-y-4">
                {[
                  { event: 'page_view', time: '2s ago', status: 'success' },
                  { event: 'cart_add', time: '14s ago', status: 'success' },
                  { event: 'checkout_start', time: '45s ago', status: 'success' },
                  { event: 'payment_step', time: '1m ago', status: 'error' },
                ].map((e, idx) => (
                   <div key={idx} className="flex items-center justify-between py-2 border-b border-surface-muted-light last:border-0">
                      <div className="flex items-center gap-3">
                         <div className={cn("w-2 h-2 rounded-full", e.status === 'success' ? "bg-success-light" : "bg-error-light")} />
                         <span className="font-mono text-[10px] tracking-tight">{e.event}</span>
                      </div>
                      <span className="text-[10px] text-muted">{e.time}</span>
                   </div>
                ))}
             </div>
             <button className="w-full mt-4 py-2 border border-dashed rounded-lg text-[10px] uppercase font-bold tracking-widest text-muted hover:bg-bg-light transition-all">
                Live Pipeline Monitor
             </button>
         </Card>
      </div>
    </div>
  );
};
