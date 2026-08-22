import { useAuth } from '../context/AuthContext';
import { Menu } from 'lucide-react';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{user?.displayName}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
        )}
      </div>
    </header>
  );
}
