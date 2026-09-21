import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Database, GraduationCap, ShieldCheck, Languages, LogOut } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

export default function Layout() {
  const { t, lang, toggle } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();

  const nav = [
    { to: '/', label: t('nav_dashboard'), icon: LayoutDashboard },
    { to: '/checklist', label: t('nav_checklist'), icon: ListChecks },
    { to: '/migration', label: t('nav_migration'), icon: Database },
    { to: '/training', label: t('nav_training'), icon: GraduationCap },
  ];

  const handleLogout = () => logout();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-blue-900 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">{t('appName')}</p>
            <p className="text-[11px] font-medium text-slate-400">{t('tagline')}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
              {(user?.full_name || user?.email || 'CL')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-semibold text-slate-800">{user?.full_name || 'Client User'}</p>
              <p className="truncate text-[11px] text-slate-400">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('signOut')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-5 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">{t('appName')}</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-slate-900">
              {nav.find((n) => n.to === (location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`))?.label || t('nav_dashboard')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5">
              <button
                onClick={() => lang !== 'en' && toggle()}
                className={cn('rounded-full px-3 py-1 text-xs font-semibold transition-colors', lang === 'en' ? 'bg-slate-900 text-white' : 'text-slate-500')}
              >
                EN
              </button>
              <button
                onClick={() => lang !== 'es' && toggle()}
                className={cn('rounded-full px-3 py-1 text-xs font-semibold transition-colors', lang === 'es' ? 'bg-slate-900 text-white' : 'text-slate-500')}
              >
                ES
              </button>
            </div>
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Languages className="h-3.5 w-3.5" />
              {lang.toUpperCase()}
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium',
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  )
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}