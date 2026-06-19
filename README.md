# PRO-TALENT | Módulo IV: Formación y Desarrollo de Empleados

Esta es una Single Page Application (SPA) responsiva para la gestión de actividades del módulo práctico de **Formación y Desarrollo**. Está construida con tecnología web nativa (HTML5, CSS3, Javascript) e integra serverless functions de Netlify para procesamiento seguro (API de Google Gemini y base de datos REST basada en GitHub).

## Características Principales

1. **Dashboard del Estudiante**: Interfaz intuitiva y responsiva con estilo minimalista de alto contraste inspirado en la estética de [goodapps.com.ar](https://goodapps.com.ar/).
2. **3 Actividades de Aprendizaje Autónomo**:
   - Diagnóstico de Necesidades de Capacitación (DNC).
   - Diseño del Plan de Capacitación.
   - Evaluación del Retorno (Modelo Kirkpatrick).
3. **Feedback Inmediato de Inteligencia Artificial**: Conexión con el modelo **Gemini 1.5 Flash** para evaluar la entrega en una escala de 1 a 5 y ofrecer devoluciones constructivas en español rioplatense (argentino).
4. **Gamificación por Insignias (Badges)**: Asignación automática de rangos según la rúbrica de puntaje total (de 3 a 15 puntos):
   - *Aprendiz de Formación 🛡️* (3-6 pts)
   - *Especialista en Desarrollo 🚀* (7-11 pts)
   - *Líder de Aprendizaje 👑* (12-15 pts)
5. **Certificado Digital Descargable**: Generación de un diploma interactivo que utiliza `html2canvas` para ser descargado directamente como imagen `.png`.
6. **Panel Docente Protegido**: Acceso con contraseña (`2228`) para visualizar el listado de alumnos, ver detalles completos de sus respuestas y exportar todos los datos a un archivo **CSV** compatible con Microsoft Excel.

---

## Arquitectura y Tecnologías

- **Frontend**: Single Page Application (HTML/CSS/JS).
  - `index.html`: Estructura semántica de vistas y modales.
  - `styles.css`: Hojas de estilos y layouts (Flexbox / CSS Grid). Soporte para tema claro y oscuro (toggle).
  - `app.js`: Manejo de estados de la SPA y captura del Canvas de Certificación.
- **Backend (Netlify Functions)**:
  - `netlify/functions/feedback.js`: Proxy serverless hacia Google Gemini API.
  - `netlify/functions/database.js`: Base de datos ligera e inteligente. Utiliza la API REST de GitHub para leer y persistir los envíos en un archivo `db.json` del repositorio.

---

## Configuración y Despliegue Local

### Requisitos Previos
- [Node.js](https://nodejs.org/) (Versión 18 o superior recomendado)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) instalado de forma global:
  ```bash
  npm install -g netlify-cli
  ```

### Ejecutar Localmente
1. Cloná o navegá al directorio del proyecto:
   ```bash
   cd formacion-actividades-spa
   ```
2. Ejecutá el servidor de desarrollo local de Netlify (esto levantará el frontend y las serverless functions en simultáneo):
   ```bash
   netlify dev
   ```
3. Abrí el navegador en la URL indicada (habitualmente `http://localhost:8888`).

---

## Configuración de Secretos y Variables de Entorno

Para que la aplicación funcione a nivel de producción (en Netlify y mediante despliegue automático de GitHub Actions), debés configurar las siguientes credenciales en sus respectivas plataformas:

### 1. Variables de Entorno en el Panel de Netlify
Accedé a tu sitio en Netlify, dirigite a **Site configuration** > **Environment variables** y agregá:

- `GEMINI_API_KEY`: Tu clave de acceso a la API de Google Gemini (podés obtenerla en [Google AI Studio](https://aistudio.google.com/)). *Si no se configura, el backend funcionará en modo Simulación (Mock).*
- `GITHUB_PAT`: Un Personal Access Token (PAT) de tu cuenta de GitHub (con permisos de lectura y escritura en el repositorio).
- `GITHUB_REPO`: El path de tu repositorio donde se guardará el archivo `db.json` (ejemplo: `nombre-usuario/nombre-repositorio`).

### 2. Secretos de GitHub (GitHub Secrets)
Para posibilitar el despliegue automático con GitHub Actions configurado en `.github/workflows/deploy.yml` ante cada `push` en la rama `main`, agregá los siguientes secretos en tu repositorio de GitHub (**Settings** > **Secrets and variables** > **Actions** > **New repository secret**):

- `NETLIFY_AUTH_TOKEN`: Tu token de acceso personal de Netlify (obtenido en tu perfil de Netlify > *User settings* > *Applications* > *Personal access tokens*).
- `NETLIFY_SITE_ID`: El ID de tu sitio de Netlify (disponible en *Site configuration* > *Site details* > *API ID*).

---

## Uso del Panel Docente
1. Hacé clic en **Acceso Docente** en la barra superior.
2. Ingresá la contraseña: `2228`.
3. Podrás auditar el progreso general, revisar reflexiones detalladas, abrir los links investigados por los alumnos y descargar el reporte completo de la cursada en formato CSV presionando **Exportar a CSV**.
