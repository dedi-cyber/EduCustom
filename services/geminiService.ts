
import { GoogleGenAI } from "@google/genai";
import { LessonPlanRequest } from "../types";

export const generateLessonPlan = async (request: LessonPlanRequest): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const isMadrasah = request.institutionType === 'Madrasah';
  
  const systemInstruction = `
    Anda adalah seorang Kurikulum Designer dan Pedagogical Mentor yang ahli dalam Diferensiasi Pembelajaran (Differentiated Instruction) dan Kurikulum Nasional (Kurikulum Merdeka/K13).
    Tugas Anda adalah membuat Rencana Pelaksanaan Pembelajaran (RPP) atau Modul Ajar yang sangat menarik dan terstruktur.
    
    KONTEKS UTAMA:
    - Instansi: ${request.institutionType}
    - Materi Pokok: ${request.curriculumTopic}
    - Jenjang: ${request.targetGrade}
    - Minat/Hobi Murid: ${request.studentInterests.join(", ")}
    
    ${isMadrasah ? 'KHUSUS MADRASAH: Integrasikan nilai-nilai KMA 1503/2025, termasuk Penguatan Profil Pelajar Pancasila dan Profil Pelajar Rahmatan Lil Alamin (P5RA), serta Moderasi Beragama secara halus namun bermakna dalam kegiatan.' : 'KHUSUS SEKOLAH UMUM: Fokus pada Penguatan Profil Pelajar Pancasila (P5) dan literasi/numerasi.'}

    STRUKTUR OUTPUT WAJIB (Gunakan Markdown yang rapi):
    1. **Judul RPP yang Kreatif**: (Hubungkan materi dengan minat murid).
    2. **Tujuan Pembelajaran**: (Gunakan format ABCD: Audience, Behavior, Condition, Degree).
    3. **Indikator Pencapaian Kompetensi (IPK)**: Tuliskan poin-poin konkret yang harus dicapai murid.
    4. **Kegiatan Pembuka (The Hook)**: Bagaimana menghubungkan minat/hobi murid dengan materi secara emosional dan kognitif?
    5. **Kegiatan Inti**: Jelaskan langkah-langkah pembelajaran di mana konsep materi diajarkan melalui analogi, simulasi, atau praktik langsung yang berkaitan dengan hobi tersebut. Pastikan ada diferensiasi proses/produk.
    6. **Kegiatan Penutup (Rinci)**: 
       - Refleksi bersama (apa yang dirasakan & dipelajari).
       - Umpan Balik (feedback positif dari guru).
       - Tindak Lanjut (penugasan ringan atau persiapan materi berikutnya).
    7. **Integrasi Karakter**: ${isMadrasah ? 'P5RA & Moderasi Beragama (Sesuai KMA 1503/2025)' : 'Profil Pelajar Pancasila (P5)'}.
    8. **Asesmen**: Instrumen evaluasi yang relevan (Formatif/Sumatif) dan dikemas sesuai hobi murid.
    9. **Tips untuk Guru**: Cara mengelola kelas agar tetap interaktif.

    Bahasa: Profesional, hangat, dan inspiratif. Gunakan Bahasa Indonesia yang baku namun komunikatif.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Buatkan saya rencana pembelajaran yang komprehensif berdasarkan konteks yang diberikan.",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Gagal menghasilkan rencana pembelajaran.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.");
  }
};
