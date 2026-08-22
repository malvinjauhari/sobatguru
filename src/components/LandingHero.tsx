import { motion } from 'motion/react';
import { Link } from 'react-router';

export default function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="z-10 flex flex-col items-center max-w-4xl"
      >
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-100 bg-indigo-50 text-xs font-semibold text-indigo-600 mb-8 backdrop-blur-md">
          Platform Administrasi Guru #1
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
          Ubah beban administrasi <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            menjadi jauh lebih ringan.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Masukkan Capaian Pembelajaran, biarkan AI merancang ATP, PROTA, PROSEM, hingga Modul Ajar terstruktur secara otomatis.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/app"
            className="px-8 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
          >
            Mulai Generate Gratis
          </Link>
          <a href="#fitur" className="px-8 py-3 rounded-full bg-white text-slate-700 font-semibold border border-slate-200 hover:bg-slate-50 transition-colors duration-200 flex items-center gap-2 shadow-sm">
            Lihat Cara Kerjanya <span className="text-lg">→</span>
          </a>
        </div>
      </motion.div>

      {/* Mock UI component */}
      <motion.div
        initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        className="mt-16 w-full max-w-3xl border border-slate-200 rounded-2xl bg-white/80 backdrop-blur-xl p-6 shadow-xl relative z-10"
      >
        <div className="flex flex-col items-end gap-4">
           <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 px-4 py-3 rounded-2xl rounded-tr-sm self-end text-sm max-w-[80%] flex items-center gap-2 shadow-sm">
             <span className="text-indigo-600 animate-pulse text-xs">●●●</span>
             "Tolong buatkan Modul Ajar Sejarah Kelas XI, topik Proklamasi Kemerdekaan..."
           </div>
           
           <div className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl self-start text-sm w-full sm:w-[320px] flex items-center gap-3 shadow-sm">
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                 <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
              </div>
              Menyusun Tujuan Pembelajaran & Kegiatan Inti...
           </div>
        </div>
      </motion.div>
    </section>
  );
}
