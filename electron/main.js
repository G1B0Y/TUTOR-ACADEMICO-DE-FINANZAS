import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import db, { initDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    title: "Tutor Académico de Finanzas - GE605U",
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  mainWindow.setMenuBarVisibility(false);
  mainWindow.on('closed', () => mainWindow = null);
}

app.whenReady().then(() => {
  initDB();
  createWindow();
});

// IPC HANDLERS
ipcMain.handle('login-user', async (event, { username, password }) => {
  try {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const user = db.prepare('SELECT id, username, nombre_completo FROM usuarios WHERE username = ? AND password = ?').get(username, hash);
    return user ? { success: true, user } : { success: false, message: 'Credenciales incorrectas' };
  } catch (error) { return { success: false, message: error.message }; }
});

ipcMain.handle('register-user', async (event, { username, password }) => {
  try {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const stmt = db.prepare('INSERT INTO usuarios (username, password) VALUES (?, ?)');
    const info = stmt.run(username, hash);
    return { success: true, userId: info.lastInsertRowid };
  } catch (error) { return { success: false, message: 'Usuario ya existe' }; }
});

ipcMain.handle('get-syllabus', async () => {
  const semanas = db.prepare('SELECT * FROM semanas ORDER BY id ASC').all();
  return semanas.map(sem => {
    const materials = db.prepare('SELECT * FROM materiales WHERE semana_id = ?').all(sem.id);
    return { weekId: sem.id, title: sem.titulo, materials };
  });
});

ipcMain.handle('open-file-native', async (event, { fileName, type }) => {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const filePath = isDev 
      ? path.join(process.cwd(), 'public', 'materiales', fileName)
      : path.join(__dirname, '../dist/materiales', fileName);
    
    if (!fs.existsSync(filePath)) return { success: false, message: 'Archivo no encontrado' };

    if (type === 'video' && fileName.endsWith('.txt')) {
      const url = fs.readFileSync(filePath, 'utf-8').trim();
      if (url.startsWith('http')) { await shell.openExternal(url); return { success: true }; }
    }
    await shell.openPath(filePath);
    return { success: true };
  } catch (err) { return { success: false, message: err.message }; }
});

ipcMain.handle('get-random-exam', async (event, materialId) => {
  const qs = db.prepare('SELECT * FROM preguntas WHERE material_id = ?').all(materialId);
  const selected = qs.sort(() => 0.5 - Math.random()).slice(0, 10);
  const exam = selected.map(q => {
    const alts = db.prepare('SELECT id, texto, es_correcta FROM alternativas WHERE pregunta_id = ?').all(q.id);
    return { ...q, alternativas: alts.sort(() => 0.5 - Math.random()) };
  });
  return { success: true, questions: exam };
});

ipcMain.handle('submit-exam-grade', async (event, { userId, materialId, nota }) => {
  const fecha = new Date().toISOString();
  const exists = db.prepare('SELECT id FROM entregas WHERE usuario_id = ? AND material_id = ?').get(userId, materialId);
  if (exists) db.prepare('UPDATE entregas SET fecha_entrega = ?, nota = ?, estado = ? WHERE id = ?').run(fecha, nota, 'Calificado', exists.id);
  else db.prepare('INSERT INTO entregas (usuario_id, material_id, fecha_entrega, nota, estado) VALUES (?, ?, ?, ?, ?)').run(userId, materialId, fecha, nota, 'Calificado');
  return { success: true };
});

ipcMain.handle('reset-progress', async (event, userId) => {
  db.prepare('DELETE FROM entregas WHERE usuario_id = ?').run(userId);
  return { success: true };
});

ipcMain.handle('get-user-grades', async (event, userId) => {
  const grades = db.prepare('SELECT material_id, nota FROM entregas WHERE usuario_id = ?').all(userId);
  return { success: true, grades };
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });