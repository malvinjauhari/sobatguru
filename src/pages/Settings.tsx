import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Save, CheckCircle } from 'lucide-react';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    nama_guru: '',
    nip: '',
    sekolah: '',
    mapel: '',
    fase: '',
    kelas: '',
    nama_kepsek: '',
    nip_kepsek: '',
    kota: '',
  });
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        nama_guru: profile.nama_guru || '',
        nip: profile.nip || '',
        sekolah: profile.sekolah || '',
        mapel: profile.mapel || '',
        fase: profile.fase || '',
        kelas: profile.kelas || '',
        nama_kepsek: profile.nama_kepsek || '',
        nip_kepsek: profile.nip_kepsek || '',
        kota: profile.kota || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        nama_guru: formData.nama_guru,
        nip: formData.nip,
        sekolah: formData.sekolah,
        mapel: formData.mapel,
        fase: formData.fase,
        kelas: formData.kelas,
        nama_kepsek: formData.nama_kepsek,
        nip_kepsek: formData.nip_kepsek,
        kota: formData.kota,
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving profile", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pengaturan Profil</h1>
        <p className="mt-2 text-slate-600">Data ini akan digunakan sebagai informasi statis pada dokumen yang di-generate.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            
            <div className="sm:col-span-2">
              <label htmlFor="nama_guru" className="block text-sm font-medium text-slate-700">Nama Lengkap (beserta gelar)</label>
              <input
                type="text"
                name="nama_guru"
                id="nama_guru"
                value={formData.nama_guru}
                onChange={handleChange}
                className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Misal: Budi Santoso, S.Pd., M.Pd."
              />
            </div>

            <div>
              <label htmlFor="nip" className="block text-sm font-medium text-slate-700">NIP</label>
              <input
                type="text"
                name="nip"
                id="nip"
                value={formData.nip}
                onChange={handleChange}
                className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="sekolah" className="block text-sm font-medium text-slate-700">Nama Sekolah</label>
              <input
                type="text"
                name="sekolah"
                id="sekolah"
                value={formData.sekolah}
                onChange={handleChange}
                className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="SMA Negeri 1 Jakarta"
              />
            </div>

            <div>
              <label htmlFor="mapel" className="block text-sm font-medium text-slate-700">Mata Pelajaran</label>
              <input
                type="text"
                name="mapel"
                id="mapel"
                value={formData.mapel}
                onChange={handleChange}
                className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Sejarah"
              />
            </div>

            <div>
              <label htmlFor="fase" className="block text-sm font-medium text-slate-700">Fase</label>
              <select
                name="fase"
                id="fase"
                value={formData.fase}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Pilih Fase</option>
                <option value="E">Fase E</option>
                <option value="F">Fase F</option>
              </select>
            </div>

            <div>
              <label htmlFor="kelas" className="block text-sm font-medium text-slate-700">Kelas</label>
              <input
                type="text"
                name="kelas"
                id="kelas"
                value={formData.kelas}
                onChange={handleChange}
                className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Misal: X, XI, XII"
              />
            </div>

            <div className="sm:col-span-2 pt-4 mt-2 border-t border-slate-200">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Pengesahan (Kepala Sekolah & Lokasi)</h3>
            </div>

            <div>
              <label htmlFor="nama_kepsek" className="block text-sm font-medium text-slate-700">Nama Kepala Sekolah</label>
              <input
                type="text"
                name="nama_kepsek"
                id="nama_kepsek"
                value={formData.nama_kepsek}
                onChange={handleChange}
                className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="nip_kepsek" className="block text-sm font-medium text-slate-700">NIP Kepala Sekolah</label>
              <input
                type="text"
                name="nip_kepsek"
                id="nip_kepsek"
                value={formData.nip_kepsek}
                onChange={handleChange}
                className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="kota" className="block text-sm font-medium text-slate-700">Kota/Tempat Pengesahan</label>
              <input
                type="text"
                name="kota"
                id="kota"
                value={formData.kota}
                onChange={handleChange}
                className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Misal: Jakarta Pusat"
              />
            </div>

          </div>
        </div>
        
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end items-center">
          {saved && (
            <span className="text-emerald-600 text-sm font-medium flex items-center mr-4">
              <CheckCircle className="w-4 h-4 mr-1" /> Tersimpan
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : (
              <>
                <Save className="w-4 h-4 mr-2" /> Simpan Profil
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
