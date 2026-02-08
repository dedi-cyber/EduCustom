
import React from 'react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange }) => {
  const navItems: { id: AppView; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large' },
    { id: 'library', label: 'Library', icon: 'fa-book' },
    { id: 'students', label: 'Students', icon: 'fa-users' },
    { id: 'settings', label: 'Settings', icon: 'fa-cog' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewChange('dashboard')}>
            <div className="bg-indigo-600 p-2 rounded-lg text-white hidden sm:block">
              <i className="fas fa-graduation-cap text-xl"></i>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">
                Edu<span className="text-indigo-600">Custom</span>
              </h1>
              <span className="text-[9px] md:text-[10px] text-slate-500 font-medium leading-tight mt-1 max-w-[180px] md:max-w-sm">
                Dikembangkan oleh: <span className="text-indigo-600 font-semibold">Dedi Efendi</span> (Pengawas Madrasah Kab. Agam & Tim Pengembang Kurikulum Kanwil Kemenag Sumbar)
              </span>
            </div>
          </div>
          
          <nav className="hidden md:flex gap-1 text-sm font-medium text-slate-600">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  activeView === item.id 
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <i className={`fas ${item.icon}`}></i>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
             <span className="hidden lg:inline-block text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold uppercase">PRO ACCOUNT</span>
             <img src="https://picsum.photos/seed/edu/40/40" className="w-9 h-9 rounded-full ring-2 ring-indigo-50" alt="Avatar" />
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t z-50 flex justify-around p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeView === item.id ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <i className={`fas ${item.icon}`}></i>
            <span className="text-[10px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-grow pb-20 md:pb-8">
        {children}
      </main>

      <footer className="bg-white border-t py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© 2026 EduCustom AI. Mentor Pedagogis Digital Anda.</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Sumatera Barat Innovation</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
