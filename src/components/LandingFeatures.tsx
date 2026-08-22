import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { Layers, FileText, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';

const FadeInScroll = ({ children, delay = 0, className = "" }: { children: ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, ease: 'easeOut', delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function LandingFeatures() {
  return (
    <div id="fitur" className="flex flex-col gap-32 py-24 px-4 max-w-7xl mx-auto">
      {/* Introduction Section */}
      <section className="flex flex-col items-center text-center max-w-4xl mx-auto">
        <FadeInScroll>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Bikin Modul Ajar sering bikin pusing <br />
            <span className="text-slate-500">bukan karena malas.</span>
          </h2>
        </FadeInScroll>
        
        <FadeInScroll delay={0.1} className="flex flex-wrap justify-center gap-3 my-8">
          {["Format Kurikulum Gonta-Ganti", "Terlalu banyak kolom tabel", "Buntu cari ide kegiatan pemantik", "Administrasi menumpuk"].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm shadow-sm">
              <span className="text-red-500 font-bold">×</span> {badge}
            </div>
          ))}
        </FadeInScroll>

        <FadeInScroll delay={0.2}>
          <h3 className="text-2xl md:text-3xl font-semibold text-slate-700 mt-4">
            Sobat Guru mengubah kerumitan kurikulum <br className="hidden md:block" />
            menjadi sistem dokumen otomatis.
          </h3>
        </FadeInScroll>
      </section>

      {/* Feature 1: Context-Aware Generation */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <FadeInScroll>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Satu kali input CP. <br />
            <span className="text-indigo-600">Biarkan AI merangkai sisanya.</span>
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            AI kami bukan sekadar pembuat teks generik. Ia secara cerdas mewariskan konteks Fase, Kelas, dan Capaian Pembelajaran (CP) ke seluruh dokumen secara hirarkis.
          </p>
        </FadeInScroll>
        <FadeInScroll delay={0.2} className="relative">
          <div className="absolute -inset-10 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative border border-slate-200 rounded-2xl bg-white p-6 shadow-xl">
             <div className="flex flex-col gap-4">
               <div className="bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl w-full text-sm">
                 <div className="text-xs text-slate-500 mb-1">Capaian Pembelajaran (CP)</div>
                 Pada akhir Fase F, peserta didik di Kelas XI mampu memahami sejarah proklamasi...
               </div>
               <div className="flex flex-col items-center">
                  <div className="h-6 w-px bg-slate-300"></div>
                  <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs text-slate-500 bg-white z-10">↓</div>
                  <div className="h-6 w-px bg-slate-300"></div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex flex-col gap-1 items-center justify-center text-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-900">Generate ATP</span>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex flex-col gap-1 items-center justify-center text-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-900">Generate PROTA</span>
                  </div>
               </div>
             </div>
          </div>
        </FadeInScroll>
      </section>

      {/* Feature 2: Modul Ajar Otomatis */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center flex-col-reverse lg:flex-row">
        <FadeInScroll className="relative order-last lg:order-first">
           <div className="absolute -inset-10 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
           <div className="relative border border-slate-200 rounded-2xl bg-white p-6 shadow-xl overflow-hidden text-sm">
              <div className="bg-slate-50 rounded p-4 text-slate-800 border border-slate-200 shadow-sm">
                 <h4 className="font-bold text-center border-b border-slate-300 pb-2 mb-2">MODUL AJAR BAB 1</h4>
                 <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-bold bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm inline-block mb-1">A. Tujuan Pembelajaran</span>
                      <ul className="list-disc pl-4 mt-1"><li>Peserta didik mampu mengidentifikasi...</li></ul>
                    </div>
                    <div>
                      <span className="font-bold bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm inline-block mb-1">B. Kegiatan Inti</span>
                      <p className="mt-1">Guru memandu siswa berdiskusi mengenai naskah proklamasi...</p>
                    </div>
                    <div>
                      <span className="font-bold bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm inline-block mb-1">C. Kisi-kisi Soal</span>
                      <table className="w-full mt-1 border border-slate-300 bg-white">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300"><th className="border-r border-slate-300 p-1 text-left">Indikator</th><th className="p-1 text-left">No. Soal</th></tr>
                        </thead>
                        <tbody>
                          <tr><td className="border-r border-slate-300 p-1">Disajikan ilustrasi...</td><td className="p-1">1/PG</td></tr>
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
           </div>
        </FadeInScroll>
        <FadeInScroll delay={0.2}>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-6">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Modul Ajar lengkap <br />
            <span className="text-purple-600">dengan LKPD & Rubrik.</span>
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            Dapatkan Modul Ajar komprehensif mulai dari Informasi Umum, Kegiatan Inti (Pendahuluan, Inti, Penutup per pertemuan), hingga Lampiran.
          </p>
          <ul className="space-y-3">
            {[
              "Tabel Kisi-kisi Soal Otomatis",
              "Pemahaman Bermakna & Pertanyaan Pemantik",
              "LKPD, Glosarium & Daftar Pustaka"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                {item}
              </li>
            ))}
          </ul>
        </FadeInScroll>
      </section>

      {/* Feature 3: No Hallucination */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-16">
        <FadeInScroll>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Referensi dari Anda, <br />
            <span className="text-emerald-600">Kreasi dari AI.</span>
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Zero Hallucination. AI kami mematuhi pedoman ketat untuk tidak mengarang buku fiktif atau URL sitasi palsu. Kegiatan pembelajaran murni dirancang berdasarkan referensi yang Anda berikan.
          </p>
        </FadeInScroll>
        <FadeInScroll delay={0.2} className="relative">
           <div className="absolute -inset-10 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
           <div className="relative border border-slate-200 rounded-2xl bg-white p-6 shadow-xl">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                   <div className="text-slate-900 font-semibold">Post-Processing Filter Aktif</div>
                   <div className="text-xs text-slate-500">Scrubbing sitasi palsu secara otomatis</div>
                </div>
             </div>
             <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
                <div className="flex items-start gap-2 text-slate-700">
                  <span className="text-red-500 mt-1 line-through decoration-red-500">❌ Sumber: Wikipedia (2024)...</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <span className="text-emerald-600 mt-1">✅ Berdasarkan referensi Buku Siswa Kemdikbud yang Anda input...</span>
                </div>
             </div>
           </div>
        </FadeInScroll>
      </section>

      {/* How it Works Section */}
      <section className="pt-24">
        <FadeInScroll>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-900 mb-16">
            Bagaimana <span className="text-indigo-600">Cara Kerjanya?</span>
          </h2>
        </FadeInScroll>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-slate-200" />
          
          {[
            { 
              step: "1", 
              title: "Input Dasar", 
              desc: "Pilih jenjang, kelas, dan mata pelajaran. Lalu masukkan paragraf Capaian Pembelajaran (CP).",
              icon: "📝"
            },
            { 
              step: "2", 
              title: "AI Merancang", 
              desc: "Sistem cerdas kami akan menyusun ATP, merancang PROTA & PROSEM, hingga membuat draf Modul Ajar.",
              icon: "⚙️"
            },
            { 
              step: "3", 
              title: "Review & Ekspor", 
              desc: "Cek hasilnya di dalam editor bawaan kami. Jika sudah pas, klik Ekspor untuk mengunduh file Microsoft Word (.docx).",
              icon: "📥"
            }
          ].map((item, i) => (
            <FadeInScroll key={i} delay={i * 0.2} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white border-8 border-slate-50 flex items-center justify-center text-4xl mb-6 shadow-lg relative">
                {item.icon}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {item.step}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed max-w-xs">{item.desc}</p>
            </FadeInScroll>
          ))}
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="pt-24 pb-16">
        <FadeInScroll>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-900 mb-12">
            Kenapa <span className="text-indigo-600">Sobat Guru?</span>
          </h2>
        </FadeInScroll>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {[
            { title: "Hemat Waktu Berjam-jam", desc: "Dari hitungan jam menyusun tabel manual menjadi hanya beberapa detik." },
            { title: "Sesuai Kurikulum Merdeka", desc: "Format dokumen dirancang khusus agar sejalan dengan standar pendidikan terbaru." },
            { title: "Generasi Dokumen Terpadu", desc: "Data diwariskan dengan cerdas. CP → ATP → PROTA/PROSEM → Modul Ajar tanpa copas ulang." },
            { title: "Desain UI Editor Bersih", desc: "Edit dan review dokumen yang dihasilkan AI di dalam editor yang nyaman sebelum diekspor ke Word." }
          ].map((feature, i) => (
            <FadeInScroll key={i} delay={i * 0.1} className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
            </FadeInScroll>
          ))}
        </div>
      </section>
    </div>
  );
}
