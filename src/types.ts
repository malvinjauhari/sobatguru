export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  nama_guru?: string;
  nip?: string;
  sekolah?: string;
  mapel?: string;
  fase?: string;
  kelas?: string;
  nama_kepsek?: string;
  nip_kepsek?: string;
  kota?: string;
}

export type DocumentType = 'ATP' | 'PROTA' | 'PROSEM' | 'MODUL_AJAR';

export interface DocumentData {
  id: string;
  type: DocumentType;
  id_dokumen_induk?: string;
  payload: any;
  createdAt: number;
}
