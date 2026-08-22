import { Link, useLocation } from 'react-router';
import { Home, FileText, Settings, LogOut, X } from 'lucide-react';
import { logout } from '../lib/firebase';

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/app', icon: Home },
    { name: 'Generate Dokumen', path: '/app/generate', icon: FileText },
    { name: 'Settings', path: '/app/settings', icon: Settings },
  ];

  return (
    <aside className={`w-64 bg-slate-900 text-white flex flex-col h-screen fixed top-0 left-0 z-30 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Sobat Guru</h1>
          <p className="text-sm text-slate-400 mt-1">AI Administrasi</p>
        </div>
        <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
          <X size={24} />
        </button>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 w-full text-left text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
