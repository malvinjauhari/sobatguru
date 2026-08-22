import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { loginWithGoogle } from '../lib/firebase';
import { BookOpen } from 'lucide-react';

export default function Login() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <BookOpen className="text-white w-8 h-8" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            Sobat Guru
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Generator Dokumen Administrasi Guru Cerdas
          </p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-base font-medium text-slate-700 hover:bg-slate-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="w-5 h-5 mr-3" />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
