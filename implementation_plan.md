# Lego Tracker - Plan de Implementación Actualizado

Vamos a construir un rastreador de colección de Lego premium y altamente interactivo. La aplicación utilizará un archivo CSV local (`legos.csv`) como base de datos y contará con un panel web (dashboard) premium donde podrás añadir, ver, editar y analizar tus sets de Lego.

## User Review Required

> [!IMPORTANT]
> - **Estructura de Base de Datos y Enums**: Implementaremos validaciones estrictas tanto en el frontend como en el backend para los campos `condition` (estado físico del set) y `goal` (propósito financiero: inversión vs colección).
> - **Doble Vista Financiera (Inversor vs Coleccionista)**: 
>   - *Vista Inversor*: Muestra Total Gastado, Total Ahorrado, % de Ahorro Promedio y ROI de Inversión Activa.
>   - *Vista Coleccionista / Legacy*: Muestra el valor total estimado del portafolio (Equity) incluyendo joyas de la infancia donde el precio de compra fue de 0.00€ pero tienen valor de mercado real actual.
> - **Temas Visuales Diferenciados**: Las tarjetas de sets tendrán auras o bordes temáticos: Star Wars (azul/rojo cósmico), Batman (gris oscuro/oro), Inversión (borde verde sutil) y Colección/Legacy (aura púrpura/dorada).

---

## Columnas de la Base de Datos (`legos.csv`)

| Columna | Descripción | Ejemplo / Valores Permitidos |
| :--- | :--- | :--- |
| `id` | ID único del set de Lego | `75337` |
| `name` | Nombre del set | `AT-TE Walker` |
| `theme` | Tema principal | `Star Wars` |
| `subcategory` | Subcategoría o colección | `Revenge of the Sith` |
| `purchase_date` | Fecha de compra (YYYY-MM-DD) | `2026-06-16` (Vacío/estimado en Legacy) |
| `release_date` | Fecha de salida del set (YYYY-MM-DD) | `2022-08-01` |
| `retirement_date` | Fecha de retirada (YYYY-MM-DD o `Active`) | `Active` |
| `official_url` | URL oficial en la tienda Lego | `https://www.lego.com/es-es/...` |
| `retail_price` | Precio oficial de venta (€) | `139.99` |
| `purchase_price` | Precio real pagado (€) | `119.99` (0.00 si fue regalo o infancia) |
| `market_price` | Valor de mercado actual (€) | `145.00` (Crucial para sets Legacy antiguos) |
| `extra_costs` | Costes de envío, tasas o extras (€) | `0.00` |
| `purchase_store` | Tienda de adquisición | `ToysRUs`, `Lego Store`, `El Corte Inglés`, `Fnac`, etc. |
| `purchase_location` | Ubicación geográfica o canal | `Málaga`, `Madrid`, `Online`, `Granada`, etc. |
| `condition` | Estado físico del set (Enum estricto) | *Ver abajo la lista de valores* |
| `goal` | Propósito del activo (Enum estricto) | `collection` o `investment` |
| `notes` | Notas de compra, estado de caja, etc. | `Caja impecable. Incluye Commander Cody.` |

### Enums Permitidos

#### Campo `condition` (Estado Físico):
- `sealed`: Precintado de fábrica.
- `complete_mib`: Completo con caja e instrucciones (Mint in Box).
- `complete_loose`: Completo pero sin caja.
- `no_manual`: Completo con caja pero sin instrucciones.
- `no_box_no_manual`: Completo sin caja y sin instrucciones.
- `no_minifigs`: Completo con caja/instrucciones pero sin minifiguras.
- `incomplete_with_minifigs`: Faltan piezas de construcción, pero tiene las figuras.
- `incomplete_no_minifigs`: Incompleto y sin minifiguras.

#### Campo `goal` (Propósito Financiero):
- `collection`: Colección personal, nostalgia, no se vende.
- `investment`: Especulación, futura reventa para obtener margen.

---

## Cambios Propuestos

Crearemos el proyecto con la siguiente estructura de archivos dentro del directorio de trabajo:
- [legos.csv](file:///c:/Users/Usuario/Desktop/Lego/legos.csv) - La base de datos CSV.
- [requirements.txt](file:///c:/Users/Usuario/Desktop/Lego/requirements.txt) - Dependencias del backend (fastapi, uvicorn).
- [main.py](file:///c:/Users/Usuario/Desktop/Lego/main.py) - Servidor FastAPI para endpoints CRUD, validación estricta y servicio de estáticos.
- [public/index.html](file:///c:/Users/Usuario/Desktop/Lego/public/index.html) - Estructura HTML y modales de edición.
- [public/style.css](file:///c:/Users/Usuario/Desktop/Lego/public/style.css) - Estilos premium (glassmorphism, auras temáticas y animaciones).
- [public/app.js](file:///c:/Users/Usuario/Desktop/Lego/public/app.js) - Lógica de renderizado, cálculo de métricas financieras duales y llamadas a la API.

---

### Componentes de Backend

#### [NEW] [requirements.txt](file:///c:/Users/Usuario/Desktop/Lego/requirements.txt)
Define las dependencias requeridas para iniciar el servicio:
```text
fastapi>=0.100.0
uvicorn>=0.20.0
```

#### [NEW] [main.py](file:///c:/Users/Usuario/Desktop/Lego/main.py)
- Levanta un servidor web local y monta la carpeta `public` como archivos estáticos.
- Endpoints expuestos:
  - `GET /api/legos` - Lee y devuelve todos los sets parseados desde `legos.csv`.
  - `POST /api/legos` - Valida y añade un nuevo set al CSV.
  - `PUT /api/legos/{lego_id}` - Edita un set existente en el CSV.
  - `DELETE /api/legos/{lego_id}` - Elimina un set del CSV.
- **Robustez y Seguridad**:
  - Genera automáticamente un backup de seguridad (`legos.csv.bak`) en el arranque y antes de escribir cualquier cambio.
  - Valida estrictamente que los campos `condition` y `goal` correspondan a los enums permitidos.

#### [NEW] [legos.csv](file:///c:/Users/Usuario/Desktop/Lego/legos.csv)
Inicializado con la cabecera correspondiente y cargado con los siguientes registros reales iniciales:
1. **AT-TE Walker (75337)**: Star Wars, Goal: `investment`, Condition: `sealed`, purchase_price: `119.99`, retail_price: `139.99`, market_price: `145.00`, purchase_store: `Lego Store`, purchase_location: `Online`.
2. **Queen Anne's Revenge (4195)**: Pirates of the Caribbean, Goal: `collection`, Condition: `complete_mib`, purchase_price: `0.00`, retail_price: `249.99`, market_price: `450.00`, purchase_store: `ToysRUs`, purchase_location: `Málaga` (Joyas de la infancia/Legacy).

---

### Componentes de Frontend

#### [NEW] [public/index.html](file:///c:/Users/Usuario/Desktop/Lego/public/index.html)
- Cabecera del panel de control con métricas financieras separadas:
  - **KPIs de Inversión**: Dinero Gastado, Dinero Ahorrado, % Ahorro Promedio y ROI Activo.
  - **KPIs de Colección (Legacy)**: Valor Estimado de Portafolio (Equity de nostalgia).
- Barra de herramientas interactiva:
  - Selector de filtro rápido por **Tema** (Todos, Star Wars, Batman, Piratas del Caribe).
  - Selector de filtro por **Propósito** (Todos, Solo Inversión, Solo Colección).
  - Caja de búsqueda inteligente por texto y selector de ordenación (Precio, ID, Fecha de compra).
- Grid dinámico de tarjetas de sets, mostrando detalles del canal de compra (tienda y ubicación).
- Modales elegantes para añadir y editar sets con controles tipo `<select>` para los enums de estado y propósito, y campos de texto para la tienda de adquisición y ubicación.

#### [NEW] [public/style.css](file:///c:/Users/Usuario/Desktop/Lego/public/style.css)
- **Aesthetic Premium**: Fondo oscuro profundo con gradientes sutiles y efectos de desenfoque de cristal (glassmorphism).
- **Estilos Temáticos para Tarjetas**:
  - **Star Wars**: Resplandor celeste/rojo sutil en los bordes y fondo espacial.
  - **Batman**: Bordes oscuros con toques de amarillo y sombras intensas.
  - **Inversión**: Sub-borde verde que denota activo financiero y potencial de ganancia.
  - **Colección (Legacy)**: Aura dorada/púrpura suave que denota nostalgia e historia.
- **Animaciones fluidas**: Transiciones suaves al hacer hover, escalados dinámicos y cambios en los botones.

#### [NEW] [public/app.js](file:///c:/Users/Usuario/Desktop/Lego/public/app.js)
- Controla el estado local de la aplicación y la sincronización con la API de FastAPI.
- Calcula las métricas en tiempo real aplicando los filtros de usuario activos.
- Implementa el renderizado adaptativo de tarjetas basándose en los enums e información financiera.

---

## Plan de Verificación

### Pruebas Automatizadas
- Ejecutar `pip install -r requirements.txt` para instalar librerías.
- Ejecutar `uvicorn main:app --reload` para levantar la API local en `http://localhost:8000`.

### Verificación Manual
1. Abrir `http://localhost:8000` en el navegador.
2. Confirmar la carga correcta de los dos sets semilla: AT-TE Walker (75337) y Queen Anne's Revenge (4195).
3. Comprobar que los cálculos de las métricas separan correctamente la inversión de la colección legado (ej. Queen Anne's Revenge con coste 0.00€ cuenta para el valor del portafolio pero no altera la tasa de ahorro de inversión).
4. Crear un nuevo set de Batman (ej: 76139) y guardarlo para comprobar la persistencia en `legos.csv` y la creación del backup `legos.csv.bak`.
5. Modificar el estado físico y verificar que cambia la visualización y se mantiene el enum correcto.

---

## Líneas Futuras (Roadmap de Inversor)

1. **Clasificación "Urgencia EOL" (Estado de Retirada)**: Semáforo visual en tarjetas (Verde: activo/seguro, Amarillo: se retira en < 6 meses, Rojo: retirado oficialmente/EOL).
2. **Cálculo de Plusvalía / Equity Total Real**: Mostrar el beneficio neto estimado actual combinando las dos carteras: $\text{Beneficio} = \text{market\_price} - (\text{purchase\_price} + \text{extra\_costs})$.
3. **Control de Piezas Faltantes**: Vinculación de notas de sets marcados como `incomplete` para listar qué piezas específicas comprar para restaurar los sets Legacy a estados premium de colección.
4. **Registro y Valoración de Minifiguras Individuales**: Las minifiguras exclusivas (como Commander Cody, Davy Jones, etc.) suelen representar el 50% o más del valor de un set. Planificamos añadir una sección independiente de inventario de minifiguras, permitiendo registrar minifiguras sueltas (loose), calcular su valor de mercado individual, y marcar cuáles posees o te faltan en cada set.
