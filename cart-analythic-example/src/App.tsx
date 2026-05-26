/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Clock, 
  Activity, 
  GitCompare,
  Lightbulb, 
  GitBranch, 
  Terminal, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  User as UserIcon, 
  FileText, 
  HelpCircle, 
  LogOut,
  Moon,
  Sun,
  Languages,
  Search,
  Bell,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { translations, Language } from './lib/translations';
import { Theme, PageId, User } from './types';

// Mock Pages (to be implemented in detail later or as components)
import { Overview } from './components/pages/Overview';
import { Analytics } from './components/pages/Analytics';
import { SessionsList } from './components/pages/Sessions';
import { Diagnosis } from './components/pages/Diagnosis';
import { Recommendations } from './components/pages/Recommendations';
import { Pipeline } from './components/pages/Pipeline';
import { Installation } from './components/pages/Installation';
import { Settings } from './components/pages/Settings';
import { AdminTenants } from './components/pages/Admin';
import { AblationStudy } from './components/pages/Ablation';
import { Login, Signup, ForgotPassword } from './components/pages/Auth';
import { Card } from './components/ui/Common';

const Profile = ({ t, theme }: { t: any, theme?: Theme }) => (
  <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
     <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-white text-3xl font-extrabold shadow-xl">MG</div>
        <div className="text-center">
           <h2 className="text-2xl font-display font-extrabold">Doko MG</h2>
           <p className="text-muted">mgldoko24@gmail.com</p>
           <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-primary bg-opacity-10 text-primary rounded-full text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.profile.owner}
           </div>
        </div>
     </div>
     <Card title={t.profile.updateAvatar} subtitle={t.profile.updateAvatarSubtitle}>
        <div className="flex gap-4 items-center">
           <div className="w-16 h-16 rounded-xl border-2 border-dashed border-surface-muted flex items-center justify-center text-muted cursor-pointer hover:bg-bg">
              <UserIcon className="w-8 h-8" />
           </div>
           <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold">{t.profile.uploadPhoto}</button>
        </div>
     </Card>
     <Card title={t.profile.resetPassword}>
        <div className="space-y-4">
           <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase">{t.profile.currentPassword}</label>
              <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-surface-muted rounded-xl bg-surface" />
           </div>
           <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase">{t.profile.newPassword}</label>
              <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-surface-muted rounded-xl bg-surface" />
           </div>
           <button className="w-full py-3 bg-surface-muted border border-surface-muted rounded-xl text-xs font-bold hover:bg-opacity-80 transition-all">{t.profile.updateAccess}</button>
        </div>
     </Card>
  </div>
);

export default function App() {
  const [theme, setTheme] = useState<Theme>('light');
  const [lang, setLang] = useState<Language>('EN');
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | 'forgot'>('login');

  const t = useMemo(() => translations[lang], [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'EN' ? 'MN' : 'EN');

  const navItems = [
    { id: 'overview', label: t.nav.overview, icon: LayoutDashboard },
    { id: 'analytics', label: t.nav.analytics, icon: BarChart3 },
    { id: 'sessions', label: t.nav.sessions, icon: Clock },
    { id: 'diagnosis', label: t.nav.diagnosis, icon: Activity },
    { id: 'recommendations', label: t.nav.recommendations, icon: Lightbulb },
    { id: 'pipeline', label: t.nav.livePipeline, icon: GitBranch },
    { id: 'installation', label: t.nav.installation, icon: Terminal },
    { id: 'settings', label: t.nav.settings, icon: SettingsIcon },
    { id: 'ablation', label: t.nav.ablation, icon: GitCompare },
    { id: 'admin', label: t.nav.admin, icon: ShieldCheck },
  ];

  const secondaryNavItems = [
    { id: 'profile', label: t.nav.profile, icon: UserIcon },
    { id: 'documentation', label: t.nav.documentation, icon: FileText },
    { id: 'help', label: t.nav.help, icon: HelpCircle },
  ];

  const renderPage = () => {
    switch(activePage) {
      case 'overview': return <Overview t={t} theme={theme} onNavigate={setActivePage} />;
      case 'analytics': return <Analytics t={t} theme={theme} />;
      case 'sessions': return <SessionsList t={t} theme={theme} />;
      case 'diagnosis': return <Diagnosis t={t} theme={theme} />;
      case 'recommendations': return <Recommendations t={t} theme={theme} />;
      case 'pipeline': return <Pipeline t={t} theme={theme} />;
      case 'installation': return <Installation t={t} theme={theme} />;
      case 'settings': return <Settings t={t} theme={theme} />;
      case 'admin': return <AdminTenants t={t} theme={theme} />;
      case 'ablation': return <AblationStudy t={t} theme={theme} />;
      case 'profile': return <Profile t={t} theme={theme} />;
      default: return <div className="p-8 text-center text-muted">Page under development: {activePage}</div>;
    }
  };

  if (!isAuthenticated) {
    if (authScreen === 'signup') {
       return <Signup t={t} theme={theme} onToggleTheme={toggleTheme} onSwitchToLogin={() => setAuthScreen('login')} />;
    }
    if (authScreen === 'forgot') {
       return <ForgotPassword t={t} theme={theme} onToggleTheme={toggleTheme} onBackToLogin={() => setAuthScreen('login')} />;
    }
    return (
      <Login 
        t={t} 
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogin={() => setIsAuthenticated(true)} 
        onSwitchToSignup={() => setAuthScreen('signup')} 
        onForgotPassword={() => setAuthScreen('forgot')}
      />
    );
  }

  return (
    <div className="min-h-screen flex transition-colors duration-300 bg-bg text-text">
      {/* Sidebar - Desktop */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="hidden md:flex flex-col border-r sticky top-0 h-screen z-40 transition-colors bg-surface border-surface-muted"
      >
        <div className="p-6 flex items-center justify-between overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <BarChart3 className="text-white w-5 h-5" />
             </div>
             {isSidebarOpen && <span className="font-display font-extrabold text-xl tracking-tight">Cart Analytics</span>}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 text-muted hover:text-text">
             <Menu className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar pt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as PageId)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group overflow-hidden whitespace-nowrap",
                activePage === item.id 
                   ? "bg-primary bg-opacity-10 text-primary shadow-sm"
                  : "hover:bg-surface-muted text-muted"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", activePage === item.id ? "text-primary" : "text-muted")} />
              {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
            </button>
          ))}
          
          <div className="pt-6 pb-2 px-3">
             <div className="h-px bg-surface-muted w-full" />
          </div>
          
          {secondaryNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as PageId)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-muted hover:bg-surface-muted overflow-hidden whitespace-nowrap",
                activePage === item.id && "bg-surface-muted text-primary"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-muted">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-error hover:bg-error hover:bg-opacity-10 transition-all overflow-hidden whitespace-nowrap"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{t.nav.signOut}</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b flex items-center justify-between px-4 md:px-8 shrink-0 z-30 transition-colors bg-surface border-surface-muted">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2">
                <Menu className="w-6 h-6 text-foreground" />
             </button>
             <div className="hidden md:flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest italic">
                <span>CartAnalytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground not-italic">{t.nav[activePage as keyof typeof t.nav] || activePage}</span>
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input 
                type="text" 
                placeholder={t.common.search}
                className={cn(
                  "pl-10 pr-4 py-2 rounded-xl text-sm w-64 border outline-none transition-all",
                  "border-surface-muted bg-bg focus:ring-4 focus:ring-primary focus:ring-opacity-5"
                )}
              />
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={toggleLang}
                className="px-2 py-1.5 rounded-xl hover:bg-surface-muted transition-colors text-xs font-extrabold flex items-center gap-1.5"
              >
                <Languages className="w-4 h-4 text-primary" />
                <span className="w-5 inline-block text-text">{lang}</span>
              </button>
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-surface-muted transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon className="w-4 h-4 text-text" /> : <Sun className="w-4 h-4 text-text" />}
              </button>
              <div className="h-6 w-px bg-surface-muted mx-1 hidden sm:block"></div>
              <button className="p-2 rounded-xl hover:bg-surface-muted transition-colors relative">
                <Bell className="w-4 h-4 text-text" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-error rounded-full" />
              </button>
            </div>

            <div className="flex items-center gap-3 pl-2 cursor-pointer group" onClick={() => setActivePage('profile')}>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-extrabold leading-none truncate max-w-[100px] text-text">Doko MG</p>
                <p className="text-[10px] text-muted mt-1 uppercase font-bold tracking-widest italic opacity-60">Admin</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-white font-extrabold text-sm shadow-md group-hover:scale-105 transition-all">
                MG
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage + lang + theme}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'circOut' }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-bg-dark/80 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-xs z-[60] p-8 flex flex-col md:hidden transition-colors bg-surface"
            >
              <div className="flex items-center justify-between mb-10">
                <span className="font-display font-extrabold text-2xl tracking-tighter">CartAnalytics</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                {navItems.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => { setActivePage(item.id as PageId); setIsMobileMenuOpen(false); }}
                      className={cn(
                        "flex items-center gap-4 w-full p-3 rounded-2xl text-left transition-all",
                        activePage === item.id ? "bg-primary bg-opacity-10 text-primary" : "text-muted"
                      )}
                    >
                    <item.icon className="w-6 h-6" />
                    <span className="font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="pt-8 mt-8 border-t border-surface-muted">
                 <button className="flex items-center gap-4 text-error font-bold" onClick={() => setIsAuthenticated(false)}>
                    <LogOut className="w-6 h-6" />
                    {t.nav.signOut}
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


