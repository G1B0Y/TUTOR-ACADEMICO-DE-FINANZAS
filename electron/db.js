import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = process.env.NODE_ENV === 'development'
  ? path.join(process.cwd(), 'sistema_finanzas.db') 
  : path.join(app.getPath('userData'), 'sistema_finanzas.db');

const db = new Database(dbPath);

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, nombre_completo TEXT);
    CREATE TABLE IF NOT EXISTS semanas (id INTEGER PRIMARY KEY, titulo TEXT);
    CREATE TABLE IF NOT EXISTS materiales (id INTEGER PRIMARY KEY AUTOINCREMENT, semana_id INTEGER, titulo TEXT, tipo TEXT, archivo_ruta TEXT, es_evaluable INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS entregas (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER, material_id INTEGER, fecha_entrega TEXT, ruta_archivo_alumno TEXT, nota REAL, estado TEXT DEFAULT 'No entregado');
    CREATE TABLE IF NOT EXISTS preguntas (id INTEGER PRIMARY KEY AUTOINCREMENT, material_id INTEGER, enunciado TEXT, puntaje INTEGER DEFAULT 2);
    CREATE TABLE IF NOT EXISTS alternativas (id INTEGER PRIMARY KEY AUTOINCREMENT, pregunta_id INTEGER, texto TEXT, es_correcta INTEGER DEFAULT 0);
  `);

  const check = db.prepare('SELECT count(*) as count FROM semanas').get();
  if (check.count === 0) {
    console.log("Inicializando base de datos completa...");
    seedDatabase();
  }
}

function seedDatabase() {
  // --- 1. INSERTAR SEMANAS ---
  const insertSemana = db.prepare('INSERT INTO semanas (id, titulo) VALUES (?, ?)');
  insertSemana.run(1, 'CONTABILIDAD FINANCIERA');
  insertSemana.run(2, 'EL PROCESO CONTABLE Y LA FORMULACIÓN DE LOS ESTADOS FINANCIEROS');
  insertSemana.run(3, 'MARCO CONCEPTUAL DE COSTOS Y FLUJO DE COSTOS EMPRESARIALES');
  insertSemana.run(4, 'METODOLOGIA DE COSTEO DE LOS ELEMENTOS DE COSTOS');
  insertSemana.run(5, 'SISTEMA DE COSTEO TRADICIONAL: ORDENES DE TRABAJO');
  insertSemana.run(6, 'SISTEMA DE COSTEO TRADICIONAL: PROCESOS Y ESTANDAR');
  insertSemana.run(7, 'SISTEMA DE COSTEO MODERNO: COSTEO ABC');
  insertSemana.run(8, 'EXAMEN PARCIAL / REPASO');
  insertSemana.run(9, 'TOMA DE DECISIONES BASADAS EN COSTOS');
  insertSemana.run(10, 'SISTEMA DE GESTIÓN PRESUPUESTAL');
  insertSemana.run(11, 'FUNDAMENTOS DE FINANZAS Y FINANZAS DE CORTO PLAZO');
  insertSemana.run(12, 'GESTIÓN FINANCIERA ENFOCADA AL ACCIONISTA');
  insertSemana.run(13, 'ANALISIS E INTERPRETACIÓN DE LOS ESTADOS FINANCIEROS');
  insertSemana.run(14, 'LA DECISIÓN DE INVERSIÓN');

  // --- 2. INSERTAR MATERIALES ---
  const insertMat = db.prepare('INSERT INTO materiales (semana_id, titulo, tipo, archivo_ruta, es_evaluable) VALUES (?, ?, ?, ?, ?)');

  // >>> SEMANA 01 (Nombres corregidos sin dos puntos)
  insertMat.run(1, 'DL 1488 Depreciacion', 'pdf', 'semana01/DL 1488 Depreciacion.pdf', 0);
  insertMat.run(1, 'Impuesto Renta Cap VI', 'pdf', 'semana01/Impuesto Renta Cap VI.pdf', 0);
  insertMat.run(1, 'Instructivo 4 Valuacion Agotamiento', 'pdf', 'semana01/Instructivo 4 Valuacion Agotamiento.pdf', 0);
  insertMat.run(1, 'NIC 1 Estados Financieros', 'pdf', 'semana01/NIC 1 Estados Financieros.pdf', 0);
  insertMat.run(1, 'NIC 16 Propiedad Planta Equipos', 'pdf', 'semana01/NIC 16 Propiedad Planta Equipos.pdf', 0);
  insertMat.run(1, 'NIC 38 Activos Intangibles', 'pdf', 'semana01/NIC 38 Activos Intangibles.pdf', 0);
  insertMat.run(1, 'PCGE 2019', 'pdf', 'semana01/PCGE_2019.pdf', 0);
  insertMat.run(1, 'PCGE 2020 Plan Contable', 'excel', 'semana01/PCGE-2020-Plan-Contable-General-Empresarial-2020.xls', 0);
  insertMat.run(1, 'Registro Libros Electronicos 2020', 'excel', 'semana01/Registro Libros Electronicos 2020.xls', 0);
  insertMat.run(1, 'Principios Contables Horngren', 'pdf', 'semana01/S1 Principios Contables Horngren.pdf', 0);
  insertMat.run(1, 'Casos GE605U 2025 01 PLANTILLA', 'excel', 'semana01/SEM 01 Casos GE605U 2025 01 PLANTILLA.xlsx', 0);
  insertMat.run(1, 'Casos GE605U 2025 01 SOLUCION', 'excel', 'semana01/SEM 01 Casos GE605U 2025 01 SOLUCION.xlsx', 0);
  insertMat.run(1, 'Casos GE605U 2025 02 PLANTILLA', 'excel', 'semana01/SEM 01 Casos GE605U 2025 02 PLANTILLA.xlsx', 0);
  insertMat.run(1, 'Casos GE605U 2025 02 SOLUCION', 'excel', 'semana01/SEM 01 Casos GE605U 2025 02 SOLUCION.xlsx', 0);
  insertMat.run(1, 'Diapositivas Semana 01 (2025-01)', 'pdf', 'semana01/Semana 01 GE605U 2025 01.pdf', 0);
  insertMat.run(1, 'Diapositivas Semana 01 (2025-02)', 'pdf', 'semana01/Semana 01 GE605U 2025 02.pdf', 0);
  
  // VIDEOS S1 (Asegúrate de que tus archivos .txt se llamen así en la carpeta)
  insertMat.run(1, 'VIDEO: Contabilidad Tributaria', 'video', 'semana01/VIDEO_CONTABILIDAD_TRIBUTARIA.txt', 0);
  insertMat.run(1, 'VIDEO: Las NIIF en el Perú', 'video', 'semana01/VIDEO_LAS_NIIF_EN_EL_PERU.txt', 0);
  insertMat.run(1, 'VIDEO: NIIF 2022 en adelante', 'video', 'semana01/VIDEO_NIIF_2022_EN_ADELANTE.txt', 0);
  insertMat.run(1, 'VIDEO: Que es una Empresa', 'video', 'semana01/VIDEO_QUE_ES_UNA_EMPRESA.txt', 0);
  
  // Examen S1
  const s1Exam = insertMat.run(1, 'PRACTICA DOMICILIARIA 01', 'task', null, 1);

  // >>> SEMANA 02
  insertMat.run(2, 'Balance de Comprobación', 'excel', 'semana02/Balance de Comprobacion.xlsx', 0);
  insertMat.run(2, 'Caso Planeta SAC', 'excel', 'semana02/Caso Planeta SAC.xlsx', 0);
  insertMat.run(2, 'EEFF EGEMSA 2019', 'pdf', 'semana02/EEFF_EGEMSA_2019.pdf', 0);
  insertMat.run(2, 'Casos GE605U 2025 02 PLANTILLA', 'excel', 'semana02/SEM 02 Casos GE605U 2025 02 PLANTILLA.xlsx', 0);
  insertMat.run(2, 'Casos GE605U 2025 02 SOLUCION', 'excel', 'semana02/SEM 02 Casos GE605U 2025 02 SOLUCION.xlsx', 0);
  insertMat.run(2, 'Diapositivas Semana 02', 'pdf', 'semana02/Semana 02 GE605U 2025 02.pdf', 0);
  // Asumiendo que renombraste estos también
  insertMat.run(2, 'VIDEO: Demo Sistema Contable', 'video', 'semana02/VIDEO_DEMO_DE_SISTEMA_CONTABLE.txt', 0);
  insertMat.run(2, 'VIDEO: Software Contable', 'video', 'semana02/VIDEO_DEMOS_SOFTWARE_CONTABLE_FINANCIERO.txt', 0);
  insertMat.run(2, 'VIDEO: Libro Diario Simplificado', 'video', 'semana02/VIDEO_LIBRO_DIARIO_SIMPLIFICADO.txt', 0);
  
  const s2Exam = insertMat.run(2, 'PRACTICA CALIFICADA SEMANA 02', 'task', null, 1);

  // >>> SEMANA 03
  insertMat.run(3, 'Kardex Enero Diciembre', 'excel', 'semana03/KARDEX ENERO DICIEMBRE.xlsx', 0);
  insertMat.run(3, 'Casos GE605U 2025 02 PLANTILLA', 'excel', 'semana03/SEM 03 Casos GE605U 2025 02 PLANTILLA.xlsx', 0);
  insertMat.run(3, 'Casos GE605U 2025 02 SOLUCION', 'excel', 'semana03/SEM 03 Casos GE605U 2025 02 SOLUCION.xlsx', 0);
  insertMat.run(3, 'Diapositivas Semana 03', 'pdf', 'semana03/Semana 03 GE605U 2025 02.pdf', 0);
  const s3Exam = insertMat.run(3, 'PRACTICA CALIFICADA SEMANA 03', 'task', null, 1);

  // >>> SEMANA 04
  insertMat.run(4, 'Casos GE605U 2025 02 PLANTILLA', 'excel', 'semana04/SEM 04 Casos GE605U 2025 02 PLANTILLA.xlsx', 0);
  insertMat.run(4, 'Casos GE605U 2025 02 SOLUCION', 'excel', 'semana04/SEM 04 Casos GE605U 2025 02 SOLUCION.xlsx', 0);
  insertMat.run(4, 'Costeo Mantenimiento PLANTILLA', 'excel', 'semana04/SEM 04 COSTEO MANTENIMIENTO PLANTILLA.xlsx', 0);
  insertMat.run(4, 'Costeo Mantenimiento SOLUCION', 'excel', 'semana04/SEM 04 COSTEO MANTENIMIENTO SOLUCION.xlsx', 0);
  insertMat.run(4, 'Solucion Envase Integral', 'excel', 'semana04/SOLUCION EMPRESA ENVASE INTEGRAL TRADICIONAL.xlsx', 0);
  insertMat.run(4, 'Diapositivas Semana 04', 'pdf', 'semana04/Semana 04 GE605U 2025 02.pdf', 0);
  const s4Exam = insertMat.run(4, 'PRACTICA CALIFICADA SEMANA 04', 'task', null, 1);

  // >>> SEMANA 05
  insertMat.run(5, 'Casos GE605U 2025 02 PLANTILLA', 'excel', 'semana05/SEM 05 Casos GE605U 2025 02 PLANTILLA.xlsx', 0);
  insertMat.run(5, 'Casos GE605U 2025 02 SOLUCION', 'excel', 'semana05/SEM 05 Casos GE605U 2025 02 SOLUCION.xlsx', 0);
  insertMat.run(5, 'Costeo Omegalife PLANTILLA', 'excel', 'semana05/SEM 05 COSTEO OMEGALIFE PLANTILLA.xlsx', 0);
  insertMat.run(5, 'Costeo OT Modelo II PLANTILLA', 'excel', 'semana05/SEM 05 COSTEO OT Modelo II PLANTILLA.xlsx', 0);
  insertMat.run(5, 'Solucion Caso Omegalife', 'excel', 'semana05/SOLUCION PROTOTIPO CASO OMEGALIFE.xlsx', 0);
  insertMat.run(5, 'Diapositivas Semana 05', 'pdf', 'semana05/Semana 05 GE605U 2025 02.pdf', 0);
  const s5Exam = insertMat.run(5, 'PRACTICA CALIFICADA SEMANA 05', 'task', null, 1);

  // >>> SEMANA 06
  insertMat.run(6, 'Caso Costeo por Procesos', 'excel', 'semana06/SEM 06 Caso Costeo por Procesos.xlsx', 0);
  insertMat.run(6, 'Casos GE605U 2025 02 PLANTILLA', 'excel', 'semana06/SEM 06 Casos GE605U 2025 02 PLANTILLA.xlsx', 0);
  insertMat.run(6, 'Casos GE605U 2025 02 SOLUCION', 'excel', 'semana06/SEM 06 Casos GE605U 2025 02 SOLUCION.xlsx', 0);
  insertMat.run(6, 'Diapositivas Semana 06', 'pdf', 'semana06/Semana 06 GE605U 2025 02.pdf', 0);
  const s6Exam = insertMat.run(6, 'PRACTICA CALIFICADA SEMANA 06', 'task', null, 1);

  // >>> SEMANA 07
  insertMat.run(7, 'Modelo 1 Costeo ABC Textil', 'excel', 'semana07/Modelo 1 Costeo ABC Textil La Tela.xls', 0);
  insertMat.run(7, 'Modelo 2 Costeo ABC Envase', 'excel', 'semana07/Modelo 2 Costeo ABC Envase.xlsx', 0);
  insertMat.run(7, 'Modelo 2 Costeo ABC Refrigeradoras PLANTILLA', 'excel', 'semana07/Modelo 2 Costeo ABC Refrigeradoras PLANTILLA.xlsx', 0);
  insertMat.run(7, 'Modelo 3 Costeo ABC Incatex', 'excel', 'semana07/Modelo 3 Costeo ABC Incatex.xlsx', 0);
  insertMat.run(7, 'Casos GE605U 2025 02 PLANTILLA (1)', 'excel', 'semana07/SEM 07 Casos GE605U 2025 02 PLANTILLA (1).xlsx', 0);
  insertMat.run(7, 'Casos GE605U 2025 02 PLANTILLA', 'excel', 'semana07/SEM 07 Casos GE605U 2025 02 PLANTILLA.xlsx', 0);
  insertMat.run(7, 'Diapositivas Semana 07', 'pdf', 'semana07/Semana 07 GE605U 2025 02.pdf', 0);
  const s7Exam = insertMat.run(7, 'PRACTICA CALIFICADA SEMANA 07', 'task', null, 1);

  // >>> SEMANA 08 (VACÍA)

  // >>> SEMANA 09
  insertMat.run(9, 'Casos GE605U 2025 02 PLANTILLA', 'excel', 'semana09/SEM 09 Casos GE605U 2025 02 PLANTILLA.xlsx', 0);
  insertMat.run(9, 'Casos GE605U 2025 02 SOLUCION', 'excel', 'semana09/SEM 09 Casos GE605U 2025 02 SOLUCION.xlsx', 0);
  insertMat.run(9, 'Diapositivas Semana 09', 'pdf', 'semana09/Semana 09 GE605U 2025 02.pdf', 0);
  const s9Exam = insertMat.run(9, 'PRACTICA CALIFICADA SEMANA 09', 'task', null, 1);

  // >>> SEMANA 10
  insertMat.run(10, 'Casos GE605U 2025 02 PLANTILLA', 'excel', 'semana10/SEM 10 Casos GE605U 2025 02 PLANTILLA.xlsx', 0);
  insertMat.run(10, 'Casos GE605U 2025 02 SOLUCION', 'excel', 'semana10/SEM 10 Casos GE605U 2025 02 SOLUCION.xlsx', 0);
  insertMat.run(10, 'Diapositivas Semana 10', 'pdf', 'semana10/Semana 10 GE605U 2025 02.pdf', 0);
  const s10Exam = insertMat.run(10, 'PRACTICA CALIFICADA SEMANA 10', 'task', null, 1);

  // >>> SEMANA 11
  insertMat.run(11, 'Casos Semana 11 GE605U PLANTILLA', 'excel', 'semana11/Casos Semana 11 GE605U 2025 02 PLANTILLA.xlsx', 0);
  insertMat.run(11, 'Casos Semana 11 GE605U SOLUCION', 'excel', 'semana11/Casos Semana 11 GE605U 2025 02 SOLUCION.xlsx', 0);
  insertMat.run(11, 'Diapositivas Semana 11', 'pdf', 'semana11/Semana 11 GE605U 2025 02.pdf', 0);
  const s11Exam = insertMat.run(11, 'PRACTICA CALIFICADA SEMANA 11', 'task', null, 1);

  // --- 3. GENERAR PREGUNTAS (Para todos los exámenes) ---
  const insertP = db.prepare('INSERT INTO preguntas (material_id, enunciado, puntaje) VALUES (?, ?, ?)');
  const insertA = db.prepare('INSERT INTO alternativas (pregunta_id, texto, es_correcta) VALUES (?, ?, ?)');

  // Función para crear preguntas aleatorias por tema
  const crearExamen = (examenId, tema) => {
    for (let i = 1; i <= 15; i++) {
      const infoP = insertP.run(examenId, `Pregunta ${i} sobre ${tema}: ¿Cuál es la respuesta correcta?`, 2);
      insertA.run(infoP.lastInsertRowid, `Respuesta Correcta del tema ${tema}`, 1);
      insertA.run(infoP.lastInsertRowid, `Opción Incorrecta A`, 0);
      insertA.run(infoP.lastInsertRowid, `Opción Incorrecta B`, 0);
      insertA.run(infoP.lastInsertRowid, `Opción Incorrecta C`, 0);
    }
  };

  crearExamen(s1Exam.lastInsertRowid, "Contabilidad Financiera");
  crearExamen(s2Exam.lastInsertRowid, "Estados Financieros");
  crearExamen(s3Exam.lastInsertRowid, "Costos Empresariales");
  crearExamen(s4Exam.lastInsertRowid, "Metodología de Costeo");
  crearExamen(s5Exam.lastInsertRowid, "Órdenes de Trabajo");
  crearExamen(s6Exam.lastInsertRowid, "Costeo por Procesos");
  crearExamen(s7Exam.lastInsertRowid, "Costeo ABC");
  crearExamen(s9Exam.lastInsertRowid, "Toma de Decisiones");
  crearExamen(s10Exam.lastInsertRowid, "Gestión Presupuestal");
  crearExamen(s11Exam.lastInsertRowid, "Finanzas de Corto Plazo");
}

export default db;