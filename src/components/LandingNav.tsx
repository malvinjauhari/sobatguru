import { Link } from 'react-router';

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">S</div>
        Sobat Guru
      </div>
      
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
        <a href="#" className="text-slate-900">Home</a>
        <a href="#fitur" className="hover:text-indigo-600 transition-colors">Fitur</a>
        <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          to="/app"
          className="px-5 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Masuk Dashboard
        </Link>
      </div>
    </nav>
  );
}
