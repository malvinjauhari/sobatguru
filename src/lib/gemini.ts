/// <reference types="vite/client" />
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function generateDocument(
  document_type: string,
  context_statis: any,
  context_dinamis: any,
  context_warisan: any
): Promise<any> {
  let prompt = `
    Sebagai AI Content Engine untuk aplikasi Sobat Guru, tugasmu adalah menghasilkan konten pedagogis untuk dokumen ${document_type}.
    
    Konteks Statis (Profil Guru):
    ${JSON.stringify(context_statis, null, 2)}
    
    Konteks Dinamis (Input Form):
    ${JSON.stringify(context_dinamis, null, 2)}
    
    Konteks Warisan (Data Induk):
    ${JSON.stringify(context_warisan, null, 2)}
  `;

      if (document_type === 'ATP') {
        prompt += `
        DOKUMEN INI ADALAH "ALUR DAN TUJUAN PEMBELAJARAN (ATP)".
        
        INSTRUKSI KONTEN:
        1. RASIONAL: Buat 1 paragraf narasi urgensi mata pelajaran ini (berdasarkan referensi atau pemahaman mapel).
        2. ALUR DAN TUJUAN PEMBELAJARAN: Buat daftar Tujuan Pembelajaran (TP) secara logis berdasarkan elemen CP. Untuk tiap TP, ekstrak "Konsep Inti" (1-2 kata kunci utama) dan berikan "Glosarium" (definisi jelas dari konsep inti tersebut). JANGAN MENGOSONGKAN SEL.
        3. PROFIL PELAJAR PANCASILA: Uraikan relevansi spesifik mapel terhadap 5 dimensi wajib: 
           (1) Iman dan Taqwa Kepada Tuhan Yang Maha Esa dan Berakhlak Mulia, 
           (2) Berkebhinekaan Global, 
           (3) Bergotong Royong, 
           (4) Mandiri, 
           (5) Bernalar Kritis.
        4. INDIKATOR PENILAIAN: Buat indikator turunan (bullet points) untuk tiap Tujuan Pembelajaran. Tiap TP minimal memiliki 2-4 indikator turunan yang operasional dan terukur.
        
        FORMAT OUTPUT (JSON MURNI):
        {
          "rasional": "Narasi rasional...",
          "tujuan_pembelajaran": [
            {
              "teks_tp": "Peserta didik mampu...",
              "konsep_inti": "Kata Kunci",
              "glosarium": "Penjelasan dari kata kunci tersebut.",
              "indikator_penilaian": ["Indikator 1", "Indikator 2"]
            }
          ],
          "profil_pelajar_pancasila": [
            { "dimensi": "Iman dan Taqwa Kepada Tuhan Yang Maha Esa dan Berakhlak Mulia", "uraian": "..." },
            { "dimensi": "Berkebhinekaan Global", "uraian": "..." },
            { "dimensi": "Bergotong Royong", "uraian": "..." },
            { "dimensi": "Mandiri", "uraian": "..." },
            { "dimensi": "Bernalar Kritis", "uraian": "..." }
          ]
        }
        `;

      } else if (document_type === 'PROTA') {
        prompt += `
        DOKUMEN INI ADALAH "PROGRAM TAHUNAN (PROTA)".
        
        INSTRUKSI KONTEN:
        1. Narasi Capaian Pembelajaran (CP): Buat narasi umum CP untuk fase bersangkutan, dan penjabaran per kelas.
        2. Elemen CP: Buat list elemen CP (misal: Pemahaman Konsep, Keterampilan Proses) beserta rincian kompetensinya.
        3. Jadwal Distribusi: Bagilah materi menjadi SEMESTER 1 dan SEMESTER 2. 
           - Setiap elemen distribusi mewakili 1 BAB / MATERI.
           - Kelompokkan Tujuan Pembelajaran (TP) yang relevan ke dalam setiap BAB.
           - Tentukan alokasi waktu (JP) per BAB.
        
        FORMAT OUTPUT (JSON MURNI):
        {
          "narasi_cp_umum": "Paragraf narasi umum CP...",
          "narasi_cp_kelas": "Paragraf penjabaran untuk kelas terkait...",
          "tabel_elemen_cp": [
            { "elemen": "Keterampilan Konsep Sejarah (Contoh)", "deskripsi": "..." },
            { "elemen": "Keterampilan Berpikir Sejarah (Contoh)", "deskripsi": "..." }
          ],
          "distribusi": [
            {
              "semester": 1,
              "materi": "JUDUL MATERI/BAB 1",
              "alokasi_jp": 12,
              "tujuan_pembelajaran": [
                { "teks_tp": "Mampu menganalisis..." },
                { "teks_tp": "Mampu mengidentifikasi..." }
              ]
            }
          ]
        }
        `;

      } else if (document_type === 'PROSEM') {
        const semesterStr = context_dinamis?.semester || "1";
        const isSemester1 = semesterStr === "1";
        const bulanList = isSemester1 ? 
          '["Juli", "Agustus", "September", "Oktober", "November", "Desember"]' : 
          '["Januari", "Februari", "Maret", "April", "Mei", "Juni"]';

        prompt += `
        DOKUMEN INI ADALAH "PROGRAM SEMESTER (PROSEM)".
        
        INSTRUKSI KONTEN:
        1. Buat daftar Tujuan Pembelajaran (TP) untuk Semester ${semesterStr}.
        2. Bagilah ke dalam beberapa Materi/Bab.
        3. Tentukan alokasi waktu (JP) untuk tiap TP.
        4. Tentukan estimasi pelaksanaan dalam bentuk list "bulan" dan "minggu" (misal minggu ke 1 dan 2).
           Pilihan bulan HANYA BOLEH: ${bulanList}.
        
        INSTRUKSI KONTEN TAMBAHAN:
        - Sertakan "narasi_cp_umum" (Capaian Pembelajaran fase umum).
        - Sertakan "narasi_cp_kelas" (Capaian Pembelajaran spesifik kelas).
        - Sertakan "tabel_elemen_cp" (Elemen pemahaman konsep dan keterampilan proses).

        FORMAT OUTPUT (JSON MURNI):
        {
          "semester": "${semesterStr}",
          "narasi_cp_umum": "Pada Fase F, peserta didik di Kelas XI dan XII mampu...",
          "narasi_cp_kelas": "Peserta didik di Kelas XI mampu menggunakan sumber primer...",
          "tabel_elemen_cp": [
            { "elemen": "Keterampilan Konsep Sejarah", "deskripsi": "Pada akhir fase kelas XI ini..." }
          ],
          "bulan": ${bulanList},
          "distribusi": [
            {
              "materi": "JUDUL MATERI/BAB 1",
              "tujuan_pembelajaran": [
                {
                  "teks_tp": "Mampu menganalisis...",
                  "alokasi_jp": 4,
                  "pelaksanaan": [
                    { "bulan": "${isSemester1 ? 'Juli' : 'Januari'}", "minggu": [3, 4] }
                  ]
                }
              ]
            }
          ]
        }
        `;

      } else if (document_type === 'MODUL_AJAR') {
        prompt += `
        DOKUMEN INI ADALAH "MODUL AJAR".
        
        INSTRUKSI KONTEN:
        1. KOMPETENSI AWAL: Buat 1 paragraf ringkasan materi/bab berdasarkan "judul_bab" dan "referensi_materi".
        2. KOMPONEN INTI: Tentukan Tujuan Pembelajaran, Pemahaman Bermakna, dan Pertanyaan Pemantik.
        3. KEGIATAN PEMBELAJARAN: Buat rincian kegiatan pembelajaran yang dibagi menjadi beberapa pertemuan. Setiap pertemuan wajib memiliki Kegiatan Pendahuluan, Inti, dan Penutup.
        4. ASESMEN (KISI-KISI SOAL): Buat baris-baris soal dalam bentuk grup berdasarkan CP (biarkan teks_cp kosong/dijawab sembarang, akan dioverride sistem backend).
        5. PENGAYAAN & REMEDIAL: Tuliskan narasi singkat tugas, dan JANGAN memberikan contoh link kecuali ada di input.
        6. LAMPIRAN (LKPD & Glosarium): Susun narasi penugasan/lembar kerja (LKPD) kosong. Tambahkan 5 glosarium.
        7. DILARANG KERAS MENGARANG SITASI: Jangan menyisipkan nama buku, pengarang, tahun, URL, atau sumber media apapun di Kegiatan Pembelajaran atau materi, KECUALI yang benar-benar ada di "referensi_materi" input. Hasilkan isi secara mandiri tanpa membuat sitasi palsu.

        FORMAT OUTPUT (JSON MURNI):
        {
          "kompetensi_awal": "Bab ini membahas...",
          "tujuan_pembelajaran": [
             "Peserta didik mampu mengidentifikasi..."
          ],
          "pemahaman_bermakna": "Perkembangan...",
          "pertanyaan_pemantik": [
             "Bagaimana pengaruh..."
          ],
          "pertemuan": [
            {
               "judul": "Menuju Proklamasi Kemerdekaan",
               "pendahuluan": "Guru membangun zona alfa...",
               "inti": "Literasi: guru meminta peserta didik menyimak...",
               "penutup": "Refleksi: guru meminta peserta didik..."
            }
          ],
          "kisi_kisi_soal": [
            {
               "baris": [
                  { "kode_tp": "11.4.1", "indikator_soal": "Disajikan ilustrasi...", "nomor_soal": "1/PG" }
               ]
            }
          ],
          "pengayaan_remedial": {
            "materi_pengayaan": "Link literasi pengayaan jika ada di input",
            "tugas_pengayaan": "Hanya untuk peserta didik yang memiliki nilai...",
            "materi_remedial": "Link literasi remedial jika ada di input",
            "tugas_remedial": "Hanya untuk peserta didik yang nilainya..."
          },
          "lkpd": [
             { "aktivitas": "Aktivitas 1", "judul": "Hiroshima dan Nagasaki", "narasi": "Perang Dunia II telah berakhir...", "tugas": "Peristiwa pengeboman Hiroshima...", "petunjuk": ["Kerjakan tugas secara kolaboratif"] }
          ],
          "glosarium": [
             { "istilah": "HEGEMONI", "definisi": "pengaruh kepemimpinan..." }
          ]
        }
        \`;

      } else if (document_type === 'RPP') {
        prompt += \`
        DOKUMEN INI ADALAH "RENCANA PELAKSANAAN PEMBELAJARAN (RPP) / MODUL AJAR SEDERHANA".

        TUGAS ANDA:
        Gunakan data referensi (PDF) untuk mengisi komponen konten.
        
        ATURAN MUTLAK (CRITICAL RULES):
        1. RENDER SELURUH STRUKTUR: Jangan meringkas bagian-bagian dokumen. 
        2. ISI DENGAN DATA DARI PDF: Setiap kali membuat Tujuan Pembelajaran, Kegiatan Inti, Asesmen, WAJIB mengambil isi detail dari file PDF/referensi materi. JANGAN dikosongi, JANGAN diringkas menjadi 1 kalimat. Tuliskan detailnya secara UTUH sesuai referensi materi!
        3. DILARANG KERAS MENGARANG SITASI ATAU MATERI YANG TIDAK ADA DI REFERENSI MATERI.

        Format output JSON harus sesuai persis dengan spesifikasi di bawah.

        PANDUAN KONTEN & GAYA BAHASA (FEW-SHOT PATTERN):
        - Capaian Pembelajaran: Ambil deskripsi lengkap dari materi terkait kompetensi.
        - Tujuan Pembelajaran: Jelas dan terukur, sebutkan detail materinya.
        - Langkah-Langkah Pembelajaran: Jabarkan SEMUA langkah secara detail. Gunakan format Nama Kegiatan (Durasi).
          Contoh Sintaks Inti:
          "Stimulasi (Stimulation) (10 menit):"
          "- Guru menampilkan beberapa gambar yang menunjukkan dua kelompok benda..."
          "Identifikasi Masalah (Problem Statement) (10 menit):"
          "- Guru mengajukan pertanyaan kritis: 'Bagaimana kita bisa menunjukkan bahwa kedua sisi pada gambar tersebut memiliki jumlah yang sama?'"
        
        INSTRUKSI KONTEN JSON:
        1. IDENTITAS MODUL AJAR: Dihasilkan secara dinamis.
        2. CAPAIAN PEMBELAJARAN (CP): Teks utuh.
        3. TUJUAN PEMBELAJARAN (TP): Teks utuh.
        4. MATERI PEMBELAJARAN: Bullet points topik secara rinci.
        5. METODE & MODEL PEMBELAJARAN: Model pedagogik (misal: Discovery Learning).
        6. LANGKAH-LANGKAH PEMBELAJARAN: Rincian sintaks secara mendetail di Pendahuluan, Inti, Penutup.
        7. PENILAIAN / ASESMEN: Penjabaran instrumen lengkap.

        FORMAT OUTPUT (JSON MURNI):
        {
          "identitas": {
             "materi_pokok": "Diisi judul materi pokok sebenarnya",
             "alokasi_waktu": "2 x 45 Menit (1 Pertemuan)"
          },
          "capaian_pembelajaran": "Diisi paragraf utuh capaian pembelajaran...",
          "tujuan_pembelajaran": "Diisi paragraf utuh tujuan pembelajaran...",
          "materi_pembelajaran": [ "Detail materi 1", "Detail materi 2" ],
          "metode_model": [ "Metode 1", "Metode 2" ],
          "langkah_pembelajaran": {
             "pendahuluan": {
                "waktu": "15 Menit",
                "kegiatan": [
                   { "nama": "Pembukaan (5 menit)", "detail": ["Detail 1", "Detail 2"] },
                   { "nama": "Apersepsi (5 menit)", "detail": ["Detail 1"] }
                ]
             },
             "inti": {
                "waktu": "60 Menit",
                "sintaks": "Sintaks Model Discovery Learning",
                "kegiatan": [
                   { "nama": "Stimulasi (10 menit)", "detail": ["Detail 1"] },
                   { "nama": "Identifikasi Masalah (10 menit)", "detail": ["Detail 1"] }
                ]
             },
             "penutup": {
                "waktu": "15 Menit",
                "kegiatan": [
                   { "nama": "Refleksi (5 menit)", "detail": ["Detail 1"] },
                   { "nama": "Rangkuman (5 menit)", "detail": ["Detail 1"] }
                ]
             }
          },
          "asesmen": {
             "diagnostik": [ "Detail asesmen diagnostik 1" ],
             "formatif": [ "Detail asesmen formatif 1" ],
             "sumatif": [ "Detail asesmen sumatif 1" ]
          }
        }
        \`;
      } else {
        prompt += \`
        INSTRUKSI WAJIB:
        4. Jika ini MODUL_AJAR, buat narasi kegiatan pendahuluan, inti, dan penutup berdasarkan referensi materi. Kosongkan tabel LKPD (tugas siswa).
        5. Jika ada data administratif yang kosong, fallback ke "....".
        
        SKEMA JSON YANG DIHARAPKAN:
        Jika PROTA/PROSEM: { "distribusi": [ { "bab": "...", "tp_terkait": ["..."], "alokasi_jp": 0, "keterangan": "..." } ] }
        `;
      }


  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from AI");
  }
  
  let jsonData: any = {};
  try {
    jsonData = JSON.parse(text);
    
    if (Object.keys(jsonData).length === 0) {
      throw new Error("AI returned empty JSON");
    }
    if (document_type === 'MODUL_AJAR') {
      if (!jsonData.pertemuan || !Array.isArray(jsonData.pertemuan) || jsonData.pertemuan.length === 0) {
        throw new Error("Gagal: Output MODUL_AJAR tidak lengkap (Kegiatan Pembelajaran kosong)");
      }
    }

    if (document_type === 'ATP' && jsonData.tujuan_pembelajaran) {
       const kelasStrRaw = String(context_statis?.kelas || context_statis?.fase || 'X');
       const kelasStr = kelasStrRaw.replace(/kelas\s*/i, '').trim() || 'X';
       
       const newTujuan = [] as any[];
       const newIndikator = [] as any[];
       
       jsonData.tujuan_pembelajaran.forEach((tp: any, index: number) => {
          const kode = `${kelasStr}.${index + 1}`;
          newTujuan.push({
             kode_tp: kode,
             teks_tp: tp.teks_tp,
             konsep_inti: tp.konsep_inti,
             glosarium: tp.glosarium
          });
          newIndikator.push({
             kode_tp: kode,
             indikator: tp.indikator_penilaian || []
          });
       });
       
       jsonData.tujuan_pembelajaran = newTujuan;
       jsonData.indikator_penilaian = newIndikator;
    } else if ((document_type === 'PROTA' || document_type === 'PROSEM') && jsonData.distribusi) {
       const kelasStrRaw = String(context_statis?.kelas || context_statis?.fase || 'X');
       const kelasStr = kelasStrRaw.replace(/kelas\s*/i, '').trim() || 'X';
       
       let globalTpIndex = 1;
       jsonData.distribusi.forEach((bab: any, babIndex: number) => {
           if (bab.tujuan_pembelajaran) {
               bab.tujuan_pembelajaran.forEach((tp: any, tpIndex: number) => {
                   tp.kode_tp = `${kelasStr}.${babIndex + 1}.${tpIndex + 1}`;
                   globalTpIndex++;
               });
           }
       });
    }
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("AI menghasilkan format yang tidak valid. Silakan coba lagi.");
  }

  // Anti-Leakage Scrubbing
  if (document_type === 'MODUL_AJAR') {
     const scrub = (str: any) => {
        if (typeof str !== 'string') return str;
        str = str.replace(/sumber\s*:\s*[A-Za-z0-9\.\s\-&,\(\)]+/gi, '');
        return str;
     };
     
     if (jsonData.pertemuan) {
        jsonData.pertemuan = jsonData.pertemuan.map((pt: any) => ({
           ...pt,
           pendahuluan: scrub(pt.pendahuluan),
           inti: scrub(pt.inti),
           penutup: scrub(pt.penutup)
        }));
     }
     
     if (jsonData.kisi_kisi_soal) {
         const cpText = context_warisan?.narasi_cp_umum || context_statis?.fase ? `Pada Fase ${context_statis?.fase}, ${context_warisan?.narasi_cp_umum || 'peserta didik mampu mencapai kompetensi yang diharapkan.'}` : 'Capaian Pembelajaran';
         jsonData.kisi_kisi_soal = jsonData.kisi_kisi_soal.map((ks: any) => ({
             ...ks,
             teks_cp: cpText
         }));
     }
  }

  return jsonData;
}
