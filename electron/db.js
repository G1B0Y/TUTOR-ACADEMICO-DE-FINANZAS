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

  // Verificamos si la base de datos tiene la estructura correcta (6 secciones: 0 a 5)
  const check = db.prepare('SELECT count(*) as count FROM semanas').get();
  
  // Si no coincide, reiniciamos para cargar los nuevos datos de Finanzas
  if (check.count !== 6) { 
    console.log("Reiniciando base de datos con estructura de Finanzas...");
    db.exec("DELETE FROM alternativas; DELETE FROM preguntas; DELETE FROM materiales; DELETE FROM semanas;");
    seedDatabase();
  }
}

function seedDatabase() {
  const insertSemana = db.prepare('INSERT INTO semanas (id, titulo) VALUES (?, ?)');
  const insertMat = db.prepare('INSERT INTO materiales (semana_id, titulo, tipo, archivo_ruta, es_evaluable) VALUES (?, ?, ?, ?, ?)');
  const insertP = db.prepare('INSERT INTO preguntas (material_id, enunciado, puntaje) VALUES (?, ?, ?)');
  const insertA = db.prepare('INSERT INTO alternativas (pregunta_id, texto, es_correcta) VALUES (?, ?, ?)');

  // Helper para insertar preguntas rápidamente
  // answerChar: 'a', 'b', 'c', 'd' (índice de la respuesta correcta)
  const addQ = (examId, text, opts, answerChar) => {
    const correctIdx = answerChar.toLowerCase().charCodeAt(0) - 97; // a=0, b=1...
    const p = insertP.run(examId, text, 2); // Puntaje base, luego se promedia
    opts.forEach((opt, idx) => {
      insertA.run(p.lastInsertRowid, opt, idx === correctIdx ? 1 : 0);
    });
  };

  // ==========================================
  // TEMA 0: MATERIAL GESTIÓN FINANCIERA (Libros)
  // ==========================================
  insertSemana.run(0, 'MATERIAL GESTIÓN FINANCIERA');
  const folder0 = "0. GESTIÓN FINANCIERA";
  
  insertMat.run(0, 'Libro: Contabilidad Financiera (Guajardo 2008)', 'pdf', `${folder0}/(2008) Contabilidad Financiera Guajardo.pdf`, 0);
  insertMat.run(0, 'Libro: Contabilidad Para No Contadores (Guajardo 2012)', 'pdf', `${folder0}/(2012) Contabilidad Para No Contadores Guajardo.pdf`, 0);
  insertMat.run(0, 'Libro: Principios Administración Financiera (Gitman 12ed)', 'pdf', `${folder0}/(2012) Principios Administracion Financiera 12ed Gitman.pdf`, 0);
  insertMat.run(0, 'Libro: Contabilidad Costos (UN Machala 2016)', 'pdf', `${folder0}/(2016) Libro Contabilidad Costos UN Machala EC.pdf`, 0);
  insertMat.run(0, 'Libro: Contabilidad De Costos (UE Milagro 2017)', 'pdf', `${folder0}/(2017) Libro Contabilidad De Costos UE Milagro EC.pdf`, 0);
  insertMat.run(0, 'Material Curso Rodolfo Falconi', 'pdf', `${folder0}/Material Curso Rodolfo Falconi.pdf`, 0);
  insertMat.run(0, 'Separata Costos ABC WORIA', 'pdf', `${folder0}/Separata Costos ABC WORIA.pdf`, 0);
  insertMat.run(0, 'Separata Costos Industriales WORIA', 'pdf', `${folder0}/Separata Costos Industriales WORIA.pdf`, 0);
  insertMat.run(0, 'Separata de Costos WORIA', 'pdf', `${folder0}/Separata de Costos WORIA.pdf`, 0);


  // ==========================================
  // TEMA 1: FUNDAMENTOS DE FINANZAS
  // ==========================================
  insertSemana.run(1, '1. FUNDAMENTOS DE FINANZAS Y FINANZAS DE CORTO PLAZO');
  const folder1 = "1. FUNDAMENTOS DE FINANZAS Y FINANZAS DE CORTO PLAZO";
  
  // Materiales Tema 1
  insertMat.run(1, 'Casos Semana 11 - Plantilla', 'excel', `${folder1}/Casos Semana 11 GE605U 2025 02 PLANTILLA.xlsx`, 0);
  insertMat.run(1, 'Casos Semana 11 - Solución', 'excel', `${folder1}/Casos Semana 11 GE605U 2025 02 SOLUCION.xlsx`, 0);
  insertMat.run(1, 'Diapositivas Semana 11', 'pdf', `${folder1}/Semana 11 GE605U 2025 02.pdf`, 0);

  // Evaluación Tema 1
  const ex1 = insertMat.run(1, 'EVALUACIÓN TEMA 1: Fundamentos', 'task', null, 1);
  
  // --- PREGUNTAS TEMA 1 (Del archivo proporcionado) ---
  addQ(ex1.lastInsertRowid, '¿Cuál es el objetivo central de la gestión financiera en una empresa?', ['Maximizar ventas sin importar costos', 'Maximizar el valor de la empresa para sus propietarios', 'Minimizar impuestos a cualquier costo', 'Mantener caja ociosa para “seguridad”'], 'b');
  addQ(ex1.lastInsertRowid, '¿Qué institución está a cargo de la política monetaria y de preservar la estabilidad monetaria en el Perú?', ['SBS', 'BCRP', 'SMV', 'MEF'], 'b');
  addQ(ex1.lastInsertRowid, '¿Cuál es una función típica de la SBS en el Perú?', ['Emitir billetes y monedas', 'Supervisar bancos, financieras y aseguradoras', 'Aprobar el presupuesto nacional', 'Fijar el IGV'], 'b');
  addQ(ex1.lastInsertRowid, 'El “valor del dinero en el tiempo” significa que:', ['S/ 1,000 hoy valen lo mismo que S/ 1,000 mañana', 'El dinero pierde valor siempre, sin excepción', 'El dinero hoy vale más que el mismo monto en el futuro por el rendimiento esperado', 'La inflación no afecta las decisiones financieras'], 'c');
  addQ(ex1.lastInsertRowid, 'En interés compuesto:', ['Los intereses se calculan solo sobre el capital inicial', 'Los intereses generan intereses (capitalización)', 'No existe tasa efectiva', 'Solo aplica a préstamos de corto plazo'], 'b');
  addQ(ex1.lastInsertRowid, '¿Cuál es el valor presente de S/ 10,000 que se recibirán en 3 años, con tasa efectiva anual 12%?', ['S/ 7,117.80', 'S/ 8,000.00', 'S/ 9,600.00', 'S/ 6,250.00'], 'a');
  addQ(ex1.lastInsertRowid, 'Si la tasa efectiva mensual es 2%, la TEA es aproximadamente:', ['24.00%', '26.82%', '20.00%', '28.00%'], 'b');
  addQ(ex1.lastInsertRowid, 'Un proyecto con VAN > 0 significa:', ['Se rechaza porque “sobra” dinero', 'Genera valor por encima del costo de capital', 'Tiene pérdidas contables seguras', 'Su riesgo es cero'], 'b');
  addQ(ex1.lastInsertRowid, 'Inversión inicial: S/ 20,000. Retornos: S/ 8,000 al final de cada año por 3 años. Tasa: 10%. El VAN es:', ['+S/ 1,500 aprox.', '-S/ 105 aprox.', '0 exacto', '-S/ 2,000 aprox.'], 'b');
  addQ(ex1.lastInsertRowid, '¿Cuál es una fuente típica de financiamiento de corto plazo?', ['Emisión de acciones', 'Leasing financiero a 10 años', 'Crédito comercial (cuentas por pagar a proveedores)', 'Bonos a 15 años'], 'c');
  addQ(ex1.lastInsertRowid, 'El capital de trabajo neto (CTN) es:', ['Activo fijo – Pasivo no corriente', 'Activo corriente – Pasivo corriente', 'Ventas – Costos', 'Utilidad neta – Impuestos'], 'b');
  addQ(ex1.lastInsertRowid, 'Si Activo Corriente = S/ 120,000 y Pasivo Corriente = S/ 80,000, el CTN es:', ['S/ 40,000', 'S/ 200,000', 'S/ 50,000', 'S/ 30,000'], 'a');
  addQ(ex1.lastInsertRowid, 'Si Días de Inventario = 45, Días de Cobro = 30 y Días de Pago = 25, el CCE es:', ['100 días', '50 días', '20 días', '0 días'], 'b');
  addQ(ex1.lastInsertRowid, 'El sistema de amortización francés se caracteriza por:', ['Cuotas variables, amortización constante', 'Cuota fija, interés decreciente y amortización creciente', 'Pago de capital solo al final', 'Interés fijo y amortización fija'], 'b');
  addQ(ex1.lastInsertRowid, 'En el sistema de amortización alemán:', ['La amortización (principal) es constante y la cuota disminuye', 'La cuota es fija siempre', 'Se paga solo interés y al final el capital', 'La tasa cambia cada día obligatoriamente'], 'a');
  addQ(ex1.lastInsertRowid, 'La TCEA busca reflejar:', ['Solo la tasa nominal sin comisiones', 'El costo total del crédito incluyendo comisiones, seguros y gastos asociados', 'Solo la inflación esperada', 'Solo el costo contable del préstamo'], 'b');
  addQ(ex1.lastInsertRowid, 'Una política de financiamiento agresiva suele implicar:', ['Mayor uso de deuda de largo plazo para financiar activos corrientes', 'Mayor uso de deuda de corto plazo para financiar incluso necesidades más permanentes', 'Cero endeudamiento siempre', 'Solo financiamiento con acciones'], 'b');
  addQ(ex1.lastInsertRowid, 'La estructura de capital se refiere a:', ['Cómo se distribuyen las ventas por producto', 'La combinación de deuda y patrimonio (equity) usada para financiar la empresa', 'El organigrama de la empresa', 'El plan de marketing anual'], 'b');


  // ==========================================
  // TEMA 2: GESTIÓN ENFOCADA AL ACCIONISTA
  // ==========================================
  insertSemana.run(2, '2. GESTIÓN FINANCIERA ENFOCADA AL ACCIONISTA');
  const ex2 = insertMat.run(2, 'EVALUACIÓN TEMA 2: Valor y Accionistas', 'task', null, 1);
  
  // --- PREGUNTAS TEMA 2 ---
  addQ(ex2.lastInsertRowid, 'El enfoque del Valor Económico Agregado (EVA) se centra principalmente en:', ['Maximizar la utilidad contable del período', 'Minimizar el nivel de endeudamiento', 'Medir si la empresa genera valor por encima del costo del capital', 'Incrementar el volumen de ventas anuales'], 'c');
  addQ(ex2.lastInsertRowid, 'El EVA se calcula como:', ['Utilidad neta menos impuestos', 'Utilidad operativa después de impuestos menos el costo del capital invertido', 'Flujo de caja operativo menos inversión inicial', 'Utilidad bruta menos gastos financieros'], 'b');
  addQ(ex2.lastInsertRowid, 'Un EVA positivo indica que la empresa:', ['Tiene liquidez suficiente', 'Ha cubierto sus costos operativos', 'Ha generado rendimiento superior al exigido por los inversionistas', 'Ha incrementado su participación de mercado'], 'c');
  addQ(ex2.lastInsertRowid, '¿Cuál de los siguientes no es un componente directo del cálculo del EVA?', ['Capital invertido', 'Costo promedio ponderado de capital', 'Utilidad operativa después de impuestos', 'Utilidad bruta'], 'd');
  addQ(ex2.lastInsertRowid, 'El Costo Promedio Ponderado de Capital (CPPC) representa:', ['El costo del financiamiento bancario', 'El rendimiento exigido solo por los accionistas', 'El costo promedio de todas las fuentes de financiamiento de la empresa', 'El costo histórico del pasivo total'], 'c');
  addQ(ex2.lastInsertRowid, 'En el cálculo del CPPC, el costo de la deuda se considera:', ['Antes de impuestos', 'Sin ponderación', 'Después de impuestos', 'A valor nominal'], 'c');
  addQ(ex2.lastInsertRowid, 'Las ponderaciones utilizadas en el CPPC deben basarse preferentemente en:', ['Valores contables históricos', 'Valores nominales', 'Valores de mercado de deuda y patrimonio', 'Valores tributarios'], 'c');
  addQ(ex2.lastInsertRowid, 'El efecto del endeudamiento sobre el CPPC implica que:', ['El CPPC siempre disminuye al aumentar la deuda', 'El CPPC no se ve afectado por la deuda', 'El CPPC puede disminuir hasta cierto nivel óptimo y luego aumentar', 'El CPPC depende solo del costo del capital propio'], 'c');
  addQ(ex2.lastInsertRowid, 'La política de dividendos se refiere a:', ['La estrategia de ventas de la empresa', 'La forma en que se distribuyen las utilidades entre los accionistas', 'El control del flujo de caja operativo', 'La política tributaria empresarial'], 'b');
  addQ(ex2.lastInsertRowid, 'La política de dividendos es relevante cuando:', ['No existen impuestos', 'No existen costos de transacción', 'Existen imperfecciones en el mercado de capitales', 'La empresa no genera utilidades'], 'c');
  addQ(ex2.lastInsertRowid, 'Cuando una empresa decide retener utilidades en lugar de distribuir dividendos, generalmente busca:', ['Evitar el pago de impuestos', 'Incrementar gastos administrativos', 'Financiar proyectos con rentabilidad esperada positiva', 'Reducir el control de los accionistas'], 'c');
  addQ(ex2.lastInsertRowid, 'Desde la perspectiva del accionista, una política de dividendos adecuada es aquella que:', ['Maximiza el dividendo anual', 'Mantiene dividendos constantes sin excepción', 'Maximiza el valor de la empresa en el largo plazo', 'Elimina totalmente la reinversión'], 'c');
  addQ(ex2.lastInsertRowid, 'Una empresa puede mejorar su EVA mediante:', ['Incrementar activos improductivos', 'Aumentar el costo de capital', 'Incrementar la utilidad operativa o reducir el costo de capital', 'Incrementar gastos financieros'], 'c');
  addQ(ex2.lastInsertRowid, 'La principal diferencia entre el EVA y la utilidad contable es que el EVA:', ['No considera impuestos', 'No se basa en resultados operativos', 'Incorpora explícitamente el costo del capital', 'Solo se aplica a empresas financieras'], 'c');
  addQ(ex2.lastInsertRowid, 'Una limitación clave de la utilidad contable como indicador de desempeño es que:', ['No se puede comparar entre empresas', 'No considera el costo de oportunidad del capital', 'No refleja ingresos reales', 'No se presenta en los estados financieros'], 'b');
  addQ(ex2.lastInsertRowid, 'El análisis horizontal de los estados financieros permite:', ['Evaluar la estructura porcentual de las cuentas', 'Analizar la evolución de las partidas a lo largo del tiempo', 'Determinar el nivel de liquidez', 'Calcular razones financieras'], 'b');
  addQ(ex2.lastInsertRowid, 'El análisis vertical consiste en:', ['Comparar cifras de distintos períodos', 'Expresar cada cuenta como porcentaje de un total', 'Analizar flujos de efectivo', 'Medir rentabilidad del capital'], 'b');
  addQ(ex2.lastInsertRowid, '¿Cuál de las siguientes razones financieras mide rentabilidad?', ['Razón corriente', 'Prueba ácida', 'Margen neto', 'Rotación de inventarios'], 'c');
  addQ(ex2.lastInsertRowid, 'El método Dupont permite:', ['Analizar liquidez y solvencia', 'Descomponer el ROE en factores explicativos', 'Calcular el EVA directamente', 'Determinar el capital de trabajo'], 'b');
  addQ(ex2.lastInsertRowid, 'El ROE se explica fundamentalmente por la combinación de:', ['Inflación, impuestos y ventas', 'Margen de utilidad, rotación de activos y apalancamiento financiero', 'Liquidez, solvencia y rentabilidad', 'Flujo de caja y capital invertido'], 'b');


  // ==========================================
  // TEMA 3: ANÁLISIS DE ESTADOS FINANCIEROS
  // ==========================================
  insertSemana.run(3, '3. ANALISIS E INTERPRETACIÓN DE LOS ESTADOS FINANCIEROS');
  const ex3 = insertMat.run(3, 'EVALUACIÓN TEMA 3: Análisis Financiero', 'task', null, 1);
  
  // --- PREGUNTAS TEMA 3 ---
  addQ(ex3.lastInsertRowid, 'El análisis e interpretación de los estados financieros tiene como finalidad principal:', ['Cumplir requisitos tributarios', 'Determinar el valor nominal de la empresa', 'Evaluar la situación económica y financiera para la toma de decisiones', 'Elaborar los estados financieros'], 'c');
  addQ(ex3.lastInsertRowid, 'El análisis horizontal se basa en:', ['Expresar cada cuenta como porcentaje de un total', 'Comparar estados financieros de un mismo período', 'Analizar la variación de las cuentas a través del tiempo', 'Calcular razones financieras'], 'c');
  addQ(ex3.lastInsertRowid, 'El análisis horizontal permite identificar principalmente:', ['La estructura financiera de un período', 'Tendencias de crecimiento o decrecimiento', 'El nivel de liquidez inmediata', 'El costo del capital'], 'b');
  addQ(ex3.lastInsertRowid, 'El análisis vertical consiste en:', ['Comparar cifras entre distintos años', 'Analizar flujos de efectivo', 'Expresar cada partida como porcentaje de una cifra base', 'Medir la rotación de activos'], 'c');
  addQ(ex3.lastInsertRowid, 'En el estado de resultados, el análisis vertical suele tomar como base:', ['La utilidad neta', 'El costo de ventas', 'Las ventas netas', 'El resultado operativo'], 'c');
  addQ(ex3.lastInsertRowid, 'Un alto porcentaje del costo de ventas respecto a las ventas indica:', ['Alta liquidez', 'Baja rentabilidad bruta', 'Alto apalancamiento financiero', 'Eficiencia en la cobranza'], 'b');
  addQ(ex3.lastInsertRowid, 'Las razones financieras permiten:', ['Elaborar los estados financieros', 'Comparar información contable de forma aislada', 'Relacionar partidas para evaluar desempeño y situación financiera', 'Determinar el valor contable de la empresa'], 'c');
  addQ(ex3.lastInsertRowid, '¿Cuál de las siguientes es una razón de liquidez?', ['Margen neto', 'Rotación de inventarios', 'Razón corriente', 'ROE'], 'c');
  addQ(ex3.lastInsertRowid, 'Una razón corriente significativamente mayor a 1 indica que la empresa:', ['Tiene exceso de endeudamiento', 'Puede cubrir sus obligaciones de corto plazo', 'Es altamente rentable', 'Tiene bajo capital de trabajo'], 'b');
  addQ(ex3.lastInsertRowid, 'La rotación de inventarios mide:', ['La capacidad de pago inmediato', 'La rentabilidad de las ventas', 'La eficiencia en la administración de inventarios', 'El nivel de endeudamiento'], 'c');
  addQ(ex3.lastInsertRowid, '¿Cuál de los siguientes ratios mide el grado de financiamiento con terceros?', ['Margen operativo', 'Razón deuda / patrimonio', 'Prueba ácida', 'Rotación de activos'], 'b');
  addQ(ex3.lastInsertRowid, 'Un alto nivel de endeudamiento implica principalmente:', ['Menor riesgo financiero', 'Mayor dependencia de financiamiento externo', 'Mayor liquidez inmediata', 'Mayor rentabilidad asegurada'], 'b');
  addQ(ex3.lastInsertRowid, 'El ROA mide:', ['La rentabilidad del patrimonio', 'La rentabilidad generada por los activos', 'La eficiencia del capital de trabajo', 'El costo del capital'], 'b');
  addQ(ex3.lastInsertRowid, 'El ROE indica:', ['La rentabilidad del activo total', 'La utilidad antes de impuestos', 'El rendimiento del capital aportado por los accionistas', 'El margen operativo'], 'c');
  addQ(ex3.lastInsertRowid, 'El método Dupont permite:', ['Calcular el capital de trabajo', 'Evaluar liquidez y solvencia', 'Analizar las causas que explican el ROE', 'Determinar el valor de mercado de la empresa'], 'c');
  addQ(ex3.lastInsertRowid, 'Según el método Dupont, el ROE se descompone en:', ['Liquidez, solvencia y rentabilidad', 'Margen de utilidad, rotación de activos y apalancamiento financiero', 'Ventas, costos y gastos', 'Activos, pasivos y patrimonio'], 'b');
  addQ(ex3.lastInsertRowid, 'La interpretación integral de los estados financieros implica:', ['Analizar solo ratios de rentabilidad', 'Analizar de forma aislada cada estado financiero', 'Combinar análisis horizontal, vertical y ratios financieros', 'Analizar únicamente el flujo de efectivo'], 'c');
  addQ(ex3.lastInsertRowid, 'Para que el análisis financiero sea comparable entre períodos o empresas, es importante que:', ['Se utilicen las mismas políticas contables', 'Las empresas tengan el mismo tamaño', 'Las ventas sean similares', 'No exista inflación'], 'a');
  addQ(ex3.lastInsertRowid, 'Un diagnóstico financiero adecuado permite:', ['Determinar el precio de venta de los productos', 'Formular propuestas de mejora', 'Calcular impuestos con exactitud', 'Incrementar automáticamente la rentabilidad'], 'b');
  addQ(ex3.lastInsertRowid, 'Una propuesta de mejora financiera debe basarse principalmente en:', ['Opiniones subjetivas', 'Resultados aislados de un ratio', 'El diagnóstico obtenido del análisis financiero integral', 'El tamaño de la empresa'], 'c');


  // ==========================================
  // TEMA 4: DECISIÓN DE INVERSIÓN
  // ==========================================
  insertSemana.run(4, '4. LA DECISIÓN DE INVERSIÓN');
  const ex4 = insertMat.run(4, 'EVALUACIÓN TEMA 4: Proyectos de Inversión', 'task', null, 1);

  // --- PREGUNTAS TEMA 4 ---
  addQ(ex4.lastInsertRowid, 'Una empresa acepta un proyecto con VAN positivo pero con alta volatilidad en los flujos de caja. ¿Qué enfoque teórico justifica esta decisión?', ['Teoría contable', 'Maximización del valor esperado', 'Preferencia por la liquidez', 'Principio de certeza'], 'b');
  addQ(ex4.lastInsertRowid, 'Cuando la TIR de un proyecto es mayor que el costo de capital, esto implica que:', ['El proyecto es siempre rentable', 'El VAN será necesariamente negativo', 'El proyecto genera valor económico', 'El periodo de recuperación es corto'], 'c');
  addQ(ex4.lastInsertRowid, '¿En qué situación la TIR puede inducir a una decisión incorrecta?', ['Proyectos con flujos convencionales', 'Proyectos mutuamente excluyentes', 'Proyectos de corto plazo', 'Proyectos con alta liquidez'], 'b');
  addQ(ex4.lastInsertRowid, 'El uso del VAN como criterio principal se fundamenta en:', ['La contabilidad financiera', 'El valor del dinero en el tiempo', 'La simplicidad del cálculo', 'El periodo de recuperación'], 'b');
  addQ(ex4.lastInsertRowid, 'En el análisis de sensibilidad, una variable es crítica cuando:', ['Tiene valor histórico elevado', 'Genera cambios significativos en el VAN', 'No puede ser controlada', 'Tiene bajo impacto financiero'], 'b');
  addQ(ex4.lastInsertRowid, 'La tasa de descuento ajustada por riesgo busca:', ['Eliminar la incertidumbre', 'Penalizar proyectos de alto riesgo', 'Aumentar artificialmente el VAN', 'Reducir los costos operativos'], 'b');
  addQ(ex4.lastInsertRowid, 'Un proyecto con alto VAN esperado pero con probabilidad significativa de VAN negativo se considera:', ['Ineficiente', 'Dominado', 'Riesgoso', 'No rentable'], 'c');
  addQ(ex4.lastInsertRowid, 'El análisis de escenarios se diferencia del análisis de sensibilidad porque:', ['Considera una sola variable', 'Evalúa cambios simultáneos de variables', 'Elimina el riesgo', 'Usa solo datos históricos'], 'b');
  addQ(ex4.lastInsertRowid, 'En decisiones de inversión estratégicas, la evaluación financiera debe complementarse con:', ['Opiniones personales', 'Criterios cualitativos y estratégicos', 'Resultados contables', 'Liquidez inmediata'], 'b');
  addQ(ex4.lastInsertRowid, 'El costo de oportunidad del capital representa:', ['El costo contable de la inversión', 'La rentabilidad del mejor uso alternativo', 'La tasa de inflación', 'El riesgo operativo'], 'b');
  addQ(ex4.lastInsertRowid, 'En proyectos de largo plazo, el principal problema de estimación es:', ['El cálculo del VAN', 'La proyección de flujos futuros', 'El cálculo de impuestos', 'La inversión inicial'], 'b');
  addQ(ex4.lastInsertRowid, 'Un proyecto con VAN igual a cero indica que:', ['Genera pérdidas', 'No debe ejecutarse', 'Recupera exactamente el costo de capital', 'Tiene alto riesgo'], 'c');
  addQ(ex4.lastInsertRowid, 'El enfoque de opciones reales permite:', ['Ignorar la incertidumbre', 'Valorar la flexibilidad gerencial', 'Simplificar el análisis financiero', 'Sustituir el VAN'], 'b');
  addQ(ex4.lastInsertRowid, 'Cuando existe racionamiento de capital, la decisión óptima se basa en:', ['La TIR más alta', 'El VAN más alto', 'El índice de rentabilidad', 'El periodo de recuperación'], 'c');
  addQ(ex4.lastInsertRowid, 'Una decisión de inversión eficiente debe maximizar:', ['Utilidad contable', 'Ingresos', 'Valor económico ajustado por riesgo', 'Liquidez'], 'c');


  // ==========================================
  // TEMA 5: GESTIÓN DE RIESGOS
  // ==========================================
  insertSemana.run(5, '5. LA GESTIÓN DE RIESGOS');
  const ex5 = insertMat.run(5, 'EVALUACIÓN TEMA 5: Riesgos Financieros', 'task', null, 1);

  // --- PREGUNTAS TEMA 5 ---
  addQ(ex5.lastInsertRowid, 'Según ISO 31000, el riesgo se define como:', ['La probabilidad de ocurrencia de un evento', 'El impacto financiero negativo', 'El efecto de la incertidumbre sobre los objetivos', 'La amenaza identificada'], 'c');
  addQ(ex5.lastInsertRowid, 'Establecer el contexto en ISO 31000 implica:', ['Identificar riesgos', 'Definir criterios y objetivos del análisis', 'Evaluar impactos', 'Tratar los riesgos'], 'b');
  addQ(ex5.lastInsertRowid, 'El análisis cualitativo de riesgos se caracteriza por:', ['Uso de simulaciones', 'Cuantificación monetaria', 'Priorización según probabilidad e impacto', 'Eliminación del riesgo'], 'c');
  addQ(ex5.lastInsertRowid, 'El análisis cuantitativo de riesgos permite:', ['Clasificar riesgos subjetivamente', 'Estimar el efecto numérico del riesgo', 'Eliminar la incertidumbre', 'Evitar decisiones'], 'b');
  addQ(ex5.lastInsertRowid, '¿Cuál es la diferencia principal entre riesgo y amenaza?', ['No existe diferencia', 'La amenaza siempre ocurre', 'El riesgo incluye probabilidad e impacto', 'La amenaza es positiva'], 'c');
  addQ(ex5.lastInsertRowid, 'La aceptación del riesgo se justifica cuando:', ['El riesgo es crítico', 'El costo de mitigación es mayor que el impacto', 'El riesgo es desconocido', 'El impacto es alto'], 'b');
  addQ(ex5.lastInsertRowid, 'En COSO ERM, el riesgo se vincula directamente con:', ['Auditoría interna', 'Estrategia y desempeño', 'Seguridad informática', 'Control contable'], 'b');
  addQ(ex5.lastInsertRowid, 'El apetito de riesgo representa:', ['El riesgo residual', 'El nivel de riesgo que la organización está dispuesta a aceptar', 'El riesgo máximo posible', 'El riesgo transferido'], 'b');
  addQ(ex5.lastInsertRowid, 'La gestión integral de riesgos busca:', ['Eliminar riesgos financieros', 'Gestionar riesgos de forma aislada', 'Alinear riesgos con objetivos estratégicos', 'Reducir costos operativos'], 'c');
  addQ(ex5.lastInsertRowid, 'En la gestión de riesgos de proyectos, un riesgo negativo se denomina:', ['Oportunidad', 'Amenaza', 'Evento', 'Incertidumbre'], 'b');
  addQ(ex5.lastInsertRowid, 'La simulación Monte Carlo se utiliza para:', ['Determinar costos fijos', 'Evaluar la variabilidad de resultados', 'Estimar impuestos', 'Eliminar riesgos'], 'b');
  addQ(ex5.lastInsertRowid, 'En @RISK, las variables de entrada se modelan mediante:', ['Valores constantes', 'Distribuciones de probabilidad', 'Datos históricos fijos', 'Promedios'], 'b');
  addQ(ex5.lastInsertRowid, 'El VaR en un proyecto de inversión indica:', ['La rentabilidad esperada', 'El VAN promedio', 'La pérdida máxima probable con cierto nivel de confianza', 'El riesgo residual'], 'c');
  addQ(ex5.lastInsertRowid, 'El riesgo estratégico se asocia principalmente con:', ['Fallas operativas', 'Decisiones de alto nivel', 'Errores técnicos', 'Riesgos legales'], 'b');
  addQ(ex5.lastInsertRowid, 'Integrar la gestión de riesgos en la decisión de inversión permite:', ['Eliminar la incertidumbre', 'Tomar decisiones más informadas y robustas', 'Garantizar resultados positivos', 'Reducir el VAN'], 'b');
}

export default db;