
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import InterestCloud from './components/InterestCloud';
import { generateLessonPlan } from './services/geminiService';
import { GeneratedPlan, AppView, ClassProfile, TeacherSettings } from './types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const TIPS = [
  "Gunakan analogi hobi murid untuk menjelaskan konsep abstrak agar lebih mudah dicerna.",
  "Berikan apresiasi pada hobi murid untuk membangun hubungan emosional yang kuat.",
  "Jadikan hobi sebagai pintu masuk untuk mengenalkan istilah teknis yang baru.",
  "Materi yang relevan dengan minat akan meningkatkan daya ingat jangka panjang murid.",
  "Libatkan murid dalam memilih contoh soal yang berkaitan dengan kegemaran mereka.",
  "Sesuaikan metode evaluasi agar selaras dengan hobi murid (misal: proyek video untuk hobi TikTok).",
  "Dunia murid adalah dunia hobi; masuklah ke sana untuk menjadi guru inspiratif.",
  "Personalisasi bukan sekadar tren, tapi kebutuhan untuk pembelajaran yang bermakna."
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('SMP (Kelas 7-9)');
  const [institutionType, setInstitutionType] = useState<'Sekolah' | 'Madrasah'>('Sekolah');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedPlans, setSavedPlans] = useState<GeneratedPlan[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  
  const [teacherSettings, setTeacherSettings] = useState<TeacherSettings>({
    name: 'Budi Santoso, S.Pd.',
    school: 'SMP Negeri 1 Jakarta',
    nip: '19850101 201001 1 001',
    city: 'Jakarta',
    headmasterName: '',
    headmasterNip: ''
  });
  
  const [classProfiles, setClassProfiles] = useState<ClassProfile[]>([
    { id: '1', name: 'Kelas 7A', interests: ['Main Game (Gaming)', 'Sepak Bola'], studentCount: 32 },
    { id: '2', name: 'Kelas 8B', interests: ['K-Pop / Musik', 'Anime / Gambar'], studentCount: 28 },
    { id: '3', name: 'Kelas 9C', interests: ['Coding', 'Sains Eksperimen'], studentCount: 30 },
  ]);

  const resultRef = useRef<HTMLDivElement>(null);
  const rppContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('educustom_saved_plans');
    const storedSettings = localStorage.getItem('educustom_teacher_settings');
    const storedClasses = localStorage.getItem('educustom_class_profiles');
    
    if (stored) setSavedPlans(JSON.parse(stored));
    if (storedSettings) setTeacherSettings(JSON.parse(storedSettings));
    if (storedClasses) setClassProfiles(JSON.parse(storedClasses));

    setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleAddCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed && !selectedInterests.includes(trimmed)) {
      setSelectedInterests(prev => [...prev, trimmed]);
      setCustomInterest('');
    }
  };

  const handleGenerate = async () => {
    if (!topic) return setError("Mohon isi materi pokok kurikulum.");
    if (selectedInterests.length === 0) return setError("Pilih minimal satu minat murid.");

    setError(null);
    setIsGenerating(true);
    setIsSaved(false);

    try {
      const content = await generateLessonPlan({
        curriculumTopic: topic,
        targetGrade: grade,
        studentInterests: selectedInterests,
        institutionType: institutionType
      });
      
      setResult({
        id: crypto.randomUUID(),
        title: `RPP ${institutionType} ${topic}`,
        content,
        timestamp: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        topic: topic
      });

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result || !rppContentRef.current) return;
    
    setIsDownloading(true);
    const element = rppContentRef.current;
    const fileName = `RPP_${institutionType}_${topic.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;

    const options = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(options).from(element).save();
    } catch (err) {
      console.error("PDF Generation failed:", err);
      // Fallback to print
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSavePlan = () => {
    if (!result) return;
    if (savedPlans.some(p => p.id === result.id)) return;
    const newSavedPlans = [result, ...savedPlans];
    setSavedPlans(newSavedPlans);
    localStorage.setItem('educustom_saved_plans', JSON.stringify(newSavedPlans));
    setIsSaved(true);
  };

  const handleDeleteSavedPlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Hapus RPP ini?")) {
      const filtered = savedPlans.filter(p => p.id !== id);
      setSavedPlans(filtered);
      localStorage.setItem('educustom_saved_plans', JSON.stringify(filtered));
    }
  };

  const handleLoadSavedPlan = (plan: GeneratedPlan) => {
    setResult(plan);
    setIsSaved(true);
    setActiveView('dashboard');
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('educustom_teacher_settings', JSON.stringify(teacherSettings));
    alert("Profil berhasil disimpan!");
  };

  // Helper untuk membersihkan simbol markdown dari teks
  const cleanMarkdownText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Hilangkan bold **
      .replace(/\*(.*?)\*/g, '$1')     // Hilangkan italic *
      .replace(/#+\s/g, '')            // Hilangkan # heading
      .replace(/[`~_]/g, '')           // Hilangkan karakter sisa
      .trim();
  };

  const parseInlineMarkdown = (text: string) => {
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const innerText = part.slice(2, -2);
        return <strong key={i} className="font-bold text-slate-900">{innerText}</strong>;
      }
      // Bersihkan karakter markdown sisa (seperti single * atau # yang tersesat)
      return part.replace(/[*#_~`]/g, '');
    });
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, idx) => {
      let trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-3" />;

      // Judul Utama (Heading 1)
      if (trimmed.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-bold border-b-2 border-slate-300 pb-2 mb-4 mt-6 text-slate-900">{parseInlineMarkdown(trimmed.replace(/^#\s/, ''))}</h1>;
      }
      
      // Sub Judul (Heading 2)
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-bold mb-3 mt-5 text-slate-800">{parseInlineMarkdown(trimmed.replace(/^##\s/, ''))}</h2>;
      }

      // Point Penting (Heading 3 atau Bold Line)
      if (trimmed.startsWith('### ') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 100)) {
        let text = trimmed.replace(/^###\s/, '').replace(/\*\*/g, '');
        return <h3 key={idx} className="text-md font-bold mb-2 mt-4 text-slate-700 uppercase">{text}</h3>;
      }

      // Daftar List
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const text = trimmed.substring(2);
        return <li key={idx} className="ml-5 mb-1.5 list-disc text-slate-800 leading-relaxed">{parseInlineMarkdown(text)}</li>;
      }

      // Daftar Angka
      const olMatch = trimmed.match(/^\d+\.\s/);
      if (olMatch) {
        const text = trimmed.replace(/^\d+\.\s/, '');
        return <li key={idx} className="ml-5 mb-1.5 list-decimal text-slate-800 leading-relaxed">{parseInlineMarkdown(text)}</li>;
      }

      // Paragraf Standar
      return <p key={idx} className="mb-3 leading-relaxed text-slate-800 text-sm md:text-base">{parseInlineMarkdown(trimmed)}</p>;
    });
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* VIEW: DASHBOARD */}
        {activeView === 'dashboard' && (
          <>
            <div className="mb-10 text-center no-print">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">
                Ubah Materi Jadi <span className="text-indigo-600 underline decoration-indigo-200">Petualangan</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Rancang pembelajaran yang relevan dengan dunia murid Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
              <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <i className="fas fa-sliders-h text-indigo-500"></i> Konfigurasi RPP
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Instansi</label>
                      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                        <button 
                          onClick={() => setInstitutionType('Sekolah')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${institutionType === 'Sekolah' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Sekolah Umum
                        </button>
                        <button 
                          onClick={() => setInstitutionType('Madrasah')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${institutionType === 'Madrasah' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Madrasah
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Jenjang</label>
                      <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option>SD (Kelas 1-6)</option>
                        <option>SMP (Kelas 7-9)</option>
                        <option>SMA/K (Kelas 10-12)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Materi Pokok Kurikulum</label>
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Contoh: Fotosintesis, Puisi, Aljabar..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Minat Dominan Murid</label>
                    <InterestCloud selectedInterests={selectedInterests} toggleInterest={toggleInterest} />
                    <div className="mt-4 flex gap-2">
                      <input type="text" value={customInterest} onChange={(e) => setCustomInterest(e.target.value)} placeholder="Hobi lain..." className="flex-grow px-4 py-2 text-sm rounded-lg border border-slate-200" />
                      <button onClick={handleAddCustomInterest} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold hover:bg-slate-200">Tambah</button>
                    </div>
                  </div>
                  {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
                  <button onClick={handleGenerate} disabled={isGenerating} className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}`}>
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-3">
                        <i className="fas fa-spinner fa-spin"></i> Merancang RPP Terbaik...
                      </span>
                    ) : 'Generate RPP Berbasis Minat'}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-4">Profil Minat</h4>
                  <div className="h-48">
                    {selectedInterests.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart><Pie data={selectedInterests.map(i => ({name: i, value: 1}))} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">{selectedInterests.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic border-2 border-dashed border-slate-50 rounded-2xl">
                        <i className="fas fa-chart-pie text-3xl mb-2 opacity-10"></i>
                        <p>Pilih minat murid</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <i className="fas fa-lightbulb text-7xl rotate-12"></i>
                  </div>
                  <h4 className="font-bold text-lg mb-2 relative z-10 flex items-center gap-2">
                    <i className="fas fa-bolt text-yellow-400"></i> Insight Pedagogis
                  </h4>
                  <p className="text-indigo-100 text-sm leading-relaxed relative z-10 italic">"{currentTip}"</p>
                </div>
              </div>
            </div>

            {result && (
              <div ref={resultRef} className={`mt-12 mb-20 no-print transition-all duration-700 ${isDownloading ? 'generating-pdf' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Pratinjau RPP</h3>
                    <p className="text-xs text-slate-500">Materi: {result.topic} | Target: {grade}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleSavePlan} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isSaved ? 'bg-green-100 text-green-700' : 'bg-white border border-slate-200 text-indigo-600 hover:bg-slate-50 shadow-sm'}`}>
                      <i className={`fas ${isSaved ? 'fa-check-circle' : 'fa-save'}`}></i>
                      {isSaved ? 'Tersimpan' : 'Simpan'}
                    </button>
                    <button 
                      onClick={handleDownloadPdf} 
                      disabled={isDownloading}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:bg-indigo-400"
                    >
                      {isDownloading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
                      {isDownloading ? 'Menyiapkan...' : 'Download PDF'}
                    </button>
                    <button onClick={() => window.print()} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 flex items-center gap-2">
                      <i className="fas fa-print"></i> Cetak Langsung
                    </button>
                  </div>
                </div>
                
                {/* RPP Container for html2pdf */}
                <div ref={rppContentRef} className="a4-container animate-in fade-in duration-700">
                  <div className="border-b-4 border-double border-slate-900 pb-4 mb-8 text-center">
                    <h1 className="text-2xl font-black uppercase text-slate-900 mb-1">Rencana Pelaksanaan Pembelajaran (RPP)</h1>
                    <p className="text-sm italic text-slate-600 font-sans tracking-widest uppercase">
                      {institutionType === 'Madrasah' ? 'Berbasis KMA 1503/2025 & Diferensiasi Minat' : 'Berbasis Kurikulum Nasional & Diferensiasi Minat'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-8 text-[12px] font-sans border-b border-slate-100 pb-4">
                    <div className="flex"><span className="w-36 font-bold text-slate-800">Mata Pelajaran</span><span className="flex-1">: {result.topic}</span></div>
                    <div className="flex"><span className="w-36 font-bold text-slate-800">Nama Sekolah</span><span className="flex-1">: {teacherSettings.school}</span></div>
                    <div className="flex"><span className="w-36 font-bold text-slate-800">Guru Pengampu</span><span className="flex-1">: {teacherSettings.name}</span></div>
                    <div className="flex"><span className="w-36 font-bold text-slate-800">Fokus Minat</span><span className="flex-1 line-clamp-1">: {selectedInterests.join(', ')}</span></div>
                    <div className="flex"><span className="w-36 font-bold text-slate-800">Kelas / Jenjang</span><span className="flex-1">: {grade}</span></div>
                    <div className="flex"><span className="w-36 font-bold text-slate-800">Tanggal Terbit</span><span className="flex-1">: {result.timestamp}</span></div>
                  </div>

                  <div className="markdown-content font-serif">{renderContent(result.content)}</div>
                  
                  <div className="mt-16 grid grid-cols-2 gap-10 text-center text-sm pt-8 border-t border-dashed font-sans">
                    <div>
                      <p className="mb-24">Mengetahui,<br />Kepala {institutionType}</p>
                      <p className="font-bold underline uppercase">{teacherSettings.headmasterName || '( ............................................ )'}</p>
                      <p className="text-[10px] text-slate-500 mt-1">NIP. {teacherSettings.headmasterNip || '........................................'}</p>
                    </div>
                    <div>
                      <p className="mb-24">{teacherSettings.city}, {result.timestamp}<br />Guru Pengampu</p>
                      <p className="font-bold underline uppercase">{teacherSettings.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1">NIP. {teacherSettings.nip}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* VIEW: LIBRARY */}
        {activeView === 'library' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-archive text-indigo-500"></i> Koleksi RPP Saya
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedPlans.length > 0 ? savedPlans.map(plan => (
                <div key={plan.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-bold uppercase tracking-wider">DOKUMEN_RPP</span>
                      <button onClick={(e) => handleDeleteSavedPlan(plan.id!, e)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2 line-clamp-2 text-lg leading-tight">{plan.title}</h4>
                    <p className="text-xs text-slate-400 mb-6 flex items-center gap-2">
                      <i className="far fa-calendar-alt"></i> {plan.timestamp}
                    </p>
                  </div>
                  <button onClick={() => handleLoadSavedPlan(plan)} className="w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-sm">
                    Lihat Dokumen
                  </button>
                </div>
              )) : (
                <div className="col-span-full py-28 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-center">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
                    <i className="fas fa-folder-open text-3xl text-slate-300"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Belum Ada RPP Tersimpan</h3>
                  <p className="text-slate-400 max-w-xs mx-auto text-sm">Rancang RPP pertama Anda dan simpan ke koleksi untuk diakses kapan saja.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: STUDENTS */}
        {activeView === 'students' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-users text-indigo-500"></i> Profil Kelas
              </h2>
              <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all">
                + Tambah Kelas Baru
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classProfiles.map(cls => (
                <div key={cls.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col hover:border-indigo-200 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{cls.name}</h3>
                      <p className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg inline-block mt-2">
                        {cls.studentCount} Murid
                      </p>
                    </div>
                    <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center text-slate-300">
                      <i className="fas fa-school text-xl"></i>
                    </div>
                  </div>
                  <div className="mb-8">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Hobi Dominan:</p>
                    <div className="flex flex-wrap gap-2">
                      {cls.interests.map(i => (
                        <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 text-[10px] rounded-xl font-bold uppercase">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setGrade(cls.id === '1' ? 'SD (Kelas 1-6)' : cls.id === '2' ? 'SMP (Kelas 7-9)' : 'SMA/K (Kelas 10-12)');
                      setSelectedInterests(cls.interests);
                      setActiveView('dashboard');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="mt-auto w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-indigo-600 shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-magic"></i> Gunakan Profil Kelas Ini
                  </button>
                </div>
              ))}
              <div className="border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-12 text-slate-400 cursor-pointer hover:bg-white hover:border-indigo-300 hover:text-indigo-400 transition-all group">
                <i className="fas fa-plus-circle text-4xl mb-3 group-hover:scale-110 transition-transform"></i>
                <p className="font-bold text-sm">Buat Profil Kelas Baru</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SETTINGS */}
        {activeView === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-400">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <i className="fas fa-sliders-h text-indigo-500"></i> Pengaturan Aplikasi
            </h2>
            
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b bg-slate-50/30 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-3">
                  <i className="fas fa-id-card-alt text-indigo-500"></i> Identitas & Tanda Tangan
                </h3>
              </div>
              <form onSubmit={saveSettings} className="p-10 space-y-10">
                {/* Bagian Guru */}
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-indigo-600 border-b pb-2 flex items-center gap-2 uppercase tracking-widest">
                    <i className="fas fa-chalkboard-teacher"></i> Profil Guru
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nama & Gelar Lengkap</label>
                      <input type="text" value={teacherSettings.name} onChange={e => setTeacherSettings({...teacherSettings, name: e.target.value})} className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">NIP (Opsional)</label>
                      <input type="text" value={teacherSettings.nip} onChange={e => setTeacherSettings({...teacherSettings, nip: e.target.value})} className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Bagian Kepala Sekolah */}
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-emerald-600 border-b pb-2 flex items-center gap-2 uppercase tracking-widest">
                    <i className="fas fa-user-tie"></i> Kepala Sekolah / Madrasah
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nama Kepala & Gelar</label>
                      <input type="text" value={teacherSettings.headmasterName} onChange={e => setTeacherSettings({...teacherSettings, headmasterName: e.target.value})} placeholder="Nama Kepala Sekolah" className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">NIP Kepala</label>
                      <input type="text" value={teacherSettings.headmasterNip} onChange={e => setTeacherSettings({...teacherSettings, headmasterNip: e.target.value})} placeholder="NIP Kepala" className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Bagian Instansi */}
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-500 border-b pb-2 flex items-center gap-2 uppercase tracking-widest">
                    <i className="fas fa-school"></i> Data Satuan Pendidikan
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nama Satuan Pendidikan</label>
                      <input type="text" value={teacherSettings.school} onChange={e => setTeacherSettings({...teacherSettings, school: e.target.value})} className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Kabupaten/Kota</label>
                      <input type="text" value={teacherSettings.city} onChange={e => setTeacherSettings({...teacherSettings, city: e.target.value})} className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-50">
                  <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:bg-indigo-600 active:scale-[0.98] transition-all flex items-center gap-3">
                    <i className="fas fa-check-circle"></i> Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex gap-5 items-center">
                <div className="bg-emerald-100 w-16 h-16 rounded-3xl flex items-center justify-center text-emerald-600 text-3xl">
                  <i className="fas fa-award"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg tracking-tight">Status Berlangganan PRO</h3>
                  <p className="text-sm text-slate-500">Akses Tanpa Batas AI Generative & KMA 1503/2025.</p>
                  <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg inline-block mt-2 uppercase tracking-widest">
                    <i className="far fa-calendar-check mr-2"></i> Aktif: 31 Desember 2026
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="text-[10px] text-red-400 font-bold hover:text-red-600 transition-colors uppercase tracking-tighter opacity-50">Hapus Sinkronisasi Data</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
