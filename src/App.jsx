import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- CAMBIO 1: Importamos la imagen del fondo ---
import fondoUni from './assets/fondo_uni.jpeg';

const ipc = window.require ? window.require('electron').ipcRenderer : null;

const PdfIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H20" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><text x="6" y="18" fill="#E53935" fontSize="6" fontWeight="bold">PDF</text></svg>);
const ExcelIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H20" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><text x="6" y="18" fill="#43A047" fontSize="6" fontWeight="bold">XLS</text></svg>);
const VideoIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#1E88E5" strokeWidth="2"/><path d="M10 8L16 12L10 16V8Z" fill="#1E88E5"/></svg>);
const ExamIcon = () => <span className="text-xl">📝</span>;
const COLORS = ['#10B981', '#EF4444']; 

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [syllabusData, setSyllabusData] = useState([]); 
  const [examsList, setExamsList] = useState([]); 
  
  const [userGrades, setUserGrades] = useState({}); 
  const [userSavedAnswers, setUserSavedAnswers] = useState({});
  const [userStats, setUserStats] = useState({ promedio: 0, aprobados: 0, desaprobados: 0, temas: [] });

  const [selectedExam, setSelectedExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); 
  const [examResult, setExamResult] = useState({ submitted: false, grade: 0 });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);

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
          week.materials.forEach(mat => { if (mat.es_evaluable === 1) allExams.push({ ...mat, weekName: week.title }); });
        });
        setExamsList(allExams);

        if (userId) {
          const result = await ipc.invoke('get-user-grades', userId);
          if (result.success) {
            const gradesMap = {};
            const answersMap = {};
            result.grades.forEach(g => {
               gradesMap[g.material_id] = g.nota;
               if (g.answers) { try { answersMap[g.material_id] = JSON.parse(g.answers); } catch(e){} }
            });
            setUserGrades(gradesMap);
            setUserSavedAnswers(answersMap);
          }
          const stats = await ipc.invoke('get-stats', userId);
          if (stats.success) setUserStats(stats);
        }
      } catch (error) { console.error("Error cargando datos:", error); }
    } else {
      setSyllabusData([{ weekId: 1, title: "Semana 1", materials: [] }]);
    }
  };

  const getGradeColorClass = (grade) => {
    if (grade < 10) return 'text-red-600 bg-red-50 border-red-200';
    if (grade >= 10 && grade <= 13) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const handleMaterialClick = async (material) => {
    if (material.es_evaluable === 1) {
      if (!currentUser) { setShowAuthModal(true); return; }
      setSelectedExam(material);
      setExamQuestions([]);
      setUserAnswers({});
      
      const existingGrade = userGrades[material.id];
      if (existingGrade !== undefined) {
        setExamResult({ submitted: true, grade: existingGrade });
        const savedAns = userSavedAnswers[material.id] || {};
        setUserAnswers(savedAns);
        
        const questionIds = Object.keys(savedAns).map(Number);
        if (questionIds.length > 0 && ipc) {
             const result = await ipc.invoke('get-questions-by-ids', questionIds);
             if (result.success) setExamQuestions(result.questions);
        } else if (ipc) {
             const result = await ipc.invoke('get-random-exam', material.id);
             if (result.success) setExamQuestions(result.questions);
        }
      } else {
        setExamResult({ submitted: false, grade: 0 });
        if (ipc) {
          const result = await ipc.invoke('get-random-exam', material.id);
          if (result.success) setExamQuestions(result.questions);
        }
      }
      setCurrentView('takingExam');
    } else {
      if (ipc) await ipc.invoke('open-file-native', { fileName: material.archivo_ruta, type: material.tipo });
      else alert("Función solo disponible en escritorio.");
    }
  };

  const handleSelectOption = (qId, altId) => {
    if (examResult.submitted) return; 
    setUserAnswers(prev => ({ ...prev, [qId]: altId }));
  };

  const handleSubmitExam = async () => {
    if (Object.keys(userAnswers).length < examQuestions.length) {
      if(!window.confirm("No has respondido todo. ¿Enviar?")) return;
    } else if(!window.confirm("¿Seguro que deseas enviar?")) return;

    let correctas = 0;
    examQuestions.forEach(q => {
      const selectedId = userAnswers[q.id];
      const correctAlt = q.alternativas.find(a => a.es_correcta === 1);
      if (correctAlt && selectedId === correctAlt.id) correctas++;
    });

    const notaFinal = examQuestions.length > 0 ? Math.round((correctas / examQuestions.length) * 20) : 0;

    setExamResult({ submitted: true, grade: notaFinal });
    setUserGrades(prev => ({ ...prev, [selectedExam.id]: notaFinal }));
    setUserSavedAnswers(prev => ({ ...prev, [selectedExam.id]: userAnswers }));

    if (ipc && currentUserId) {
      await ipc.invoke('submit-exam-grade', {
        userId: currentUserId,
        materialId: selectedExam.id,
        nota: notaFinal,
        answers: JSON.stringify(userAnswers)
      });
      alert(`Nota Final: ${notaFinal}/20`);
      loadData(currentUserId);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) { alert("Completa los campos"); return; }
    
    setIsLoading(true); 

    try {
      if (!ipc) { 
        setCurrentUser(usernameInput); setShowAuthModal(false); 
        setIsLoading(false);
        return; 
      }

      const channel = authMode === 'login' ? 'login-user' : 'register-user';
      const result = await ipc.invoke(channel, { username: usernameInput, password: passwordInput });
      
      if (result.success) {
        const user = authMode === 'login' ? result.user.username : usernameInput;
        const uid = authMode === 'login' ? result.user.id : result.userId;
        setCurrentUser(user); setCurrentUserId(uid);
        localStorage.setItem('finanzasUser', user); localStorage.setItem('finanzasUserId', uid);
        loadData(uid); setShowAuthModal(false);
        
        setUsernameInput(''); 
        setPasswordInput('');
      } else { 
        alert(result.message);
      }
    } catch (err) { 
      console.error(err);
      alert("Error interno o de base de datos."); 
    } finally {
      setIsLoading(false); 
    }
  };

  const handleLogout = () => { setCurrentUser(null); setCurrentUserId(null); setUserGrades({}); setUserSavedAnswers({}); localStorage.clear(); setCurrentView('home'); };
  
  const handleReset = async () => {
    if (confirm("¿BORRAR todo tu progreso?")) {
      if (ipc && currentUserId) await ipc.invoke('reset-progress', currentUserId);
      setUserGrades({}); setUserSavedAnswers({}); setUserStats({ promedio: 0, aprobados: 0, desaprobados: 0, temas: [] });
      alert("Reiniciado."); setCurrentView('home');
    }
  };

  const getMaterialIcon = (type) => {
    switch(type) {
      case 'pdf': return <PdfIcon />;
      case 'excel': return <ExcelIcon />;
      case 'video': return <VideoIcon />;
      default: return <ExamIcon />;
    }
  };
  
  return (
    // --- CAMBIO 2: Aplicamos el fondo al contenedor principal ---
    <div 
      className="min-h-screen text-slate-900 font-sans flex flex-col relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${fondoUni})` }}
    >
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm p-4 sticky top-0 z-50"> 
        {/* Nota: Agregué 'bg-white/90 backdrop-blur-sm' al nav para que se vea bien sobre el fondo */}
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-indigo-600 text-white w-8 h-8 rounded flex items-center justify-center font-bold">TF</div>
            <span className="font-bold text-xl text-slate-800">TutoFinanzas</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <button onClick={() => setCurrentView('home')} className="hover:text-indigo-600 font-medium">Inicio</button>
            <button onClick={() => setCurrentView('temario')} className="hover:text-indigo-600 font-medium">Material</button>
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

      <div className="flex-grow w-full max-w-7xl mx-auto p-6">
        {currentView === 'home' && (
          <div className="text-center mt-12 bg-white/80 p-10 rounded-2xl backdrop-blur-sm shadow-xl"> 
            {/* Nota: Agregué un fondo blanco semitransparente al home para que el texto sea legible */}
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">Finanzas</span>
            <h1 className="text-5xl font-extrabold mt-6 text-slate-900">Tutor de Gestión Financiera</h1>
            <p className="text-xl text-slate-500 mt-4 mb-8">Estudia offline, rinde tus exámenes y sigue tu progreso.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setCurrentView('temario')} className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-bold shadow-lg">Ver Material</button>
            </div>
          </div>
        )}

        {currentView === 'temario' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold mb-6 text-center text-white drop-shadow-md">Material Gestión Financiera</h2>
            {syllabusData.map(week => (
              <div key={week.weekId} className="bg-white/95 rounded-lg shadow border border-slate-200 overflow-hidden">
                <div onClick={() => setExpandedWeek(expandedWeek === week.weekId ? null : week.weekId)} className="flex p-4 cursor-pointer hover:bg-slate-50 transition items-center">
                  <div className={`text-slate-600 font-bold p-3 rounded mr-4 text-center min-w-[3.5rem] ${week.weekId === 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100'}`}>
                    {week.weekId === 0 ? <div className="text-xl">📚</div> : <><div className="text-xs">TEMA</div><div className="text-xl">{week.weekId}</div></>}
                  </div>
                  <div className="flex-grow flex items-center justify-between"><h3 className="font-bold text-lg text-slate-800">{week.title}</h3><span>{expandedWeek === week.weekId ? '▲' : '▼'}</span></div>
                </div>
                {expandedWeek === week.weekId && (
                  <div className="bg-slate-50 border-t p-4 space-y-2">
                    {week.materials.length === 0 ? <p className="text-center text-slate-400 italic">No hay material cargado.</p> :
                      week.materials.map((mat, i) => {
                        const nota = userGrades[mat.id];
                        return (
                          <div key={i} onClick={() => handleMaterialClick(mat)} className={`flex items-center p-3 bg-white border rounded cursor-pointer hover:shadow-md transition ${mat.es_evaluable ? 'border-orange-200 hover:border-orange-400' : 'border-slate-200 hover:border-indigo-400'}`}>
                            <span className="mr-4 w-6 flex justify-center">{getMaterialIcon(mat.tipo)}</span>
                            <div className="flex-grow">
                              <span className={`font-medium ${mat.tipo === 'video' ? 'text-indigo-600' : 'text-slate-700'}`}>{mat.titulo}</span>
                              {mat.es_evaluable === 1 && (
                                nota !== undefined 
                                  ? <span className={`ml-2 text-xs font-bold px-2 py-1 rounded border ${getGradeColorClass(nota)}`}>NOTA: {nota}</span>
                                  : <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded">EXAMEN</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {currentView === 'examenes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold mb-4 text-white drop-shadow-md">Evaluaciones Disponibles</h2>
              {examsList.length === 0 && <p className="text-center text-slate-500 italic">No hay exámenes disponibles aún.</p>}
              {examsList.map((exam, i) => {
                const nota = userGrades[exam.id];
                return (
                  <div key={i} onClick={() => handleMaterialClick(exam)} className={`bg-white/95 p-5 rounded-lg shadow border cursor-pointer flex justify-between items-center transition ${nota !== undefined ? 'border-green-200 bg-green-50' : 'border-slate-200 hover:border-indigo-400'}`}>
                    <div>
                      <h3 className="font-bold text-indigo-700">{exam.titulo}</h3>
                      <p className="text-sm text-slate-500">{exam.weekName}</p>
                    </div>
                    {nota !== undefined ? (
                      <div className="text-right">
                        <span className="block text-xs font-bold text-green-600 uppercase">Calificado</span>
                        <span className={`text-xl font-bold ${getGradeColorClass(nota).split(' ')[0]}`}>{nota} / 20</span>
                      </div>
                    ) : (
                      <button className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold">Rendir</button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="md:col-span-1">
              <div className="bg-white/95 p-6 rounded-xl shadow-lg border border-slate-200 sticky top-24">
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Tu Progreso 📊</h3>
                {currentUser ? (
                  <>
                    <div className="mb-6 text-center">
                      <p className="text-sm text-slate-500">Promedio General</p>
                      <div className={`text-4xl font-extrabold ${getGradeColorClass(userStats.promedio).split(' ')[0]}`}>{userStats.promedio.toFixed(1)}</div>
                      <p className="text-xs text-slate-400 mt-1">sobre 20</p>
                    </div>
                    <div className="h-48 w-full mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{ name: 'Aprobados', value: userStats.aprobados }, { name: 'Desaprobados', value: userStats.desaprobados }]} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                            <Cell key="cell-0" fill={COLORS[0]} /><Cell key="cell-1" fill={COLORS[1]} />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 text-xs">
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Aprobados ({userStats.aprobados})</span>
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Repasar ({userStats.desaprobados})</span>
                      </div>
                    </div>
                    <div className="h-40 w-full mt-6">
                      <p className="text-xs font-bold text-slate-500 mb-2">Rendimiento por Tema</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userStats.temas}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" hide />
                          <YAxis domain={[0, 20]} width={20} style={{fontSize: '10px'}} />
                          <Tooltip />
                          <Bar dataKey="nota" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-800 border border-indigo-100">
                      <strong>💡 Feedback IA:</strong>
                      <p className="mt-1">
                        {userStats.promedio === 0 ? "¡Rinde exámenes para ver tu progreso!" : userStats.promedio >= 14 ? "¡Excelente! Dominas los conceptos." : userStats.promedio >= 11 ? "Vas bien, pero repasa los temas bajos." : "Necesitas reforzar. Revisa el material del Tema 0."}
                      </p>
                    </div>
                  </>
                ) : <p className="text-center text-slate-400">Inicia sesión para ver tus estadísticas.</p>}
              </div>
            </div>
          </div>
        )}

        {currentView === 'takingExam' && selectedExam && (
          <div className="max-w-3xl mx-auto bg-white/95 rounded-xl shadow-xl overflow-hidden border border-slate-200">
            <div className="bg-indigo-600 p-6 text-white">
              <h1 className="text-2xl font-bold">{selectedExam.titulo}</h1>
              <p className="opacity-90">
                {examResult.submitted ? "Revisión: Tus respuestas marcadas" : "Responde las preguntas. Tienes un intento."}
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
                      let indicator = null;
                      if (examResult.submitted) {
                         if (alt.es_correcta) {
                             style = "bg-green-100 border-green-500 text-green-800 font-semibold";
                             indicator = "✅ Correcta";
                         } else if (isSelected && !alt.es_correcta) {
                             style = "bg-red-100 border-red-500 text-red-800"; 
                             indicator = "❌ Tu respuesta";
                         } else {
                             style = "opacity-50 border-slate-100"; 
                         }
                      } else if (isSelected) {
                        style = "border-indigo-600 bg-indigo-50 text-indigo-800";
                      }

                      return (
                        <div key={alt.id} onClick={() => handleSelectOption(q.id, alt.id)} className={`p-3 border rounded cursor-pointer flex items-center justify-between gap-3 ${style}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-400'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </div>
                            <span>{alt.texto}</span>
                          </div>
                          {indicator && <span className="text-xs font-bold ml-2">{indicator}</span>}
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
                  <span className={`font-bold text-xl ${getGradeColorClass(examResult.grade).split(' ')[0]}`}>Nota Final: {examResult.grade}/20</span>
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
               <input disabled={isLoading} className="w-full border p-3 rounded-lg disabled:opacity-50" placeholder="Usuario" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} />
               <div className="relative">
                 <input disabled={isLoading} className="w-full border p-3 rounded-lg pr-10 disabled:opacity-50" type={showPassword ? "text" : "password"} placeholder="Contraseña" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400">👁️</button>
               </div>
               <button disabled={isLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold disabled:bg-indigo-300">
                 {isLoading ? 'Verificando...' : (authMode === 'login' ? 'Entrar' : 'Registrarse')}
               </button>
             </form>
             <button disabled={isLoading} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="block w-full text-center text-sm text-indigo-600 mt-4 hover:underline disabled:opacity-50">{authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}</button>
             <button disabled={isLoading} onClick={() => setShowAuthModal(false)} className="block w-full text-center text-xs text-slate-400 mt-4 disabled:opacity-50">Cancelar</button>
           </div>
        </div>
      )}
    </div>
  );
}