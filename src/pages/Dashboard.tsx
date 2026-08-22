import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DocumentData } from '../types';
import { FileText, Plus, Clock } from 'lucide-react';
import { Link } from 'react-router';

export default function Dashboard() {
  const { profile } = useAuth();
  const [recentDocs, setRecentDocs] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      if (!profile?.uid) return;
      
      try {
        const q = query(
          collection(db, 'documents'),
          where('userId', '==', profile.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DocumentData[];
        
        setRecentDocs(docs);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocs();
  }, [profile?.uid]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Selamat Datang, {profile?.nama_guru || profile?.displayName}!</h1>
        <p className="mt-2 text-slate-600 font-medium">Platform Generator Dokumen Administrasi Kurikulum Merdeka.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'ATP', desc: 'Alur Tujuan Pembelajaran', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { title: 'PROTA', desc: 'Program Tahunan', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { title: 'PROSEM', desc: 'Program Semester', color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { title: 'MODUL AJAR', desc: 'Modul Ajar Lengkap', color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { title: 'RPP', desc: 'Rencana Pelaksanaan Pembelajaran', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        ].map((item) => (
          <Link 
            key={item.title} 
            to={`/app/generate?type=${item.title}`}
            className={`border rounded-xl p-6 transition-transform hover:-translate-y-1 hover:shadow-lg ${item.color} flex flex-col items-start`}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/60 mb-4 shadow-sm">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">{item.title}</h3>
            <p className="text-sm opacity-80 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-slate-500" />
            Dokumen Terbaru
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data...</div>
        ) : recentDocs.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <FileText className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">Belum ada dokumen</p>
            <p className="text-sm mt-1">Mulai buat dokumen pertamamu.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentDocs.map((doc) => (
              <li key={doc.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{doc.type}</p>
                    <p className="text-sm text-slate-500">{new Date(doc.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <Link to={`/app/doc/${doc.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-50 transition-colors">
                  Lihat Detail
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
