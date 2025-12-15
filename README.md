# 🎓 TutoFinanzas - Tutor Académico de Finanzas

Aplicación de escritorio desarrollada con **Electron**, **React** y **SQLite** para ayudar a estudiantes a practicar y evaluar sus conocimientos en **Gestión Financiera**. Permite rendir exámenes, guardar progreso y visualizar estadísticas de rendimiento.

---

## 🛠️ Tecnologías

* **Core:** Electron + React + Vite
* **Lenguaje:** JavaScript / JSX
* **Base de Datos:** SQLite (vía `better-sqlite3`)
* **UI:** TailwindCSS
* **Gráficos:** Recharts

---

## 🚀 Instalación y Configuración

Sigue estos pasos para clonar y ejecutar el proyecto en tu máquina local (**Windows o Linux**).

### 1. Prerrequisitos

Asegúrate de tener instalado:

* **Node.js** (Versión LTS recomendada, ej. v20+)
* **Git**

### 2. Clonar el repositorio

Abre tu terminal y ejecuta:

```bash
git clone <URL_DE_TU_NUEVO_REPOSITORIO>
cd monografia2
```

### 3. Instalar dependencias

Instala las librerías necesarias:

```bash
npm install
```

---

## ⚠️ Paso Crítico: Compilación de SQLite (Windows vs Linux)

Este proyecto usa **better-sqlite3**, una librería nativa en **C++**.

👉 **Siempre que cambies de Sistema Operativo** (de Linux a Windows o viceversa) **o instales el proyecto en una PC nueva**, debes reconstruir esta librería para que sea compatible con Electron.

Ejecuta este comando **después de instalar las dependencias**:

```bash
npx electron-rebuild
```

**Nota:** Si este paso falla o aparece un error del tipo `NODE_MODULE_VERSION`, sigue estos pasos:

1. Borra la carpeta `node_modules`
2. Borra el archivo `package-lock.json`
3. Ejecuta nuevamente:

```bash
npm install
npx electron-rebuild
```

---

## ▶️ Ejecutar en Desarrollo

Para iniciar la aplicación en modo desarrollo (con recarga automática):

```bash
npm run electron:dev
```

---

## 📦 Crear Ejecutable (Build)

Para generar el instalador final:

### 🪟 En Windows (PowerShell)

> ⚠️ **Recomendado:** Ejecutar la terminal como **Administrador** para evitar errores de permisos con enlaces simbólicos durante el empaquetado.

```powershell
npm run dist
```

El instalador se generará en la carpeta:

```text
/release
```

### 🐧 En Linux (Bash)

```bash
npm run dist
```

El ejecutable se generará en la carpeta:

```text
/release
```

---

## 🆘 Solución de Problemas Comunes

### ❌ Error: "The module was compiled against a different Node.js version"

**Causa:** La base de datos se compiló para tu Node.js local, pero Electron usa otra versión interna.

**Solución:**

```bash
npx electron-rebuild
```

---

### ❌ Error en Windows: "Cannot create symbolic link / Client does not have required privilege"

**Causa:** Windows bloquea la creación de enlaces simbólicos por seguridad, necesarios para firmar la aplicación.

**Soluciones posibles:**

* Ejecuta **VS Code** o **PowerShell como Administrador**
* Activa el **Modo para desarrolladores** en la configuración de Windows

---

### ❌ La base de datos no guarda datos en producción

**Causa:** La aplicación instalada busca la base de datos en la carpeta de recursos del sistema.

**Solución:**

* Asegúrate de que el archivo `sistema_finanzas.db` se esté copiando correctamente mediante `extraResources` en el `package.json`.

---

## 📂 Estructura del Proyecto

```text
/electron                # Código del proceso principal (Backend local)
/src                     # Código React (Frontend)
/public                  # Archivos estáticos (imágenes, iconos)
sistema_finanzas.db      # Base de datos SQLite inicial
```

---

📘 *TutoFinanzas* — Proyecto académico orientado al aprendizaje práctico y evaluación en Gestión Financiera.
