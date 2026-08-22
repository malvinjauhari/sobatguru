import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DocumentData } from '../types';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, ShadingType } from 'docx';
import { useAuth } from '../context/AuthContext';

export default function ViewDoc() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [docData, setDocData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'documents', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDocData({ id: docSnap.id, ...docSnap.data() } as DocumentData);
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  const handleExport = async () => {
    if (!docData || !profile) return;
    
    const { type, payload } = docData;
    
    try {
      let children: any[] = [];

      if (type === 'ATP') {
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
          new Paragraph({ text: payload.rasional || "" }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "C. ALUR DAN TUJUAN PEMBELAJARAN", bold: true, size: 24 })] })
        );

        // Tabel C
        if (payload.tujuan_pembelajaran && Array.isArray(payload.tujuan_pembelajaran)) {
          const rows = [
            new TableRow({
              children: [
                createHeaderCell("TUJUAN PEMBELAJARAN"),
                createHeaderCell("KONSEP INTI"),
                createHeaderCell("GLOSARIUM"),
              ]
            }),
            ...payload.tujuan_pembelajaran.map((tp: any) => new TableRow({
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
        
        if (payload.profil_pelajar_pancasila && Array.isArray(payload.profil_pelajar_pancasila)) {
          payload.profil_pelajar_pancasila.forEach((pp: any, idx: number) => {
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
          new Paragraph({ text: `${payload.jumlah_jam || '-'} JP` }),
          new Paragraph({ text: "" }),
          
          new Paragraph({ children: [new TextRun({ text: "F. INDIKATOR PENILAIAN", bold: true, size: 24 })] })
        );

        // Tabel F
        if (payload.indikator_penilaian && Array.isArray(payload.indikator_penilaian)) {
          // Map indikator per tp code so we can find the matching text
          const tpMap = new Map();
          if (payload.tujuan_pembelajaran) {
             payload.tujuan_pembelajaran.forEach((tp: any) => {
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
            ...payload.indikator_penilaian.map((ind: any) => new TableRow({
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

      } else if (type === 'PROTA') {
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
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: `CAPAIAN PEMBELAJARAN SEJARAH FASE ${profile.fase || '-'}`, bold: true, size: 24 })] }),
          new Paragraph({ text: payload.narasi_cp_umum || "" }),
          new Paragraph({ text: payload.narasi_cp_kelas || "" }),
          new Paragraph({ text: "" })
        );

        if (payload.tabel_elemen_cp && Array.isArray(payload.tabel_elemen_cp)) {
          const rows = [
            new TableRow({
              children: [
                createHeaderCell("Elemen Pemahaman Konsep Sejarah", 2, "F2F2F2")
              ]
            }),
            ...payload.tabel_elemen_cp.map((el: any) => new TableRow({
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

        if (payload.distribusi && Array.isArray(payload.distribusi)) {
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

          payload.distribusi.forEach((dist: any) => {
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

                  } else if (type === 'PROSEM') {
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

        const targetData = payload;
        const selectedSemester = payload.semester;
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
               new TextRun({ text: payload.tahunPenyusunan || '' || '-' })
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

      } else if (type === 'MODUL_AJAR') {
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

        const targetData = payload;

        const headingBackground = { type: ShadingType.CLEAR, color: "auto", fill: "FCE4D6" };

        children.push(
          new Paragraph({
            children: [new TextRun({ text: "MODUL AJAR", bold: true, size: 28 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: `BAB : ${payload.judul_bab || '...'}`, bold: true, size: 24 })],
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
               new TableRow({ children: [ createCell("Prediksi Alokasi Waktu", undefined), createCell(`: ${payload.jumlah_jam ? payload.jumlah_jam + ' JP' : '..................'}`) ] }),
               new TableRow({ children: [ createCell("Tahun Penyusunan", undefined), createCell(`: ${payload.tahunPenyusunan || '..................'}`) ] }),
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


      } else if (type === 'RPP') {
        const createCell = (text: string, fill?: string, align: any = AlignmentType.LEFT) => {
          return new TableCell({
            children: [new Paragraph({ text, alignment: align })],
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            shading: fill ? { fill: fill, type: ShadingType.CLEAR, color: "auto" } : undefined
          });
        };

        const targetData = payload;
        const identitas = targetData.identitas || {};
        
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "RENCANA PELAKSANAAN PEMBELAJARAN (RPP) /", bold: true, size: 28 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: "MODUL AJAR", bold: true, size: 28 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: profile.mapel?.toUpperCase() || 'MATA PELAJARAN', bold: true, size: 24 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: `FASE ${profile.fase || '-'} (KELAS ${profile.kelas || '-'})`, bold: true, size: 24 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: "" }),
          
          new Paragraph({ children: [new TextRun({ text: "A. IDENTITAS MODUL AJAR", bold: true })] }),
          new Table({
             borders: {
               top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
               bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
               left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
               right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
               insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
               insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
             },
             width: { size: 100, type: WidthType.PERCENTAGE },
             rows: [
               new TableRow({ children: [ createCell("Nama Guru"), createCell(":"), createCell(profile.nama_guru || '-') ] }),
               new TableRow({ children: [ createCell("NIP"), createCell(":"), createCell(profile.nip || '-') ] }),
               new TableRow({ children: [ createCell("Sekolah"), createCell(":"), createCell(profile.sekolah || '-') ] }),
               new TableRow({ children: [ createCell("Mata Pelajaran"), createCell(":"), createCell(profile.mapel || '-') ] }),
               new TableRow({ children: [ createCell("Kelas"), createCell(":"), createCell(`${profile.kelas || '-'} (Fase ${profile.fase || '-'})`) ] }),
               new TableRow({ children: [ createCell("Semester"), createCell(":"), createCell(payload.semester == "1" ? "Ganjil" : "Genap") ] }),
               new TableRow({ children: [ createCell("Kurikulum"), createCell(":"), createCell("Merdeka") ] }),
               new TableRow({ children: [ createCell("Materi Pokok"), createCell(":"), createCell(identitas.materi_pokok || '-') ] }),
               new TableRow({ children: [ createCell("Alokasi Waktu"), createCell(":"), createCell(identitas.alokasi_waktu || '-') ] }),
             ]
          }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "B. CAPAIAN PEMBELAJARAN (CP)", bold: true })] }),
          new Paragraph({ text: targetData.capaian_pembelajaran || "" }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "C. TUJUAN PEMBELAJARAN (TP)", bold: true })] }),
          new Paragraph({ text: targetData.tujuan_pembelajaran || "" }),
          new Paragraph({ text: "" }),
          
          new Paragraph({ children: [new TextRun({ text: "D. MATERI PEMBELAJARAN", bold: true })] })
        );

        if (targetData.materi_pembelajaran && Array.isArray(targetData.materi_pembelajaran)) {
           targetData.materi_pembelajaran.forEach((m: string) => {
             children.push(new Paragraph({ text: `• ${m}` }));
           });
        }
        children.push(new Paragraph({ text: "" }));

        children.push(
          new Paragraph({ children: [new TextRun({ text: "E. METODE & MODEL PEMBELAJARAN", bold: true })] })
        );

        if (targetData.metode_model && Array.isArray(targetData.metode_model)) {
           targetData.metode_model.forEach((m: string) => {
             children.push(new Paragraph({ text: `• ${m}` }));
           });
        }
        children.push(new Paragraph({ text: "" }));

        children.push(
          new Paragraph({ children: [new TextRun({ text: "F. LANGKAH-LANGKAH PEMBELAJARAN", bold: true })] })
        );

        const lp = targetData.langkah_pembelajaran || {};
        if (lp.pendahuluan) {
           children.push(new Paragraph({ children: [new TextRun({ text: `1. Pendahuluan (${lp.pendahuluan.waktu || ''})`, bold: true })] }));
           if (lp.pendahuluan.kegiatan && Array.isArray(lp.pendahuluan.kegiatan)) {
              lp.pendahuluan.kegiatan.forEach((k: any) => {
                 children.push(new Paragraph({ children: [new TextRun({ text: `• ${k.nama || ''}`, bold: true })] }));
                 if (k.detail && Array.isArray(k.detail)) {
                    k.detail.forEach((d: string) => children.push(new Paragraph({ text: `  - ${d}` })));
                 }
              });
           }
           children.push(new Paragraph({ text: "" }));
        }

        if (lp.inti) {
           children.push(new Paragraph({ children: [new TextRun({ text: `2. Kegiatan Inti (${lp.inti.waktu || ''})`, bold: true })] }));
           if (lp.inti.sintaks) {
              children.push(new Paragraph({ children: [new TextRun({ text: lp.inti.sintaks, bold: true })] }));
           }
           if (lp.inti.kegiatan && Array.isArray(lp.inti.kegiatan)) {
              lp.inti.kegiatan.forEach((k: any) => {
                 children.push(new Paragraph({ children: [new TextRun({ text: `• ${k.nama || ''}`, bold: true })] }));
                 if (k.detail && Array.isArray(k.detail)) {
                    k.detail.forEach((d: string) => children.push(new Paragraph({ text: `  - ${d}` })));
                 }
              });
           }
           children.push(new Paragraph({ text: "" }));
        }

        if (lp.penutup) {
           children.push(new Paragraph({ children: [new TextRun({ text: `3. Penutup (${lp.penutup.waktu || ''})`, bold: true })] }));
           if (lp.penutup.kegiatan && Array.isArray(lp.penutup.kegiatan)) {
              lp.penutup.kegiatan.forEach((k: any) => {
                 children.push(new Paragraph({ children: [new TextRun({ text: `• ${k.nama || ''}`, bold: true })] }));
                 if (k.detail && Array.isArray(k.detail)) {
                    k.detail.forEach((d: string) => children.push(new Paragraph({ text: `  - ${d}` })));
                 }
              });
           }
           children.push(new Paragraph({ text: "" }));
        }

        children.push(
          new Paragraph({ children: [new TextRun({ text: "G. PENILAIAN / ASESMEN", bold: true })] })
        );

        const asesmen = targetData.asesmen || {};
        if (asesmen.diagnostik && Array.isArray(asesmen.diagnostik)) {
           children.push(new Paragraph({ children: [new TextRun({ text: "1. Asesmen Diagnostik", bold: true })] }));
           asesmen.diagnostik.forEach((a: string) => children.push(new Paragraph({ text: `• ${a}` })));
           children.push(new Paragraph({ text: "" }));
        }

        if (asesmen.formatif && Array.isArray(asesmen.formatif)) {
           children.push(new Paragraph({ children: [new TextRun({ text: "2. Asesmen Formatif", bold: true })] }));
           asesmen.formatif.forEach((a: string) => children.push(new Paragraph({ text: `• ${a}` })));
           children.push(new Paragraph({ text: "" }));
        }

        if (asesmen.sumatif && Array.isArray(asesmen.sumatif)) {
           children.push(new Paragraph({ children: [new TextRun({ text: "3. Asesmen Sumatif", bold: true })] }));
           asesmen.sumatif.forEach((a: string) => children.push(new Paragraph({ text: `• ${a}` })));
           children.push(new Paragraph({ text: "" }));
        }

        const dateStr = `${profile.kota || '..................' }, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        
        children.push(
           new Paragraph({ text: "" }),
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
                       new Paragraph({ text: `Kepala Sekolah ${profile.sekolah || '..................'}`, alignment: AlignmentType.CENTER }),
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

      } else {
        children = [
          new Paragraph({
            text: `DOKUMEN ${type}`,
            heading: HeadingLevel.HEADING_1,
          }),
        ];
      }

      const docx = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

      const blob = await Packer.toBlob(docx);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}_${profile.mapel || 'Mapel'}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch(e) {
      console.error(e);
      alert("Gagal mengekspor dokumen.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat detail dokumen...</div>;
  }

  if (!docData) {
    return <div className="p-8 text-center text-red-500">Dokumen tidak ditemukan.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link to="/app" className="mr-4 p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Detail {docData.type}</h1>
            <p className="text-sm text-slate-500">
              Dibuat pada {new Date(docData.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" /> Download .docx
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8">
           <pre className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm overflow-auto text-slate-700">
              {JSON.stringify(docData.payload, null, 2)}
           </pre>
        </div>
      </div>
    </div>
  );
}
