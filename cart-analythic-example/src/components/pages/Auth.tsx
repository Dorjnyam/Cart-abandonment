import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Store, 
  ShieldCheck, 
  ChevronRight,
  Github,
  Facebook,
  CheckCircle2,
  Sun,
  Moon,
  ArrowLeft,
  Chrome
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export const AuthStyles = () => (
  <style>{`
    .auth-card {
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
    }
  `}</style>
);

const ThemeToggle = ({ theme, onToggleTheme }: { theme: any, onToggleTheme: () => void }) => (
  <button 
    onClick={onToggleTheme}
    className="fixed top-6 right-6 p-3 rounded-2xl bg-surface border border-surface-muted shadow-xl hover:scale-110 active:scale-95 transition-all z-50 text-text hover:text-primary"
    aria-label="Toggle Theme"
  >
    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-warning" />}
  </button>
);

export const Login = ({ t, theme, onToggleTheme, onLogin, onSwitchToSignup, onForgotPassword }: any) => {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed transition-colors duration-500">
      <AuthStyles />
      <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface rounded-[2.5rem] p-10 md:p-12 auth-card border border-surface-muted transition-colors duration-500"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30 -rotate-6 transform hover:rotate-0 transition-transform">
             <Store className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight mb-3 text-text">{t.login.title}</h1>
          <p className="text-muted text-base">{t.login.subtitle}</p>
        </div>

        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <div className="space-y-2">
             <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1 opacity-60">Email Address</label>
             <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  className="w-full pl-14 pr-5 py-4 bg-bg rounded-2xl outline-none border border-surface-muted focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium text-text"
                />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1 opacity-60">Password</label>
             <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-14 pr-5 py-4 bg-bg rounded-2xl outline-none border border-surface-muted focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium text-text"
                />
             </div>
          </div>

          <div className="flex items-center justify-between py-1 text-xs">
             <label className="flex items-center gap-3 cursor-pointer font-bold text-muted select-none">
                <input type="checkbox" className="w-5 h-5 rounded-lg border-surface-muted text-primary focus:ring-primary cursor-pointer" />
                Keep me signed in
             </label>
             <button type="button" onClick={onForgotPassword} className="text-primary font-extrabold hover:underline transition-colors">{t.login.forgotPassword}</button>
          </div>

          <button className="w-full py-4.5 bg-primary text-white rounded-2xl font-extrabold flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-base border border-transparent">
             {t.login.signIn}
             <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="relative my-10">
           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-muted opacity-50" /></div>
           <div className="relative flex justify-center text-[10px] uppercase font-black text-muted bg-surface px-6 tracking-[0.25em] opacity-60 transition-colors">Social Connect</div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button className="flex items-center justify-center py-4 border border-surface-muted rounded-2xl hover:bg-surface-muted transition-all group shadow-sm bg-surface">
             <Github className="w-5 h-5 group-hover:scale-110 transition-transform text-text" />
          </button>
          <button className="flex items-center justify-center py-4 border border-surface-muted rounded-2xl hover:bg-surface-muted transition-all group shadow-sm bg-surface">
             <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform text-[#1877F2]" />
          </button>
          <button className="flex items-center justify-center py-4 border border-surface-muted rounded-2xl hover:bg-surface-muted transition-all group shadow-sm bg-surface">
             <Chrome className="w-5 h-5 group-hover:scale-110 transition-transform text-[#4285F4]" />
          </button>
        </div>

        <p className="mt-10 text-center text-sm text-text-muted font-bold">
           New here? {' '}
           <button onClick={onSwitchToSignup} className="text-primary font-black hover:underline underline-offset-4">Create Account</button>
        </p>
      </motion.div>
    </div>
  );
};

export const Signup = ({ t, theme, onToggleTheme, onSwitchToLogin }: any) => {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed transition-colors duration-500">
      <AuthStyles />
      <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-surface rounded-[2.5rem] p-10 md:p-12 auth-card border border-surface-muted transition-colors duration-500"
      >
        <div className="mb-12">
          <h1 className="text-4xl font-display font-black tracking-tight mb-3 text-text">Join Workspace</h1>
          <p className="text-text-muted text-base">Start analyzing your store performance today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1 opacity-60">Store Name</label>
                 <input type="text" placeholder="e.g. Urban Gear" className="w-full px-5 py-4 bg-bg rounded-2xl outline-none border border-surface-muted focus:border-primary transition-all text-sm font-medium text-text" />
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1 opacity-60">Work Email</label>
                 <input type="email" placeholder="name@company.com" className="w-full px-5 py-4 bg-bg rounded-2xl outline-none border border-surface-muted focus:border-primary transition-all text-sm font-medium text-text" />
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1 opacity-60">Create Password</label>
                 <input type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-bg rounded-2xl outline-none border border-surface-muted focus:border-primary transition-all text-sm font-medium text-text" />
              </div>
           </div>

           <div className="space-y-6">
              <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1 mb-2 block opacity-60">Select Plan</label>
              <div className="space-y-3">
                {[
                  { id: 'basic', label: 'Starter', price: 'Free', desc: 'Up to 1k sessions' },
                  { id: 'pro', label: 'Pro Scale', price: '$49', desc: 'Up to 50k sessions' },
                  { id: 'ent', label: 'Enterprise', price: 'Custom', desc: 'Full scalability' },
                ].map((p) => (
                   <label key={p.id} className="block relative cursor-pointer group">
                      <input type="radio" name="plan" value={p.id} className="hidden peer" defaultChecked={p.id === 'pro'} />
                      <div className="flex items-center justify-between p-4.5 rounded-2xl border-2 border-surface-muted bg-bg group-hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary peer-checked:bg-opacity-5 transition-all transition-colors duration-300">
                         <div>
                            <p className="text-xs font-black text-text">{p.label}</p>
                            <p className="text-[10px] text-muted font-bold mt-0.5">{p.desc}</p>
                         </div>
                         <span className="text-xs font-black text-primary px-2 py-1 bg-surface rounded-lg shadow-sm">{p.price}</span>
                      </div>
                   </label>
                ))}
              </div>
           </div>
        </div>

        <div className="mt-12 flex items-center gap-4">
           <button onClick={onSwitchToLogin} className="px-8 py-4.5 rounded-2xl font-bold bg-bg hover:bg-surface-muted transition-all text-sm border border-surface-muted">
              Cancel
           </button>
           <button className="flex-1 py-4.5 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.01] transition-all text-base">
              Create Account
              <ChevronRight className="w-5 h-5" />
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export const ForgotPassword = ({ t, theme, onToggleTheme, onBackToLogin }: any) => {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed transition-colors duration-500 text-text">
      <AuthStyles />
      <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface rounded-[2.5rem] p-10 md:p-12 auth-card border border-surface-muted transition-colors duration-500"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-black tracking-tight mb-4 text-text">Recover Access</h1>
          <p className="text-text-muted text-base leading-relaxed">Enter your email and we'll send you a secure link to reset your password.</p>
        </div>

        {!sent ? (
          <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <div className="space-y-2">
               <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1 opacity-60">Your Email</label>
               <div className="relative group">
                 <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
                 <input 
                  type="email" 
                  required
                  placeholder="name@company.com" 
                  className="w-full pl-14 pr-5 py-4.5 bg-bg rounded-2xl outline-none border border-surface-muted focus:border-primary focus:bg-surface transition-all text-sm font-bold text-text" 
                 />
               </div>
            </div>
            <button className="w-full py-4.5 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 transition-all text-base hover:scale-[1.02] border border-transparent">
               Send Reset Link
               <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 py-6"
          >
             <div className="w-24 h-24 bg-success bg-opacity-10 rounded-full flex items-center justify-center mx-auto text-success border-4 border-success/20">
                <CheckCircle2 className="w-12 h-12 animate-pulse" />
             </div>
             <div className="space-y-3">
               <p className="text-xl font-black text-text">Check your inbox!</p>
               <p className="text-text-muted font-medium px-4">We've sent recovery instructions to your email address.</p>
             </div>
          </motion.div>
        )}

        <button onClick={onBackToLogin} className="w-full mt-10 text-sm font-black text-muted hover:text-primary transition-all flex items-center justify-center gap-2 group">
           <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
           Back to Login
        </button>
      </motion.div>
    </div>
  );
};

