# 🧱 Lego Tracker & Collection Manager

   * [English](#english)
   * [Español](#español)

---

<a name="english"></a>
# English

A premium, interactive, and modern web dashboard designed for LEGO collectors and investors. This application allows you to catalog your sets, track their financial value, manage minifigures, search for missing pieces in real-time through **Rebrickable** and **Brickset** API integrations, and visualize your entire collection in a sleek, adaptative glassmorphism UI with dynamic themes.

The project is designed to be lightweight, storing all information in local CSV files, and comes ready to run out-of-the-box with a clean, empty collection.

---

## 🎥 Demo Video

Watch the application in action: [Lego Tracker Demo Video (Google Drive)](https://drive.google.com/file/d/166PqsiH0nErKtvf9k1PQxifuFTq4XEv3/view?usp=drive_link)

---

## ✨ Key Features

*   **📊 Dual Financial Dashboard**:
    *   *Investor View*: Monitor invested capital, accumulated savings, average discount percentage, and active ROI on investment sets.
    *   *Collector View (Legacy)*: Focused on nostalgia and historical portfolio value (Equity). Shows market value even for childhood sets with a `0.00€` purchase price.
*   **🎨 Premium Design & Dynamic Themes**:
    *   Modern glassmorphism UI with smooth animations.
    *   Interchangeable themes (Star Wars, Batman, Pirates of the Caribbean, Harry Potter, and Classic LEGO) that dynamically swap backgrounds, logos, and color palettes.
    *   Theme-based card auras/borders based on set tags or investment goals.
*   **🔌 Hybrid LEGO API Integrations**:
    *   Fetches details from **Rebrickable** and **Brickset** automatically by Set ID.
    *   Imports metadata: Name, Year, Part count, Theme, Official URL, MSRP, and current market value.
    *   Downloads and processes images locally in real-time, automatically removing white backgrounds for a premium transparent finish.
*   **👥 Minifigure Inventory**:
    *   View and catalog all minifigs included in your sets.
    *   Displays official images, codes, and counts.
*   **⚙️ Missing & Damaged Pieces Tracker**:
    *   Built-in shopping list for lost or broken parts.
    *   Classifies piece statuses (`Needed`, `Ordered`, `Received`).
    *   Quick element lookup by ID or lot to pull metadata automatically from the API.
*   **💾 Lightweight & Robust Local Storage**:
    *   Uses simple CSV files for databases.
    *   Automatically creates numbered backups in a `backups/` directory on server startup and whenever data is modified.

---

## 📂 Project Structure

*   `main.py`: FastAPI backend hosting REST API endpoints and LEGO API integrations.
*   `public/`: Folder containing frontend assets.
    *   `index.html`: Dashboard structure and interface.
    *   `style.css`: Premium styles, animations, and theme configurations.
    *   `app.js`: Client-side rendering, financial computations, and API interactions.
    *   `images/`: UI assets and directory where downloaded set images are processed and saved.
*   `requirements.txt`: Python package dependencies.
*   `rebrickable_key.txt.example`: API key template file.
*   `lookup_pieces.py` / `lookup_lote.py`: CLI scripts to query parts and lot info directly from the terminal.
*   `add_lote.py` / `add_pieces_7676.py`: Example scripts demonstrating batch imports and piece additions to the local API.

---

## 🚀 Local Setup & Run Guide

Follow these steps to run the application locally:

### 1. Prerequisites
*   **Python 3.10 or higher** installed.
*   A [Rebrickable](https://rebrickable.com/) account to get a free API Key (needed to search sets and pieces dynamically).

### 2. Clone and Prepare the Project
Download the repository files:
```bash
git clone <your_github_repository_url>
cd Lego
```

### 3. Create and Activate a Virtual Environment
We recommend isolating python dependencies:

*   **On Windows (PowerShell):**
    ```powershell
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    ```
*   **On Windows (CMD):**
    ```cmd
    python -m venv venv
    .\venv\Scripts\activate.bat
    ```
*   **On macOS or Linux:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

### 4. Install Dependencies
Install all required packages:
```bash
pip install -r requirements.txt
```

### 5. Configure the Rebrickable API Key
The app reads your API key to search Rebrickable. You have two ways to configure it (the backend reads them in this order):

*   **Option A (Text file - Recommended):**
    Rename `rebrickable_key.txt.example` to `rebrickable_key.txt` and replace its content with your API key:
    ```text
    YOUR_REBRICKABLE_API_KEY_HERE
    ```
*   **Option B (Environment Variable):**
    Set the `REBRICKABLE_API_KEY` environment variable:
    *   *Windows (PowerShell)*: `$env:REBRICKABLE_API_KEY="your_api_key"`
    *   *Linux/macOS*: `export REBRICKABLE_API_KEY="your_api_key"`

### 6. Run the Application
Start the FastAPI server:
```bash
uvicorn main:app --reload
```
Once it's running, open your browser and visit:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 📭 Starting Empty

The repository is pre-configured to **start completely empty** for new users:
*   On the first run, the backend automatically generates empty `legos.csv` and `missing_pieces.csv` databases with the correct headers.
*   Your personal database files, backups, API keys, and local cache files are excluded in `.gitignore`, preventing accidental commits.

---

<a name="español"></a>
# Español

Un panel de control web premium, interactivo y moderno diseñado para coleccionistas e inversores de LEGO. Esta aplicación te permite catalogar tus sets, realizar un seguimiento de su valor financiero, gestionar minifiguras, buscar piezas faltantes en tiempo real mediante integraciones con las APIs de **Rebrickable** y **Brickset**, y visualizar toda tu colección en una interfaz con diseño glassmorphism adaptativo y temas visuales dinámicos.

El proyecto está diseñado para ser ligero, almacenando toda la información en bases de datos locales en formato CSV, y viene listo para usarse desde cero con una colección vacía.

---

## 🎥 Video de Demostración

Mira la aplicación en acción: [Video de Demostración de Lego Tracker (Google Drive)](https://drive.google.com/file/d/166PqsiH0nErKtvf9k1PQxifuFTq4XEv3/view?usp=drive_link)

---

## ✨ Características Principales

*   **📊 Panel Financiero de Doble Vista**:
    *   *Vista de Inversionista*: Monitoriza el capital invertido, el ahorro acumulado, el porcentaje medio de descuento conseguido y el ROI de las inversiones activas.
    *   *Vista de Coleccionista (Legacy)*: Enfocado en el valor emocional e histórico (Equity). Muestra el valor total de mercado de la colección, permitiendo sets de la infancia con precio de compra a `0.00€` que aún aportan un gran valor real de mercado.
*   **🎨 Diseño Premium y Temas Dinámicos**:
    *   Interfaz moderna de estilo *glassmorphism* con animaciones fluidas.
    *   Temas visuales adaptativos intercambiables (Star Wars, Batman, Piratas del Caribe, Harry Potter y LEGO clásico) que cambian el fondo, el logo y la paleta de colores.
    *   Auras temáticas en las tarjetas de los sets según su temática o propósito (Inversión vs. Colección).
*   **🔌 Integración Híbrida con APIs de LEGO**:
    *   Conexión con **Rebrickable** y **Brickset** para buscar sets por ID.
    *   Importación automática de metadatos: Nombre, Año, Cantidad de piezas, Temática, URLs oficiales, MSRP (precio original) y valor actual de mercado.
    *   Descarga y optimización de imágenes locales en tiempo real, removiendo automáticamente fondos blancos para lograr transparencias premium.
*   **👥 Inventario de Minifiguras**:
    *   Visualiza e inventaria todas las minifiguras incluidas en tus sets.
    *   Muestra imágenes oficiales, códigos identificadores y cantidades.
*   **⚙️ Gestor de Piezas Faltantes y Dañadas**:
    *   Lista de compras integrada para piezas rotas o perdidas.
    *   Clasifica el estado de cada pieza (`Falta`, `Pedido`, `Recibido`).
    *   Buscador rápido de ID de pieza o lote para cargarlos automáticamente desde la API.
*   **💾 Robustez Local**:
    *   Base de datos ligera basada en archivos CSV locales.
    *   Generación automática de backups numerados en la carpeta `backups/` en cada inicio y edición de datos para evitar pérdidas accidentales.

---

## 📂 Estructura del Proyecto

*   `main.py`: Servidor backend en FastAPI con endpoints REST (CRUD) y lógica de comunicación con APIs de LEGO.
*   `public/`: Carpeta que contiene los activos frontend de la aplicación web.
    *   `index.html`: Estructura e interfaz de usuario del dashboard.
    *   `style.css`: Estilos visuales premium, animaciones y hojas de estilo de los temas.
    *   `app.js`: Lógica de renderizado, cálculo de métricas en el cliente y llamadas a la API.
    *   `images/`: Recursos visuales y carpeta donde se procesan y guardan las imágenes descargadas.
*   `requirements.txt`: Dependencias de Python necesarias.
*   `rebrickable_key.txt.example`: Plantilla de configuración para la clave API de Rebrickable.
*   `lookup_pieces.py` / `lookup_lote.py`: Scripts utilitarios CLI para consultar piezas e información de lotes rápidamente desde la terminal.
*   `add_lote.py` / `add_pieces_7676.py`: Scripts de ejemplo para importación masiva de datos y piezas a través de la API local.

---

## 🚀 Guía de Configuración y Ejecución Local

Sigue estos pasos para poner en marcha el proyecto en tu máquina local:

### 1. Requisitos Previos
*   **Python 3.10 o superior** instalado en tu sistema.
*   Una cuenta en [Rebrickable](https://rebrickable.com/) para obtener una clave de API gratuita (necesaria para la búsqueda automática de sets y piezas).

### 2. Clonar y Preparar el Proyecto
Descarga el código del repositorio en tu máquina:
```bash
git clone <url_de_tu_repositorio_de_github>
cd Lego
```

### 3. Crear y Activar un Entorno Virtual
Se recomienda utilizar un entorno virtual de Python para mantener las dependencias aisladas:

*   **En Windows (PowerShell):**
    ```powershell
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    ```
*   **En Windows (CMD / Símbolo del Sistema):**
    ```cmd
    python -m venv venv
    .\venv\Scripts\activate.bat
    ```
*   **En macOS o Linux:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

### 4. Instalar Dependencias
Una vez activado el entorno virtual, instala las dependencias de Python requeridas:
```bash
pip install -r requirements.txt
```

### 5. Configurar la API Key de Rebrickable
La aplicación necesita tu clave API para consultar detalles en Rebrickable. Tienes dos formas de configurarla (el sistema intentará leer ambas en este orden):

*   **Opción A (Archivo de texto - Recomendado):**
    Renombra el archivo `rebrickable_key.txt.example` a `rebrickable_key.txt` y reemplaza su contenido con tu clave API:
    ```text
    TU_API_KEY_DE_REBRICKABLE_AQUI
    ```
*   **Opción B (Variable de Entorno):**
    Establece la clave API en la variable de entorno `REBRICKABLE_API_KEY`:
    *   *Windows (PowerShell)*: `$env:REBRICKABLE_API_KEY="tu_clave_api"`
    *   *Linux/macOS*: `export REBRICKABLE_API_KEY="tu_clave_api"`

### 6. Ejecutar la Aplicación
Inicia el servidor web local con `uvicorn`:
```bash
uvicorn main:app --reload
```
Una vez iniciado, abre tu navegador web favorito y accede a:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## Nota para el Inicio Vacío

El repositorio viene configurado para **iniciar completamente vacío**, listo para que añadas tu propia colección:
*   En el primer inicio de la aplicación, el backend detectará que no existen bases de datos locales y creará automáticamente los archivos `legos.csv` y `missing_pieces.csv` vacíos con las cabeceras correctas.
*   Tus bases de datos, claves de API, copias de seguridad e imágenes de sets descargadas están excluidas del control de versiones (`.gitignore`), por lo que nunca se subirán a tu repositorio de GitHub por error.
