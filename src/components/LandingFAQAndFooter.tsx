import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { useState } from 'react';

const faqs = [
  {
    q: "Apakah formatnya sesuai dengan Kurikulum Merdeka?",
    a: "Ya, format dokumen yang dihasilkan dirancang mengikuti pedoman terbaru Kurikulum Merdeka, dan terstruktur agar mudah disesuaikan dengan kebutuhan spesifik sekolah Anda."
  },
  {
    q: "Apakah dokumen bisa diedit setelah di-generate?",
    a: "Tentu. Setelah AI membuat draf (ATP, Modul Ajar, dll.), Anda bisa langsung meninjaunya di dalam editor dan mengubah bagian apa pun sebelum mengekspornya ke Microsoft Word (.docx)."
  },
  {
    q: "Apakah ini gratis digunakan?",
    a: "Sobat Guru saat ini bisa digunakan secara gratis dengan kuota generasi tertentu setiap bulannya untuk mendukung bapak/ibu guru."
  },
  {
    q: "Apakah bisa digunakan untuk semua jenjang (SD/SMP/SMA)?",
    a: "Ya, karena basis kerangka dan AI kami adaptif terhadap Fase A sampai F. Cukup masukkan Capaian Pembelajaran (CP) dan tentukan fase yang sesuai."
  }
];

export default function LandingFAQAndFooter() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div id="faq" className="w-full bg-slate-50">
      {/* FAQ Section */}
      <section className="py-24 px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Sering <span className="text-indigo-600">Ditanyakan.</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <div 
                className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="text-slate-700 font-medium">{faq.q}</span>
                <span className={`text-slate-400 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}>
                  ↓
                </span>
              </div>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6 text-slate-600"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold mb-8 backdrop-blur-md shadow-sm">
          <span className="text-lg">🚀</span> Mulai sekarang, selesaikan lebih cepat.
        </div>
        
        <h2 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
          Ubah tumpukan administrasi <br />
          <span className="text-slate-500">jadi progress nyata.</span>
        </h2>
        
        <p className="text-slate-600 text-lg mb-10 max-w-xl mx-auto">
          Berhenti membuang waktu menata format tabel manual. Biarkan AI menyusun kerangkanya untukmu.
        </p>
        
        <Link
          to="/app"
          className="px-8 py-4 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors duration-200 text-lg flex items-center gap-2 shadow-lg shadow-indigo-500/30"
        >
          Mulai Generate <span>→</span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 px-4 md:px-8 mt-12 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xl mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">S</div>
              Sobat Guru
            </div>
            <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
              Platform generator dokumen administrasi bertenaga AI termutakhir untuk membantu guru mempercepat pembuatan ATP, PROTA, PROSEM, dan Modul Ajar.
            </p>
          </div>
          <div>
            <h4 className="text-slate-900 font-semibold mb-4">LEGALITAS</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 font-semibold mb-4">BANTUAN</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Hubungi Kami</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div>© 2026 Sobat Guru. Semua hak cipta dilindungi.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-900 transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Ketentuan Layanan</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
