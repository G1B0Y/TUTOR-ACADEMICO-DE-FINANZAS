import React, { useState, useEffect } from 'react';

// Helper para conectar con Electron
const ipc = window.require ? window.require('electron').ipcRenderer : null;

// --- ÍCONOS SVG ---
const PdfIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="6" y="18" fill="#E53935" fontSize="6" fontWeight="bold">PDF</text>
  </svg>
);

const ExcelIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="6" y="18" fill="#43A047" fontSize="6" fontWeight="bold">XLS</text>
  </svg>
);

const VideoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#1E88E5" strokeWidth="2"/>
    <path d="M10 8L16 12L10 16V8Z" fill="#1E88E5"/>
  </svg>
);

const ExamIcon = () => <span className="text-xl">📝</span>;

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [syllabusData, setSyllabusData] = useState([]); 
  const [examsList, setExamsList] = useState([]); 
  const [userGrades, setUserGrades] = useState({}); 

  const [selectedExam, setSelectedExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); 
  const [examResult, setExamResult] = useState({ submitted: false, grade: 0 });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('finanzasUser');
    const savedId = localStorage.getItem('finanzasUserId');
    if (savedUser && savedId) {
      setCurrentUser(savedUser);
      setCurrentUserId(Number(savedId));
      loadData(Number(savedId));
    } else {
      loadData(null);
    }
  }, []);

  const loadData = async (userId) => {
    if (ipc) {
      try {
        const data = await ipc.invoke('get-syllabus');
        setSyllabusData(data);
        const allExams = [];
        data.forEach(week => {
          week.materials.forEach(mat => {
            if (mat.es_evaluable === 1) allExams.push({ ...mat, weekName: week.title });
          });
        });
        setExamsList(allExams);
        if (userId) {
          const result = await ipc.invoke('get-user-grades', userId);
          if (result.success) {
            const gradesMap = {};
            result.grades.forEach(g => { gradesMap[g.material_id] = g.nota; });
            setUserGrades(gradesMap);
          }
        }
      } catch (error) { console.error("Error cargando datos:", error); }
    } else {
      setSyllabusData(mockSyllabus); 
    }
  };

  const handleMaterialClick = async (material) => {
    if (material.es_evaluable === 1) {
      if (!currentUser) { setShowAuthModal(true); return; }
      setSelectedExam(material);
      setExamQuestions([]);
      setUserAnswers({});
      const existingGrade = userGrades[material.id];
      setExamResult(existingGrade !== undefined ? { submitted: true, grade: existingGrade } : { submitted: false, grade: 0 });
      setCurrentView('takingExam');
      if (ipc) {
        const result = await ipc.invoke('get-random-exam', material.id);
        if (result.success) setExamQuestions(result.questions);
      }
    } else {
      if (ipc) await ipc.invoke('open-file-native', { fileName: material.archivo_ruta, type: material.tipo });
      else alert("Función solo disponible en la versión de escritorio.");
    }
  };

  const handleSelectOption = (qId, altId) => { if (!examResult.submitted) setUserAnswers(prev => ({ ...prev, [qId]: altId })); };

  const handleSubmitExam = async () => {
    if (!window.confirm("¿Enviar respuestas?")) return;
    let correctas = 0;
    examQuestions.forEach(q => {
      const correctAlt = q.alternativas.find(a => a.es_correcta === 1);
      if (correctAlt && userAnswers[q.id] === correctAlt.id) correctas++;
    });
    const notaFinal = examQuestions.length > 0 ? Math.round((correctas / examQuestions.length) * 20) : 0;
    setExamResult({ submitted: true, grade: notaFinal });
    setUserGrades(prev => ({ ...prev, [selectedExam.id]: notaFinal }));
    if (ipc && currentUserId) {
      await ipc.invoke('submit-exam-grade', { userId: currentUserId, materialId: selectedExam.id, nota: notaFinal });
      alert(`Nota Final: ${notaFinal}/20`);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) { alert("Completa los campos"); return; }
    if (!ipc) { setCurrentUser(usernameInput); setShowAuthModal(false); return; }
    try {
      const channel = authMode === 'login' ? 'login-user' : 'register-user';
      const result = await ipc.invoke(channel, { username: usernameInput, password: passwordInput });
      if (result.success) {
        const user = authMode === 'login' ? result.user.username : usernameInput;
        const uid = authMode === 'login' ? result.user.id : result.userId;
        setCurrentUser(user); setCurrentUserId(uid);
        localStorage.setItem('finanzasUser', user); localStorage.setItem('finanzasUserId', uid);
        loadData(uid); setShowAuthModal(false);
      } else { alert(result.message); }
    } catch (err) { console.error(err); }
    setUsernameInput(''); setPasswordInput('');
  };

  const handleLogout = () => { setCurrentUser(null); setCurrentUserId(null); setUserGrades({}); localStorage.clear(); setCurrentView('home'); };
  const handleReset = async () => { if (ipc && currentUserId && confirm("¿Borrar progreso?")) { await ipc.invoke('reset-progress', currentUserId); setUserGrades({}); alert("Reiniciado."); } };

  const getMaterialIcon = (type) => {
    switch(type) {
      case 'pdf': return <PdfIcon />;
      case 'excel': return <ExcelIcon />;
      case 'video': return <VideoIcon />;
      default: return <ExamIcon />;
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative">
      <nav className="bg-white shadow-sm p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-indigo-600 text-white w-8 h-8 rounded flex items-center justify-center font-bold">F</div>
            <span className="font-bold text-xl text-slate-800">FinanzasIA</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <button onClick={() => setCurrentView('home')} className="hover:text-indigo-600 font-medium">Inicio</button>
            <button onClick={() => setCurrentView('temario')} className="hover:text-indigo-600 font-medium">Temario</button>
            <button onClick={() => setCurrentView('examenes')} className="hover:text-indigo-600 font-medium">Evaluaciones</button>
          </div>
          <div>
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                <span className="font-bold text-indigo-700">{currentUser}</span>
                <button onClick={handleReset} className="text-xs text-orange-600 font-bold border-l pl-3 hover:text-orange-800">Reiniciar</button>
                <button onClick={handleLogout} className="text-xs text-red-600 font-bold border-l pl-3 hover:text-red-800">Salir</button>
              </div>
            ) : <button onClick={() => setShowAuthModal(true)} className="bg-indigo-600 text-white px-5 py-2 rounded font-bold hover:bg-indigo-700">Ingresar</button>}
          </div>
        </div>
      </nav>

      <div className="flex-grow w-full max-w-6xl mx-auto p-6">
        {currentView === 'home' && (
          <div className="text-center mt-12">
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">Monografía 02</span>
            <h1 className="text-5xl font-extrabold mt-6 text-slate-900">Tutor de Gestión Financiera</h1>
            <p className="text-xl text-slate-500 mt-4 mb-8">Estudia offline, rinde tus exámenes y sigue tu progreso.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setCurrentView('temario')} className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-bold shadow-lg">Ver Temario</button>
              {!currentUser && <button onClick={() => setShowAuthModal(true)} className="bg-white border border-indigo-200 text-indigo-600 px-8 py-3 rounded-lg text-lg font-bold">Registrarse</button>}
            </div>
          </div>
        )}

        {currentView === 'temario' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold mb-6 text-center">Plan de Estudios</h2>
            {syllabusData.map(week => (
              <div key={week.weekId} className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                <div onClick={() => setExpandedWeek(expandedWeek === week.weekId ? null : week.weekId)} className="flex p-4 cursor-pointer hover:bg-slate-50 transition">
                  <div className="bg-slate-100 text-slate-600 font-bold p-3 rounded mr-4 text-center min-w-[3.5rem]"><div className="text-xs">SEM</div><div className="text-xl">{week.weekId}</div></div>
                  <div className="flex-grow flex items-center justify-between"><h3 className="font-bold text-lg text-slate-800">{week.title}</h3><span>{expandedWeek === week.weekId ? '▲' : '▼'}</span></div>
                </div>
                {expandedWeek === week.weekId && (
                  <div className="bg-slate-50 border-t p-4 space-y-2">
                    {week.materials.map((mat, i) => {
                      const nota = userGrades[mat.id];
                      return (
                        <div key={i} onClick={() => handleMaterialClick(mat)} className={`flex items-center p-3 bg-white border rounded cursor-pointer hover:shadow-md transition ${mat.es_evaluable ? 'border-orange-200 hover:border-orange-400' : 'border-slate-200 hover:border-indigo-400'}`}>
                          <span className="mr-4 w-6 flex justify-center">{getMaterialIcon(mat.tipo)}</span>
                          <div className="flex-grow">
                            <span className={`font-medium ${mat.tipo === 'video' ? 'text-indigo-600' : 'text-slate-700'}`}>{mat.titulo}</span>
                            {mat.es_evaluable === 1 && (
                              nota !== undefined 
                                ? <span className="ml-2 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">NOTA: {nota}</span>
                                : <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded">EXAMEN</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {currentView === 'examenes' && (
          <div className="max-w-4xl mx-auto space-y-4">
             <h2 className="text-3xl font-bold mb-6 text-center">Evaluaciones Disponibles</h2>
             {examsList.length === 0 && <p className="text-center text-slate-500 italic">No hay exámenes disponibles aún.</p>}
             {examsList.map((exam, i) => {
               const nota = userGrades[exam.id];
               return (
                 <div key={i} onClick={() => handleMaterialClick(exam)} className={`bg-white p-5 rounded-lg shadow border cursor-pointer flex justify-between items-center transition ${nota !== undefined ? 'border-green-200 bg-green-50' : 'border-slate-200 hover:border-indigo-400'}`}>
                   <div><h3 className="font-bold text-indigo-700">{exam.titulo}</h3><p className="text-sm text-slate-500">{exam.weekName}</p></div>
                   {nota !== undefined ? (
                     <div className="text-right">
                       <span className="block text-xs font-bold text-green-600 uppercase">Calificado</span>
                       <span className="text-xl font-bold text-slate-800">{nota} / 20</span>
                     </div>
                   ) : (
                     <button className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold">Rendir</button>
                   )}
                 </div>
               )
             })}
          </div>
        )}

        {currentView === 'takingExam' && selectedExam && (
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
            <div className="bg-indigo-600 p-6 text-white">
              <h1 className="text-2xl font-bold">{selectedExam.titulo}</h1>
              <p className="opacity-90">
                {examResult.submitted ? "Examen finalizado. Revisa tu calificación." : "Responde las preguntas. Tienes un intento."}
              </p>
            </div>

            <div className="p-8 space-y-8">
              {examQuestions.length > 0 ? examQuestions.map((q, idx) => (
                <div key={q.id} className="border-b pb-6 last:border-0">
                  <h3 className="font-bold text-lg mb-3">{idx + 1}. {q.enunciado}</h3>
                  <div className="space-y-2">
                    {q.alternativas.map(alt => {
                      const isSelected = userAnswers[q.id] === alt.id;
                      let style = "border-slate-200 hover:bg-slate-50";
                      
                      if (examResult.submitted) {
                         if (alt.es_correcta) style = "bg-green-100 border-green-500 text-green-800";
                         else if (isSelected) style = "bg-red-100 border-red-500 text-red-800";
                         else style = "opacity-50 border-slate-100";
                      } else if (isSelected) {
                        style = "border-indigo-600 bg-indigo-50 text-indigo-800";
                      }

                      return (
                        <div key={alt.id} onClick={() => handleSelectOption(q.id, alt.id)} className={`p-3 border rounded cursor-pointer flex items-center gap-3 ${style}`}>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-400'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                          </div>
                          <span>{alt.texto}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )) : <p className="text-center py-10">Cargando preguntas...</p>}
            </div>

            <div className="bg-slate-50 p-6 border-t flex justify-between items-center sticky bottom-0">
              <button onClick={() => setCurrentView('temario')} className="text-slate-500 hover:text-indigo-600">Cancelar</button>
              {examResult.submitted ? (
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg">Nota Final: <span className={examResult.grade >= 11 ? "text-green-600" : "text-red-600"}>{examResult.grade}/20</span></span>
                  <button onClick={() => setCurrentView('temario')} className="bg-slate-800 text-white px-6 py-2 rounded font-bold">Salir</button>
                </div>
              ) : (
                <button onClick={handleSubmitExam} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md">Enviar Examen</button>
              )}
            </div>
          </div>
        )}

      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
           <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
             <h2 className="text-2xl font-bold text-center mb-6">{authMode === 'login' ? 'Bienvenido' : 'Crear Cuenta'}</h2>
             <form onSubmit={handleAuth} className="space-y-4">
               <input className="w-full border p-3 rounded-lg" placeholder="Usuario" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} />
               <div className="relative">
                 <input className="w-full border p-3 rounded-lg pr-10" type={showPassword ? "text" : "password"} placeholder="Contraseña" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400">👁️</button>
               </div>
               <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">{authMode === 'login' ? 'Entrar' : 'Registrarse'}</button>
             </form>
             <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="block w-full text-center text-sm text-indigo-600 mt-4 hover:underline">{authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}</button>
             <button onClick={() => setShowAuthModal(false)} className="block w-full text-center text-xs text-slate-400 mt-4">Cancelar</button>
           </div>
        </div>
      )}
    </div>
  );
}

const mockSyllabus = [{ weekId: 1, title: "Semana 1", materials: [] }];