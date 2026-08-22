import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateDocument } from '../lib/gemini';
import { FileText, Loader2, Download, AlertCircle, Save, CheckCircle } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, convertInchesToTwip, ShadingType } from 'docx';

export default function GenerateDoc() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const typeParam = searchParams.get('type') || 'ATP';
  
  const [docType, setDocType] = useState(typeParam);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State Dinamis
  const [tahunPenyusunan, setTahunPenyusunan] = useState(new Date().getFullYear().toString());
  const [judulBab, setJudulBab] = useState('');
  const [referensiMateri, setReferensiMateri] = useState('');
  const [jumlahJam, setJumlahJam] = useState('');
  const [semester, setSemester] = useState('1');

  // Editable preview state
  const [editableResult, setEditableResult] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setDocType(typeParam);
    setResult(null);
    setEditableResult(null);
    setError(null);
  }, [typeParam]);

  useEffect(() => {
    if (result) {
      setEditableResult(JSON.parse(JSON.stringify(result)));
    }
  }, [result]);

  const handleGenerate = async () => {
    if (!profile) return;
    
    // Validasi
    if (!tahunPenyusunan) {
      setError("Tahun Penyusunan/Ajaran wajib diisi.");
      return;
    }
    if ((docType === 'MODUL_AJAR' || docType === 'RPP') && (!judulBab || !referensiMateri)) {
      setError("Judul Bab dan Referensi Materi wajib diisi untuk Modul Ajar dan RPP.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setEditableResult(null);
    
    try {
      // Dynamic Context Warisan
      let contextWarisan: any = {};
      
      if (docType === 'ATP') {
        contextWarisan = {
          source: "master_cp",
          elemen: [
            { nama_elemen: "Pemahaman Konsep", deskripsi_capaian: "Peserta didik mampu memahami dan menganalisis konsep sesuai mata pelajaran terkait." },
            { nama_elemen: "Keterampilan Proses", deskripsi_capaian: "Peserta didik mampu melakukan observasi, bertanya, dan menyajikan hasil." }
          ]
        };
      } else if (docType === 'MODUL_AJAR') {
        contextWarisan = {
          source: "documents.ATP",
          tp_terkait_bab: [
            { kode_tp: "TP-1", teks_tp: `Memahami konsep tentang ${judulBab}.` }
          ]
        };
      } else {
        contextWarisan = {
          source: "documents.ATP",
          list_tp: [
            { kode_tp: "TP-1", teks_tp: "Memahami konsep dasar." },
            { kode_tp: "TP-2", teks_tp: "Menganalisis fenomena terkait." }
          ]
        };
      }

      const payload = {
        document_type: docType,
        context_statis: {
          nama_guru: profile.nama_guru || '',
          nip: profile.nip || '',
          sekolah: profile.sekolah || '',
          mapel: profile.mapel || '',
          fase: profile.fase || '',
          kelas: profile.kelas || ''
        },
        context_dinamis: {
          tahun_penyusunan: tahunPenyusunan,
          judul_bab: judulBab,
          referensi_materi: referensiMateri,
          jumlah_jam: jumlahJam,
          semester: semester
        },
        context_warisan: contextWarisan
      };

      const data = await generateDocument(
        payload.document_type,
        payload.context_statis,
        payload.context_dinamis,
        payload.context_warisan
      );
      setResult(data);

      // Save to Firestore
      await addDoc(collection(db, 'documents'), {
        userId: profile.uid,
        type: docType,
        payload: data,
        createdAt: Date.now()
      });

    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem, silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!editableResult || !profile) return;
    
    try {
      let children: any[] = [];

      if (docType === 'ATP') {
        const createHeaderCell = (text: string) => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true })], alignment: AlignmentType.CENTER })],
          shading: { fill: "F2F2F2", type: ShadingType.CLEAR, color: "auto" },
          verticalAlign: "center",
          margins: { top: 100, bottom: 100, left: 100, right: 100 }
        });

        const createCell = (text: string, isBullet = false) => {
          if (isBullet) {
             const items = text.split('\n').filter(t => t.trim());
             return new TableCell({
               children: items.map(item => new Paragraph({ text: item.trim(), bullet: { level: 0 } })),
               margins: { top: 100, bottom: 100, left: 100, right: 100 }
             });
          }
          return new TableCell({
            children: [new Paragraph({ text })],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          });
        };

        children.push(
          new Paragraph({
            children: [new TextRun({ text: `ATP FASE ${profile.fase || '-'} KELAS ${profile.kelas || '-'}`, bold: true, size: 24 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: `MATA PELAJARAN ${profile.mapel?.toUpperCase() || '-'}`, bold: true, size: 24 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: "" }),
          
          new Paragraph({ children: [new TextRun({ text: "A. INFORMASI", bold: true, size: 24 })] }),
          new Paragraph({ text: `PENYUSUN : ${profile.nama_guru || '-'}` }),
          new Paragraph({ text: `SEKOLAH : ${profile.sekolah || '-'} MATA PELAJARAN : ${profile.mapel || '-'}` }),
          new Paragraph({ text: `FASE : ${profile.fase || '-'} KELAS : ${profile.kelas || '-'}` }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "B. RASIONAL", bold: true, size: 24 })] }),
          new Paragraph({ text: editableResult.rasional || "" }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "C. ALUR DAN TUJUAN PEMBELAJARAN", bold: true, size: 24 })] })
        );

        // Tabel C
        if (editableResult.tujuan_pembelajaran && Array.isArray(editableResult.tujuan_pembelajaran)) {
          const rows = [
            new TableRow({
              children: [
                createHeaderCell("TUJUAN PEMBELAJARAN"),
                createHeaderCell("KONSEP INTI"),
                createHeaderCell("GLOSARIUM"),
              ]
            }),
            ...editableResult.tujuan_pembelajaran.map((tp: any) => new TableRow({
              children: [
                createCell(tp.teks_tp || ''),
                createCell(tp.konsep_inti || ''),
                createCell(tp.glosarium || '')
              ]
            }))
          ];
          
          children.push(
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
            new Paragraph({ text: "" })
          );
        }

        children.push(
          new Paragraph({ children: [new TextRun({ text: "D. PROFIL PELAJAR PANCASILA", bold: true, size: 24 })] }),
          new Paragraph({ text: `Melalui pembelajaran ${profile.mapel || '-'}, diharapkan siswa:` })
        );
        
        if (editableResult.profil_pelajar_pancasila && Array.isArray(editableResult.profil_pelajar_pancasila)) {
          editableResult.profil_pelajar_pancasila.forEach((pp: any, idx: number) => {
            children.push(new Paragraph({
              children: [
                new TextRun({ text: `(${idx+1}) ` }),
                new TextRun({ text: `${pp.dimensi}. `, bold: true }),
                new TextRun({ text: pp.uraian || '' })
              ]
            }));
          });
        }
        
        children.push(
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "E. JUMLAH JAM", bold: true, size: 24 })] }),
          new Paragraph({ text: `${jumlahJam || '-'} JP` }),
          new Paragraph({ text: "" }),
          
          new Paragraph({ children: [new TextRun({ text: "F. INDIKATOR PENILAIAN", bold: true, size: 24 })] })
        );

        // Tabel F
        if (editableResult.indikator_penilaian && Array.isArray(editableResult.indikator_penilaian)) {
          // Map indikator per tp code so we can find the matching text
          const tpMap = new Map();
          if (editableResult.tujuan_pembelajaran) {
             editableResult.tujuan_pembelajaran.forEach((tp: any) => {
               tpMap.set(tp.kode_tp, tp.teks_tp);
             });
          }

          const rows = [
            new TableRow({
              children: [
                createHeaderCell("TUJUAN PEMBELAJARAN"),
                createHeaderCell("INDIKATOR PENILAIAN"),
              ]
            }),
            ...editableResult.indikator_penilaian.map((ind: any) => new TableRow({
              children: [
                createCell(tpMap.get(ind.kode_tp) || ind.kode_tp || ''),
                createCell(Array.isArray(ind.indikator) ? ind.indikator.join('\n') : (ind.indikator || ''), true)
              ]
            }))
          ];
          
          children.push(
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
        }

      } else if (docType === 'PROTA') {
        const createHeaderCell = (text: string, colSpan = 1, fill = "F4B084") => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true })], alignment: AlignmentType.CENTER })],
          shading: { fill: fill, type: ShadingType.CLEAR, color: "auto" },
          verticalAlign: "center",
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          columnSpan: colSpan
        });

        const createCell = (text: string, isBullet = false, align: any = AlignmentType.LEFT) => {
          if (isBullet) {
             const items = text.split('\n').filter(t => t.trim());
             return new TableCell({
               children: items.map(item => new Paragraph({ text: item.trim(), bullet: { level: 0 }, alignment: align })),
               margins: { top: 100, bottom: 100, left: 100, right: 100 }
             });
          }
          return new TableCell({
            children: [new Paragraph({ text, alignment: align })],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          });
        };

        children.push(
          new Paragraph({
            children: [new TextRun({ text: "PROGRAM TAHUNAN ( PROTA )", bold: true, size: 24, color: "FFFFFF" })],
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "C00000" }
          }),
          new Paragraph({
            children: [new TextRun({ text: `MATA PELAJARAN ${profile.mapel?.toUpperCase() || '-'}`, bold: true, size: 24, color: "FFFFFF" })],
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "C00000" }
          }),
          new Paragraph({ text: "" }),
          
          new Paragraph({
             children: [
               new TextRun({ text: "SATUAN PENDIDIKAN\t: ", bold: true }),
               new TextRun({ text: profile.sekolah || '-' })
             ]
          }),
          new Paragraph({
             children: [
               new TextRun({ text: "MATA PELAJARAN\t\t: ", bold: true }),
               new TextRun({ text: profile.mapel || '-' })
             ]
          }),
          new Paragraph({
             children: [
               new TextRun({ text: "KELAS / FASE\t\t: ", bold: true }),
               new TextRun({ text: `${profile.kelas || '-'} / ${profile.fase || '-'}` })
             ]
          }),
          new Paragraph({
             children: [
               new TextRun({ text: "TAHUN PENYUSUNAN\t: ", bold: true }),
               new TextRun({ text: tahunPenyusunan || '-' })
             ]
          }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: `CAPAIAN PEMBELAJARAN SEJARAH FASE ${profile.fase || '-'}`, bold: true, size: 24 })] }),
          new Paragraph({ text: editableResult.narasi_cp_umum || "" }),
          new Paragraph({ text: editableResult.narasi_cp_kelas || "" }),
          new Paragraph({ text: "" })
        );

        if (editableResult.tabel_elemen_cp && Array.isArray(editableResult.tabel_elemen_cp)) {
          const rows = [
            new TableRow({
              children: [
                createHeaderCell("Elemen Pemahaman Konsep Sejarah", 2, "F2F2F2")
              ]
            }),
            ...editableResult.tabel_elemen_cp.map((el: any) => new TableRow({
              children: [
                createCell(el.elemen || ''),
                createCell(el.deskripsi || '')
              ]
            }))
          ];
          children.push(
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
            new Paragraph({ text: "" })
          );
        }

        if (editableResult.distribusi && Array.isArray(editableResult.distribusi)) {
          const rows: TableRow[] = [
            new TableRow({
              children: [
                createHeaderCell("No", 1, "F4B084"),
                createHeaderCell("TUJUAN PEMBELAJARAN (TP)", 1, "F4B084"),
                createHeaderCell("MATERI", 1, "F4B084"),
                createHeaderCell("Alokasi Waktu", 1, "F4B084"),
              ]
            })
          ];

          let currentSemester = -1;
          let totalJP = 0;
          let rowNo = 1;

          editableResult.distribusi.forEach((dist: any) => {
             if (dist.semester !== currentSemester) {
                currentSemester = dist.semester;
                rows.push(new TableRow({
                  children: [
                    createHeaderCell(`SEMESTER ${currentSemester}`, 4, "D9E1F2")
                  ]
                }));
             }

             const tpText = dist.tujuan_pembelajaran ? dist.tujuan_pembelajaran.map((tp: any) => `${tp.kode_tp} ${tp.teks_tp}`).join('\n') : '';
             
             rows.push(new TableRow({
               children: [
                 createCell(rowNo.toString(), false, AlignmentType.CENTER),
                 createCell(tpText, true),
                 createCell(dist.materi || ''),
                 createCell(`${dist.alokasi_jp || 0} JP`, false, AlignmentType.CENTER)
               ]
             }));

             totalJP += Number(dist.alokasi_jp || 0);
             rowNo++;
          });

          rows.push(new TableRow({
            children: [
              new TableCell({
                 children: [new Paragraph({ children: [new TextRun({ text: "CADANGAN JAM PELAJARAN", bold: true })], alignment: AlignmentType.CENTER })],
                 columnSpan: 3,
                 shading: { fill: "E2EFDA", type: ShadingType.CLEAR, color: "auto" },
                 margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              createCell("0 JP", false, AlignmentType.CENTER)
            ]
          }));

          rows.push(new TableRow({
            children: [
              new TableCell({
                 children: [new Paragraph({ children: [new TextRun({ text: "JUMLAH JAM PELAJARAN", bold: true })], alignment: AlignmentType.CENTER })],
                 columnSpan: 3,
                 shading: { fill: "E2EFDA", type: ShadingType.CLEAR, color: "auto" },
                 margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              createCell(`${totalJP} JP`, false, AlignmentType.CENTER)
            ]
          }));

          children.push(
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
            new Paragraph({ text: "" })
          );
        }

        // Tanda Tangan Table (Borderles)
        const dateStr = `${profile.kota || '..................'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        
        children.push(
           new Paragraph({ text: "" }),
           new Table({
             borders: {
               top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
             },
             width: { size: 100, type: WidthType.PERCENTAGE },
             rows: [
               new TableRow({
                 children: [
                   new TableCell({
                     children: [
                       new Paragraph({ text: "Mengetahui,", alignment: AlignmentType.CENTER }),
                       new Paragraph({ text: "Kepala Sekolah", alignment: AlignmentType.CENTER }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ children: [new TextRun({ text: profile.nama_kepsek || '(...................................)', bold: true, underline: { type: "single" } })], alignment: AlignmentType.CENTER }),
                       new Paragraph({ text: `NIP. ${profile.nip_kepsek || '...................................'}`, alignment: AlignmentType.CENTER }),
                     ]
                   }),
                   new TableCell({
                     children: [
                       new Paragraph({ text: dateStr, alignment: AlignmentType.CENTER }),
                       new Paragraph({ text: "Guru Mata Pelajaran", alignment: AlignmentType.CENTER }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ children: [new TextRun({ text: profile.nama_guru || '(...................................)', bold: true, underline: { type: "single" } })], alignment: AlignmentType.CENTER }),
                       new Paragraph({ text: `NIP. ${profile.nip || '...................................'}`, alignment: AlignmentType.CENTER }),
                     ]
                   })
                 ]
               })
             ]
           })
        );

                  } else if (docType === 'PROSEM') {
        const createHeaderCell = (text: string, colSpan = 1, rowSpan = 1, fill = "F4B084") => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true })], alignment: AlignmentType.CENTER })],
          shading: { fill: fill, type: ShadingType.CLEAR, color: "auto" },
          verticalAlign: "center",
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          columnSpan: colSpan,
          rowSpan: rowSpan
        });

        const createCell = (text: string, fill?: string, align: any = AlignmentType.LEFT) => {
          return new TableCell({
            children: [new Paragraph({ text, alignment: align })],
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            shading: fill ? { fill: fill, type: ShadingType.CLEAR, color: "auto" } : undefined
          });
        };

        const targetData = editableResult;
        const selectedSemester = semester;
        const isSem1 = String(selectedSemester) === "1";

        children.push(
          new Paragraph({
            children: [new TextRun({ text: "PROGRAM SEMESTER ( PROSEM )", bold: true, size: 24, color: "FFFFFF" })],
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "C00000" }
          }),
          new Paragraph({
            children: [new TextRun({ text: `FASE ${profile.fase || '-'} KELAS ${profile.kelas || '-'}`, bold: true, size: 24, color: "FFFFFF" })],
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "C00000" }
          }),
          new Paragraph({ text: "" }),
          
          new Paragraph({
             children: [
               new TextRun({ text: "Satuan Pendidikan	: ", bold: true }),
               new TextRun({ text: profile.sekolah || '-' })
             ]
          }),
          new Paragraph({
             children: [
               new TextRun({ text: "Mata Pelajaran		: ", bold: true }),
               new TextRun({ text: profile.mapel || '-' })
             ]
          }),
          new Paragraph({
             children: [
               new TextRun({ text: "Kelas / Semester	: ", bold: true }),
               new TextRun({ text: `${profile.kelas || '-'} / ${isSem1 ? "1" : "2"}` })
             ]
          }),
          new Paragraph({
             children: [
               new TextRun({ text: "Tahun Penyusunan	: ", bold: true }),
               new TextRun({ text: tahunPenyusunan || '' || '-' })
             ]
          }),
          new Paragraph({ text: "" }),
          
          new Paragraph({ children: [new TextRun({ text: `CAPAIAN PEMBELAJARAN SEJARAH FASE ${profile.fase || '-'}`, bold: true, size: 24 })] }),
          new Paragraph({ text: targetData.narasi_cp_umum || "" }),
          new Paragraph({ text: targetData.narasi_cp_kelas || "" }),
          new Paragraph({ text: "" })
        );

        if (targetData.tabel_elemen_cp && Array.isArray(targetData.tabel_elemen_cp)) {
          const rows = [
            new TableRow({
              children: [
                createHeaderCell("Elemen Pemahaman Konsep Sejarah", 2, 1, "F2F2F2")
              ]
            }),
            ...targetData.tabel_elemen_cp.map((el: any) => new TableRow({
              children: [
                createCell(el.elemen || '', undefined, AlignmentType.LEFT),
                createCell(el.deskripsi || '', undefined, AlignmentType.LEFT)
              ]
            }))
          ];
          children.push(
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
            new Paragraph({ text: "" })
          );
        }

        if (targetData.distribusi && Array.isArray(targetData.distribusi)) {
           const bulan = isSem1 ? 
             ["Juli", "Agustus", "September", "Oktober", "November", "Desember"] :
             ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
             
           const headerRow1 = new TableRow({
             children: [
               createHeaderCell("No", 1, 2, "D9E1F2"),
               createHeaderCell("TUJUAN PEMBELAJARAN", 1, 2, "D9E1F2"),
               createHeaderCell("Alokasi\nWaktu", 1, 2, "D9E1F2"),
               ...bulan.map(b => createHeaderCell(b, 5, 1, "D9E1F2"))
             ]
           });
           
           const mingguCells = [];
           for (let b = 0; b < 6; b++) {
             for (let m = 1; m <= 5; m++) {
               mingguCells.push(createHeaderCell(m.toString(), 1, 1, "F2F2F2"));
             }
           }
           
           const headerRow2 = new TableRow({
             children: mingguCells
           });
           
           const rows = [headerRow1, headerRow2];
           let rowNo = 1;
           let totalJP = 0;
           
           targetData.distribusi.forEach((dist: any) => {
              rows.push(new TableRow({
                children: [
                  new TableCell({
                     children: [new Paragraph({ children: [new TextRun({ text: dist.materi || '', bold: true })], alignment: AlignmentType.CENTER })],
                     columnSpan: 33,
                     shading: { fill: "FCE4D6", type: ShadingType.CLEAR, color: "auto" },
                     margins: { top: 100, bottom: 100, left: 100, right: 100 }
                  })
                ]
              }));

              if (dist.tujuan_pembelajaran) {
                dist.tujuan_pembelajaran.forEach((tp: any) => {
                   const cells = [
                     createCell(rowNo.toString(), undefined, AlignmentType.CENTER),
                     createCell(`${tp.kode_tp || ''} ${tp.teks_tp || ''}`),
                     createCell(tp.alokasi_jp ? `${tp.alokasi_jp} JP` : 'JP', undefined, AlignmentType.CENTER)
                   ];
                   totalJP += Number(tp.alokasi_jp || 0);
                   
                   const pel = tp.pelaksanaan || [];
                   for (let b = 0; b < 6; b++) {
                     const bName = bulan[b];
                     const bPel = pel.find((p: any) => p.bulan === bName);
                     const wArr = bPel ? (bPel.minggu || []) : [];
                     
                     for (let m = 1; m <= 5; m++) {
                       if (wArr.includes(m) || wArr.includes(m.toString())) {
                         cells.push(createCell("", "8EA9DB"));
                       } else {
                         cells.push(createCell(""));
                       }
                     }
                   }
                   
                   rows.push(new TableRow({ children: cells }));
                   rowNo++;
                });
              }
           });
           
           rows.push(new TableRow({
            children: [
              new TableCell({
                 children: [new Paragraph({ children: [new TextRun({ text: "JUMLAH JAM PELAJARAN", bold: true })], alignment: AlignmentType.CENTER })],
                 columnSpan: 2,
                 shading: { fill: "E2EFDA", type: ShadingType.CLEAR, color: "auto" },
                 margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              createCell(`${totalJP} JP`, "E2EFDA", AlignmentType.CENTER),
              new TableCell({
                 children: [new Paragraph({ text: "" })],
                 columnSpan: 30,
                 shading: { fill: "E2EFDA", type: ShadingType.CLEAR, color: "auto" }
              })
            ]
          }));

           children.push(
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
            new Paragraph({ text: "" })
          );
        }

        const dateStr = `${profile.kota || '..................' }, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        
        children.push(
           new Paragraph({ text: "" }),
           new Table({
             borders: {
               top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
             },
             width: { size: 100, type: WidthType.PERCENTAGE },
             rows: [
               new TableRow({
                 children: [
                   new TableCell({
                     children: [
                       new Paragraph({ text: "Mengetahui,", alignment: AlignmentType.CENTER }),
                       new Paragraph({ text: "Kepala Sekolah", alignment: AlignmentType.CENTER }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ children: [new TextRun({ text: profile.nama_kepsek || '(...................................)', bold: true, underline: { type: "single" } })], alignment: AlignmentType.CENTER }),
                       new Paragraph({ text: `NIP. ${profile.nip_kepsek || '...................................'}`, alignment: AlignmentType.CENTER }),
                     ]
                   }),
                   new TableCell({
                     children: [
                       new Paragraph({ text: dateStr, alignment: AlignmentType.CENTER }),
                       new Paragraph({ text: "Guru Mata Pelajaran", alignment: AlignmentType.CENTER }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ text: "" }),
                       new Paragraph({ children: [new TextRun({ text: profile.nama_guru || '(...................................)', bold: true, underline: { type: "single" } })], alignment: AlignmentType.CENTER }),
                       new Paragraph({ text: `NIP. ${profile.nip || '...................................'}`, alignment: AlignmentType.CENTER }),
                     ]
                   })
                 ]
               })
             ]
           })
        );

      } else if (docType === 'MODUL_AJAR') {
        const createHeaderCell = (text: string, colSpan = 1, rowSpan = 1, fill = "F4B084") => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true })], alignment: AlignmentType.CENTER })],
          shading: { fill: fill, type: ShadingType.CLEAR, color: "auto" },
          verticalAlign: "center",
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          columnSpan: colSpan,
          rowSpan: rowSpan
        });

        const createCell = (text: string, fill?: string, align: any = AlignmentType.LEFT) => {
          return new TableCell({
            children: [new Paragraph({ text, alignment: align })],
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            shading: fill ? { fill: fill, type: ShadingType.CLEAR, color: "auto" } : undefined
          });
        };

        const targetData = editableResult;

        const headingBackground = { type: ShadingType.CLEAR, color: "auto", fill: "FCE4D6" };

        children.push(
          new Paragraph({
            children: [new TextRun({ text: "MODUL AJAR", bold: true, size: 28 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: `BAB : ${judulBab || '...'}`, bold: true, size: 24 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: "" }),
          
          new Paragraph({
            children: [new TextRun({ text: "INFORMASI UMUM", bold: true, size: 24 })],
            alignment: AlignmentType.CENTER,
            shading: headingBackground
          }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "A. IDENTITAS MODUL", bold: true })] }),
          new Table({
             borders: {
               top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
             },
             width: { size: 100, type: WidthType.PERCENTAGE },
             rows: [
               new TableRow({ children: [ createCell("Nama Penyusun", undefined), createCell(`: ${profile.nama_guru || '..................'}`) ] }),
               new TableRow({ children: [ createCell("Satuan Pendidikan", undefined), createCell(`: ${profile.sekolah || '..................'}`) ] }),
               new TableRow({ children: [ createCell("Kelas / Fase", undefined), createCell(`: ${profile.kelas || '...'} / ${profile.fase || '...'}`) ] }),
               new TableRow({ children: [ createCell("Mata Pelajaran", undefined), createCell(`: ${profile.mapel || '..................'}`) ] }),
               new TableRow({ children: [ createCell("Prediksi Alokasi Waktu", undefined), createCell(`: ${jumlahJam ? jumlahJam + ' JP' : '..................'}`) ] }),
               new TableRow({ children: [ createCell("Tahun Penyusunan", undefined), createCell(`: ${tahunPenyusunan || '..................'}`) ] }),
             ]
          }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "B. KOMPETENSI AWAL", bold: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } }),
          new Paragraph({ text: targetData.kompetensi_awal || "..." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "C. PROFIL PELAJAR PANCASILA", bold: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } }),
          new Paragraph({ text: targetData.profil_pancasila || "Beriman, bertakwa kepada Tuhan yag maha Esa, bergotong royong, bernalar kritis, kreatif, inovatif, mandiri, berkebhinekaan global" }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "D. SARANA DAN PRASARANA", bold: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } }),
          new Paragraph({ text: "• LCD proyektor, komputer serta tayangan slide power point, video pembelajaran (jika ada) dan media lain yang telah disiapkan." }),
          new Paragraph({ text: "• Perangkat digital (internet, telepon pintar, laptop, komputer, LCD)." }),
          new Paragraph({ text: "• Perangkat non digital (buku teks, papan tulis, spidol, peta, globe)." }),
          new Paragraph({ text: "• Lingkungan alam dan sosial sekitar sekolah." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "E. TARGET PESERTA DIDIK", bold: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } }),
          new Paragraph({ text: "Peserta didik reguler/tipikal: umum, tidak ada kesulitan dalam mencerna dan memahami materi ajar." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "F. MODEL PEMBELAJARAN", bold: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } }),
          new Paragraph({ text: "Blended learning melalui model pembelajaran dengan menggunakan Project Based Learning (PBL) terintegrasi pembelajaran berdiferensiasi berbasis Social Emotional Learning (SEL)." }),
          new Paragraph({ text: "" }),

          new Paragraph({
            children: [new TextRun({ text: "KOMPONEN INTI", bold: true, size: 24 })],
            alignment: AlignmentType.CENTER,
            shading: headingBackground
          }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "A. TUJUAN PEMBELAJARAN", bold: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } }),
        );

        if (targetData.tujuan_pembelajaran && Array.isArray(targetData.tujuan_pembelajaran)) {
           targetData.tujuan_pembelajaran.forEach((tp: string) => {
             children.push(new Paragraph({ text: `• ${tp}` }));
           });
        }
        children.push(new Paragraph({ text: "" }));

        children.push(
          new Paragraph({ children: [new TextRun({ text: "B. PEMAHAMAN BERMAKNA", bold: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } }),
          new Paragraph({ text: targetData.pemahaman_bermakna || "..." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "C. PERTANYAAN PEMANTIK", bold: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } })
        );

        if (targetData.pertanyaan_pemantik && Array.isArray(targetData.pertanyaan_pemantik)) {
           targetData.pertanyaan_pemantik.forEach((tp: string) => {
             children.push(new Paragraph({ text: `• ${tp}` }));
           });
        }
        children.push(new Paragraph({ text: "" }));

        children.push(
          new Paragraph({ children: [new TextRun({ text: "D. KEGIATAN PEMBELAJARAN", bold: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } })
        );

        if (targetData.pertemuan && Array.isArray(targetData.pertemuan)) {
           targetData.pertemuan.forEach((pt: any, idx: number) => {
             children.push(
                new Paragraph({ children: [new TextRun({ text: `PERTEMUAN KE-${idx+1}`, bold: true })], shading: { fill: "E6E6FA", type: ShadingType.CLEAR, color: "auto" } }),
                new Paragraph({ children: [new TextRun({ text: pt.judul || '' })] }),
                new Paragraph({ children: [new TextRun({ text: "Kegiatan Pendahuluan", bold: true })] }),
                new Paragraph({ text: pt.pendahuluan || "" }),
                new Paragraph({ children: [new TextRun({ text: "Kegiatan Inti", bold: true })] }),
                new Paragraph({ text: pt.inti || "" }),
                new Paragraph({ children: [new TextRun({ text: "Kegiatan Penutup", bold: true })] }),
                new Paragraph({ text: pt.penutup || "" }),
                new Paragraph({ text: "" })
             );
           });
        }

        children.push(
          new Paragraph({ children: [new TextRun({ text: "E. ASESMEN / PENILAIAN", bold: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } })
        );

        if (targetData.kisi_kisi_soal && Array.isArray(targetData.kisi_kisi_soal)) {
           const rows = [
             new TableRow({
               children: [
                 createHeaderCell("Capaian Pembelajaran (CP)"),
                 createHeaderCell("Alur Tujuan Pembelajaran (ATP)"),
                 createHeaderCell("Indikator Soal"),
                 createHeaderCell("Nomor Soal / Bentuk Soal")
               ]
             })
           ];
           targetData.kisi_kisi_soal.forEach((grup: any) => {
              if (grup.baris && Array.isArray(grup.baris) && grup.baris.length > 0) {
                 const rowSpan = grup.baris.length;
                 grup.baris.forEach((br: any, i: number) => {
                    const cells = [];
                    if (i === 0) {
                       cells.push(new TableCell({
                          children: [new Paragraph({ text: grup.teks_cp || 'Capaian Pembelajaran' })],
                          rowSpan: rowSpan,
                          margins: { top: 100, bottom: 100, left: 100, right: 100 }
                       }));
                    }
                    cells.push(createCell(br.kode_tp || br.atp || ''));
                    cells.push(createCell(br.indikator_soal || ''));
                    cells.push(createCell(br.nomor_soal || ''));
                    rows.push(new TableRow({ children: cells }));
                 });
              } else if (grup.cp) {
                 // Fallback to old format
                 rows.push(new TableRow({
                    children: [
                       createCell(grup.cp || ''),
                       createCell(grup.atp || ''),
                       createCell(grup.indikator || ''),
                       createCell(grup.bentuk_soal || '')
                    ]
                 }));
              }
           });
           children.push(
            new Paragraph({ children: [new TextRun({ text: "KISI-KISI SOAL", bold: true })], alignment: AlignmentType.CENTER }),
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
            new Paragraph({ text: "" })
          );
        }

        children.push(
          new Paragraph({ children: [new TextRun({ text: "F. PENGAYAAN DAN REMEDIAL", bold: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } })
        );
        if (targetData.pengayaan_remedial) {
           children.push(
             new Paragraph({ children: [new TextRun({ text: "Materi Pengayaan", bold: true })] }),
             new Paragraph({ text: targetData.pengayaan_remedial.materi_pengayaan || "" }),
             new Paragraph({ children: [new TextRun({ text: "Tugas Pengayaan", bold: true })] }),
             new Paragraph({ text: targetData.pengayaan_remedial.tugas_pengayaan || "" }),
             new Paragraph({ children: [new TextRun({ text: "Materi Remedial", bold: true })] }),
             new Paragraph({ text: targetData.pengayaan_remedial.materi_remedial || "" }),
             new Paragraph({ children: [new TextRun({ text: "Tugas Remedial", bold: true })] }),
             new Paragraph({ text: targetData.pengayaan_remedial.tugas_remedial || "" }),
             new Paragraph({ text: "" })
           );
        }

        children.push(
          new Paragraph({
            children: [new TextRun({ text: "LAMPIRAN-LAMPIRAN", bold: true, size: 24 })],
            alignment: AlignmentType.CENTER,
            shading: headingBackground
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "LAMPIRAN 1: LEMBAR KERJA PESERTA DIDIK (LKPD)", bold: true, italics: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } })
        );

        if (targetData.lkpd && Array.isArray(targetData.lkpd)) {
           targetData.lkpd.forEach((lk: any) => {
             children.push(
                new Paragraph({ children: [new TextRun({ text: lk.aktivitas || "", bold: true })] }),
                new Paragraph({ children: [new TextRun({ text: lk.judul || "", bold: true })] }),
                new Paragraph({ text: lk.narasi || "" }),
                new Paragraph({ children: [new TextRun({ text: "Tugas:", bold: true })] }),
                new Paragraph({ text: lk.tugas || "" }),
                new Paragraph({ children: [new TextRun({ text: "Petunjuk Kerja:", bold: true })] })
             );
             if (lk.petunjuk && Array.isArray(lk.petunjuk)) {
               lk.petunjuk.forEach((p: string) => children.push(new Paragraph({ text: `• ${p}` })));
             }
             children.push(new Paragraph({ text: "" }));
           });
        }

        children.push(new Paragraph({ children: [new TextRun({ text: "LAMPIRAN 3: GLOSARIUM", bold: true, italics: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } }));
        if (targetData.glosarium && Array.isArray(targetData.glosarium)) {
           targetData.glosarium.forEach((g: any) => {
             children.push(new Paragraph({ text: `- ${g.istilah}: ${g.definisi}` }));
           });
        }
        children.push(new Paragraph({ text: "" }));

        children.push(new Paragraph({ children: [new TextRun({ text: "LAMPIRAN 4: DAFTAR PUSTAKA", bold: true, italics: true })], shading: { fill: "D9E1F2", type: ShadingType.CLEAR, color: "auto" } }));
        if (targetData.daftar_pustaka && Array.isArray(targetData.daftar_pustaka)) {
           targetData.daftar_pustaka.forEach((d: string) => {
             children.push(new Paragraph({ text: `- ${d}` }));
           });
        }


      } else {
        children = [
          new Paragraph({
            text: `DOKUMEN ${docType}`,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: `Nama Guru: ${profile.nama_guru || '-'}` }),
          new Paragraph({ text: `Mata Pelajaran: ${profile.mapel || '-'}` }),
          new Paragraph({ text: `Fase/Kelas: ${profile.fase || '-'}` }),
          new Paragraph({ text: `Tahun: ${tahunPenyusunan}` }),
          new Paragraph({ text: "" }),
        ];
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${docType}_${profile.mapel || 'Mapel'}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
    } catch(e) {
      console.error("Export Error:", e);
      alert("Gagal mengekspor dokumen.");
    }
  };

  const handleEditChange = (key: string, value: any) => {
    setEditableResult({ ...editableResult, [key]: value });
    setIsSaved(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Generate Dokumen</h1>
        <p className="mt-2 text-slate-600">Pilih jenis dokumen dan isi parameter untuk menyusun konten berbasis AI.</p>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        
        {/* Panel Kiri: Input Form */}
        <div className="lg:col-span-4 flex flex-col space-y-6 overflow-y-auto pr-2 pb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-shrink-0">
            <div className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Dokumen</label>
                <select 
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="ATP">Alur Tujuan Pembelajaran (ATP)</option>
                  <option value="PROTA">Program Tahunan (PROTA)</option>
                  <option value="PROSEM">Program Semester (PROSEM)</option>
                  <option value="MODUL_AJAR">Modul Ajar</option>
                  <option value="RPP">Rencana Pelaksanaan Pembelajaran (RPP)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Penyusunan / Ajaran</label>
                <input 
                  type="text" 
                  value={tahunPenyusunan}
                  onChange={(e) => setTahunPenyusunan(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              {(docType === 'ATP') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Jam Pelajaran (JP) <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={jumlahJam}
                      onChange={(e) => setJumlahJam(e.target.value)}
                      placeholder="Misal: 140"
                      className="w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
              )}
              
              {(docType === 'PROSEM') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Semester <span className="text-red-500">*</span></label>
                    <select 
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="1">Semester 1 (Ganjil)</option>
                      <option value="2">Semester 2 (Genap)</option>
                    </select>
                  </div>
              )}

              {(docType === 'MODUL_AJAR' || docType === 'RPP') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Judul Bab / Materi Pokok <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={judulBab}
                      onChange={(e) => setJudulBab(e.target.value)}
                      placeholder="Misal: Kerajaan Hindu-Buddha"
                      className="w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Referensi Materi (Opsional) <span className="text-red-500">*</span></label>
                    <textarea 
                      value={referensiMateri}
                      onChange={(e) => setReferensiMateri(e.target.value)}
                      placeholder="Paste referensi materi singkat agar AI lebih akurat..."
                      rows={4}
                      className="w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
                    />
                  </div>
                </>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Konteks Profil:</h3>
                <div className="text-sm text-slate-600 grid grid-cols-1 gap-1">
                  <p><span className="font-medium">Mapel:</span> {profile?.mapel || '-'}</p>
                  <p><span className="font-medium">Fase/Kelas:</span> {profile?.fase || '-'} / {profile?.kelas || '-'}</p>
                  <p><span className="font-medium">Kepala Sekolah:</span> {profile?.nama_kepsek || '-'}</p>
                </div>
                {(!profile?.mapel || !profile?.fase || !profile?.nama_kepsek) && (
                  <p className="mt-2 text-xs text-amber-600 flex items-start">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                    <span>Lengkapi profil (termasuk Kepsek) di Settings.</span>
                  </p>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyusun Konten...</>
                ) : (
                  <><FileText className="w-4 h-4 mr-2" /> Generate Dokumen</>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex flex-col items-start space-y-3">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
              <button 
                onClick={handleGenerate}
                className="text-sm font-semibold bg-red-100 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors text-red-800"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Panel Kanan: Preview Dokumen */}
        <div className="lg:col-span-8 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-semibold text-slate-800">Preview Dokumen</h2>
            
            <div className="flex items-center space-x-3">
              {editableResult && (
                <button 
                  onClick={handleExport}
                  className="flex items-center text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4 mr-2" /> Download .docx
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-8 relative">
            {!editableResult && !isGenerating && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-16 h-16 mb-4 text-slate-300" />
                <p className="font-medium text-lg text-slate-500">Preview Dokumen Kosong</p>
                <p className="text-sm text-slate-400">Isi form di panel kiri dan klik Generate.</p>
              </div>
            )}

            {isGenerating && (
               <div className="h-full flex flex-col items-center justify-center text-indigo-500">
                  <Loader2 className="w-12 h-12 mb-4 animate-spin text-indigo-400" />
                  <p className="font-medium">AI sedang menyusun dan merakit dokumen...</p>
               </div>
            )}

            {editableResult && !isGenerating && (
              <div className="bg-white min-h-[800px] w-full max-w-4xl mx-auto shadow-sm ring-1 ring-slate-200 p-8 md:p-12 text-slate-900 font-sans text-sm leading-relaxed">
                
                {/* Header KOP Dokumen */}
                <div className="border-b-2 border-slate-900 pb-4 mb-8 text-center">
                  <h1 className="text-2xl font-bold uppercase">DOKUMEN {docType.replace('_', ' ')}</h1>
                  <h2 className="text-lg font-semibold">{profile?.sekolah || 'Nama Sekolah'}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <p><span className="font-semibold">Mata Pelajaran:</span> {profile?.mapel}</p>
                    <p><span className="font-semibold">Fase / Kelas:</span> {profile?.fase}</p>
                  </div>
                  <div>
                    <p><span className="font-semibold">Nama Guru:</span> {profile?.nama_guru}</p>
                    <p><span className="font-semibold">Tahun Penyusunan:</span> {tahunPenyusunan}</p>
                  </div>
                </div>

                {/* Konten Editable */}
                <div className="space-y-6">
                  {docType === 'ATP' && (
                    <>
                      <div>
                        <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">A. Rasional</h3>
                        <textarea
                          className="w-full h-32 p-3 border border-indigo-100 rounded bg-indigo-50/30 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-colors resize-y"
                          value={editableResult.rasional || ''}
                          onChange={(e) => handleEditChange('rasional', e.target.value)}
                        />
                      </div>
                      
                      {editableResult.tujuan_pembelajaran && Array.isArray(editableResult.tujuan_pembelajaran) && (
                        <div>
                          <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">B. Tujuan Pembelajaran</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-300 mt-2">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 p-2 text-left w-24">Kode</th>
                                  <th className="border border-slate-300 p-2 text-left">Tujuan Pembelajaran</th>
                                </tr>
                              </thead>
                              <tbody>
                                {editableResult.tujuan_pembelajaran.map((tp: any, idx: number) => (
                                  <tr key={idx}>
                                    <td className="border border-slate-300 p-2 align-top">{tp.kode_tp}</td>
                                    <td className="border border-slate-300 p-2">
                                      <textarea
                                        className="w-full h-16 p-2 border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:border-indigo-300 focus:ring-1 focus:ring-indigo-500 rounded resize-y"
                                        value={tp.teks_tp || ''}
                                        onChange={(e) => {
                                          const newTp = [...editableResult.tujuan_pembelajaran];
                                          newTp[idx].teks_tp = e.target.value;
                                          handleEditChange('tujuan_pembelajaran', newTp as any);
                                        }}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {docType === 'MODUL_AJAR' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">Judul Materi Pokok: {judulBab}</h3>
                      </div>

                      <div>
                         <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">Kompetensi Awal</h3>
                         <textarea
                            className="w-full h-24 p-3 border border-indigo-100 rounded bg-white focus:ring-1 focus:ring-indigo-500 transition-colors resize-y text-sm"
                            value={editableResult.kompetensi_awal || ''}
                            onChange={(e) => handleEditChange('kompetensi_awal', e.target.value)}
                         />
                      </div>

                      <div>
                         <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">Tujuan Pembelajaran</h3>
                         <div className="space-y-2">
                           {editableResult.tujuan_pembelajaran && editableResult.tujuan_pembelajaran.map((tp: string, idx: number) => (
                              <textarea
                                key={idx}
                                className="w-full h-16 p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                                value={tp}
                                onChange={(e) => {
                                   const newTp = [...editableResult.tujuan_pembelajaran];
                                   newTp[idx] = e.target.value;
                                   handleEditChange('tujuan_pembelajaran', newTp);
                                }}
                              />
                           ))}
                         </div>
                      </div>

                      <div>
                         <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">Pertanyaan Pemantik</h3>
                         <div className="space-y-2">
                           {editableResult.pertanyaan_pemantik && editableResult.pertanyaan_pemantik.map((tp: string, idx: number) => (
                              <textarea
                                key={idx}
                                className="w-full h-16 p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                                value={tp}
                                onChange={(e) => {
                                   const newTp = [...editableResult.pertanyaan_pemantik];
                                   newTp[idx] = e.target.value;
                                   handleEditChange('pertanyaan_pemantik', newTp);
                                }}
                              />
                           ))}
                         </div>
                      </div>

                      <div>
                         <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">Kegiatan Pembelajaran (Per Pertemuan)</h3>
                         <div className="space-y-4">
                           {editableResult.pertemuan && editableResult.pertemuan.map((pt: any, idx: number) => (
                              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                <h4 className="font-bold text-sm text-indigo-700 mb-2">Pertemuan {idx+1}</h4>
                                <input
                                  className="w-full mb-2 p-2 border border-slate-300 rounded font-semibold text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                  value={pt.judul || ''}
                                  onChange={(e) => {
                                    const newPt = [...editableResult.pertemuan];
                                    newPt[idx].judul = e.target.value;
                                    handleEditChange('pertemuan', newPt);
                                  }}
                                  placeholder="Judul Pertemuan"
                                />
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-xs font-bold text-slate-500">Pendahuluan</label>
                                    <textarea className="w-full h-16 p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500" value={pt.pendahuluan || ''} onChange={(e) => { const newPt = [...editableResult.pertemuan]; newPt[idx].pendahuluan = e.target.value; handleEditChange('pertemuan', newPt); }} />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold text-slate-500">Inti</label>
                                    <textarea className="w-full h-24 p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500" value={pt.inti || ''} onChange={(e) => { const newPt = [...editableResult.pertemuan]; newPt[idx].inti = e.target.value; handleEditChange('pertemuan', newPt); }} />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold text-slate-500">Penutup</label>
                                    <textarea className="w-full h-16 p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500" value={pt.penutup || ''} onChange={(e) => { const newPt = [...editableResult.pertemuan]; newPt[idx].penutup = e.target.value; handleEditChange('pertemuan', newPt); }} />
                                  </div>
                                </div>
                              </div>
                           ))}
                         </div>
                      </div>

                    </div>
                  )}

                  {docType === 'PROTA' && (
                     <div>
                        <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">Distribusi Materi & Waktu (PROTA)</h3>
                        {editableResult.distribusi && editableResult.distribusi.map((dist: any, idx: number) => (
                           <div key={idx} className="mb-4 p-4 border border-slate-200 rounded bg-slate-50">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-indigo-700">Semester {dist.semester}</span>
                                <span className="text-sm font-semibold bg-indigo-100 text-indigo-800 px-2 py-1 rounded">{dist.alokasi_jp} JP</span>
                              </div>
                              <input 
                                className="w-full mb-2 p-2 border border-slate-300 rounded font-semibold text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={dist.materi || ''}
                                onChange={(e) => {
                                  const newDist = [...editableResult.distribusi];
                                  newDist[idx].materi = e.target.value;
                                  handleEditChange('distribusi', newDist as any);
                                }}
                              />
                              <div className="space-y-2 mt-3">
                                {dist.tujuan_pembelajaran && dist.tujuan_pembelajaran.map((tp: any, tpIdx: number) => (
                                  <div key={tpIdx} className="flex gap-2 items-start bg-white p-2 border border-slate-100 rounded">
                                    <span className="font-mono text-xs mt-1.5 text-slate-500 w-12 flex-shrink-0">{tp.kode_tp}</span>
                                    <textarea 
                                      className="flex-1 p-2 border-transparent bg-transparent hover:bg-white focus:bg-white focus:border-indigo-300 focus:ring-1 focus:ring-indigo-500 rounded resize-y h-16 leading-tight"
                                      value={tp.teks_tp || ''}
                                      onChange={(e) => {
                                        const newDist = [...editableResult.distribusi];
                                        newDist[idx].tujuan_pembelajaran[tpIdx].teks_tp = e.target.value;
                                        handleEditChange('distribusi', newDist as any);
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}

                  {docType === 'PROSEM' && (
                     <div>
                        <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-1">
                          <h3 className="font-bold text-base">Distribusi Program Semester</h3>
                          <span className="font-bold text-indigo-700">Semester {editableResult.semester || semester}</span>
                        </div>
                        {editableResult.distribusi && editableResult.distribusi.map((dist: any, idx: number) => (
                           <div key={idx} className="mb-4 p-4 border border-slate-200 rounded bg-slate-50">
                              <input 
                                className="w-full mb-3 p-2 border border-slate-300 rounded font-bold text-indigo-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={dist.materi || ''}
                                onChange={(e) => {
                                  const newDist = [...editableResult.distribusi];
                                  newDist[idx].materi = e.target.value;
                                  handleEditChange('distribusi', newDist as any);
                                }}
                                placeholder="Materi / Bab"
                              />
                              <div className="space-y-3">
                                {dist.tujuan_pembelajaran && dist.tujuan_pembelajaran.map((tp: any, tpIdx: number) => (
                                  <div key={tpIdx} className="bg-white p-3 border border-slate-200 rounded-md shadow-sm">
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                      <span className="font-mono text-xs mt-2 text-indigo-500 font-bold w-12 flex-shrink-0">{tp.kode_tp}</span>
                                      <textarea 
                                        className="flex-1 p-2 border border-slate-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-500 rounded resize-y h-16 leading-tight text-sm"
                                        value={tp.teks_tp || ''}
                                        onChange={(e) => {
                                          const newDist = [...editableResult.distribusi];
                                          newDist[idx].tujuan_pembelajaran[tpIdx].teks_tp = e.target.value;
                                          handleEditChange('distribusi', newDist as any);
                                        }}
                                      />
                                      <div className="w-20 flex-shrink-0 flex flex-col">
                                        <label className="text-[10px] text-slate-500 mb-1 font-bold">Alokasi (JP)</label>
                                        <input 
                                          className="w-full p-2 border border-slate-200 rounded text-center text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                          type="number"
                                          value={tp.alokasi_jp || ''}
                                          onChange={(e) => {
                                            const newDist = [...editableResult.distribusi];
                                            newDist[idx].tujuan_pembelajaran[tpIdx].alokasi_jp = e.target.value;
                                            handleEditChange('distribusi', newDist as any);
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {(tp.pelaksanaan || []).map((pel: any, pIdx: number) => (
                                         <span key={pIdx} className="inline-flex items-center text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                            {pel.bulan} (Mg: {(pel.minggu || []).join(', ')})
                                         </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}


                  {docType === 'RPP' && (
                     <div className="space-y-4">
                        <div>
                           <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">Identitas</h3>
                           <div className="grid grid-cols-2 gap-4 text-sm mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                             <div>
                               <p><span className="font-semibold text-slate-500">Mata Pelajaran:</span> {profile?.mapel}</p>
                               <p><span className="font-semibold text-slate-500">Fase / Kelas:</span> {profile?.fase} / {profile?.kelas}</p>
                               <p><span className="font-semibold text-slate-500">Semester:</span> {semester}</p>
                             </div>
                             <div>
                               <p><span className="font-semibold text-slate-500">Materi Pokok:</span> {editableResult.identitas?.materi_pokok || judulBab}</p>
                               <p><span className="font-semibold text-slate-500">Alokasi Waktu:</span> {editableResult.identitas?.alokasi_waktu || '-'}</p>
                               <p><span className="font-semibold text-slate-500">Tahun:</span> {tahunPenyusunan}</p>
                             </div>
                           </div>
                        </div>

                        <div>
                           <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">Capaian Pembelajaran</h3>
                           <textarea
                              className="w-full h-24 p-3 border border-indigo-100 rounded bg-white focus:ring-1 focus:ring-indigo-500 transition-colors resize-y text-sm"
                              value={editableResult.capaian_pembelajaran || ''}
                              onChange={(e) => handleEditChange('capaian_pembelajaran', e.target.value)}
                           />
                        </div>

                        <div>
                           <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">Tujuan Pembelajaran</h3>
                           <textarea
                              className="w-full h-24 p-3 border border-indigo-100 rounded bg-white focus:ring-1 focus:ring-indigo-500 transition-colors resize-y text-sm"
                              value={editableResult.tujuan_pembelajaran || ''}
                              onChange={(e) => handleEditChange('tujuan_pembelajaran', e.target.value)}
                           />
                        </div>

                        <div>
                           <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">Materi Pembelajaran</h3>
                           <textarea
                              className="w-full h-32 p-3 border border-indigo-100 rounded bg-white focus:ring-1 focus:ring-indigo-500 transition-colors resize-y text-sm"
                              value={Array.isArray(editableResult.materi_pembelajaran) ? editableResult.materi_pembelajaran.join('\n') : (editableResult.materi_pembelajaran || '')}
                              onChange={(e) => handleEditChange('materi_pembelajaran', e.target.value.split('\n'))}
                           />
                        </div>

                        <div>
                           <h3 className="font-bold text-base mb-2 border-b border-slate-200 pb-1">Asesmen</h3>
                           <div className="space-y-3">
                             <div className="bg-slate-50 p-3 rounded border border-slate-200">
                               <h4 className="font-bold text-sm text-indigo-700 mb-1">Diagnostik</h4>
                               <textarea
                                 className="w-full h-20 p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                                 value={Array.isArray(editableResult.asesmen?.diagnostik) ? editableResult.asesmen.diagnostik.join('\n') : ''}
                                 onChange={(e) => {
                                   const baru = { ...editableResult.asesmen, diagnostik: e.target.value.split('\n') };
                                   handleEditChange('asesmen', baru);
                                 }}
                               />
                             </div>
                             <div className="bg-slate-50 p-3 rounded border border-slate-200">
                               <h4 className="font-bold text-sm text-indigo-700 mb-1">Formatif</h4>
                               <textarea
                                 className="w-full h-20 p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                                 value={Array.isArray(editableResult.asesmen?.formatif) ? editableResult.asesmen.formatif.join('\n') : ''}
                                 onChange={(e) => {
                                   const baru = { ...editableResult.asesmen, formatif: e.target.value.split('\n') };
                                   handleEditChange('asesmen', baru);
                                 }}
                               />
                             </div>
                             <div className="bg-slate-50 p-3 rounded border border-slate-200">
                               <h4 className="font-bold text-sm text-indigo-700 mb-1">Sumatif</h4>
                               <textarea
                                 className="w-full h-20 p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                                 value={Array.isArray(editableResult.asesmen?.sumatif) ? editableResult.asesmen.sumatif.join('\n') : ''}
                                 onChange={(e) => {
                                   const baru = { ...editableResult.asesmen, sumatif: e.target.value.split('\n') };
                                   handleEditChange('asesmen', baru);
                                 }}
                               />
                             </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Pengesahan Preview */}
                  <div className="mt-16 pt-8 flex justify-between text-center pb-12">
                    <div>
                      <p>Mengetahui,</p>
                      <p>Kepala Sekolah</p>
                      <div className="h-20"></div>
                      <p className="font-bold underline">{profile?.nama_kepsek || '(...................................)'}</p>
                      <p>NIP. {profile?.nip_kepsek || '...................................'}</p>
                    </div>
                    <div>
                      <p>{profile?.kota || '..................'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p>Guru Mata Pelajaran</p>
                      <div className="h-20"></div>
                      <p className="font-bold underline">{profile?.nama_guru || '(...................................)'}</p>
                      <p>NIP. {profile?.nip || '...................................'}</p>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
