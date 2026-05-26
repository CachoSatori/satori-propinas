# 里 Satori Propinas

App de distribución de propinas para el restaurante Satori (Costa Rica).  
Construida como aplicación web HTML puro + Google Sheets como backend.

🔗 **Live:** [cachosatori.github.io/satori-propinas](https://cachosatori.github.io/satori-propinas)

> Mismo Apps Script v4.1 y Google Sheet que el Dashboard de Ventas y la app de Caja.  
> Google Sheets ID: `1DP-gmuNO__QQbl0_2eBDIiLGz9ovvSVhQ5uaAuIqlm0`

---

## 📁 Archivos del proyecto

```
SATORI PROPINAS/
├── index.html                    ← App completa (frontend + lógica)
├── satori_apps_script_v4.1.js    ← Backend unificado (ventas + propinas + caja + reportes)
├── satori_apps_script_propinas.js← Versión anterior de referencia
├── email_ejemplo_abril.html      ← Preview interactivo del correo mensual
└── README.md                     ← Este archivo
```

---

## 🏗 Arquitectura

```
Manager registra turno de propinas
        ↓
  App web (index.html en GitHub Pages)
        ↓
  Google Sheets (hoja 'propinas_turnos') vía Apps Script v4.1
        ↓
  Manager / Owner consulta historial, resúmenes y stats
        ↓
  Reporte mensual por correo (automático o manual desde Dashboard)
```

**Stack:** HTML/CSS/JS puro · Google Apps Script · Google Sheets · GitHub Pages

---

## 🔐 Acceso

| Acceso | PIN | Descripción |
|---|---|---|
| **Admin** (Owner/Manager) | Hardcodeado en `index.html` como `ADMIN_PIN` | Todas las pestañas + registro de turnos |
| **Empleado** | Sin PIN | Selecciona su nombre — ve sus propias estadísticas |

---

## 📊 Pestañas

### Registro de Turno *(Admin)*
- Fecha, día de semana, número de semana, turno (AM/PM)
- Pool total de propinas del turno: sala, barra, efectivo (separados)
- Líneas por empleado: nombre, rol, horas trabajadas, propina generada
- Coberturas: empleados de otro rol cubriendo
- Cálculo automático de puntos y take-home por empleado según rol y horas
- Guardado en Google Sheets simultáneamente

### Historial *(Admin)*
- Todos los turnos registrados con filtro por período y empleado
- Cards colapsables por turno con detalle de distribución
- Modal de detalle completo con opción de eliminar
- Filtro de empleados: **excluye cocina**, muestra activos primero y luego inactivos con etiqueta `(inactivo)`

### Resumen *(Admin)*
- Agregado mensual por empleado con desglose Q1/Q2
- KPIs: Pool del mes · Total distribuido · Turnos · Empleados
- Filtro por empleado individual (ordenado: activos → inactivos, sin cocina)
- **Excluye automáticamente empleados con rol cocina**

### Mi Cuenta *(empleado / Admin)*
- Selector de empleado: todos excepto cocina, activos primero luego inactivos `(inactivo)`
- Historial acumulado por mes: total, Q1/Q2, días trabajados
- KPIs: acumulado total, promedio por turno, tendencia

### Stats *(Admin)*
- KPIs del período: pool total, promedio por turno, mejor turno, pool barra
- AM vs PM: promedio por tipo de turno
- Pool promedio por día de semana
- Tendencia por semana (barras)
- Distribución take-home por sector (excl. cocina)
- Top empleados del mes (excl. cocina)

### Admin *(Admin)*
- Gestión de empleados: agregar, editar rol, activar/desactivar
- Gestión de puntos por rol
- Agregar empleados en lote (un nombre por línea)

---

## 🍳 Cocina — Distribución especial

El equipo de cocina acumula el pool de propinas de la semana y lo divide **en partes iguales**, independientemente de las horas. Esta distribución no se calcula por turno sino semanalmente.

**Reglas:**
- Se suman todos los `take_home` de lineas con `rol = cocina` de todos los turnos de la semana
- Se divide en partes iguales entre los trabajadores de cocina que participaron esa semana
- **Selena** (jefa de cocina) está excluida como receptora — no recibe ninguna parte del pool

Esta distribución está visible **solo en la vista gerencial** del Dashboard de Ventas (pestaña Propinas → sección "🍳 Cocina — Pool semanal"). Los saldos individuales de cocina en el historial de propinas reflejan los valores del sistema y no esta distribución.

---

## 🧮 Sistema de distribución

### Puntos por rol (configurables en Admin)
| Rol | Pts/hora (default) |
|---|---|
| Salonero | 10 |
| Barman | 5 |
| Barback | 4 |
| Runner | 3 |
| Cocina | 5 |
| Cajero | 4 |
| Manager | 3 |

**Fórmula:**
```
pts_val = horas × pts_rol
take_home = (pts_val / total_pts_pool) × pool_total
```

El pool de barra (barman + barback) se distribuye separadamente entre esos roles.

---

## 🗄 Google Sheets — Hojas utilizadas

| Hoja | Contenido |
|---|---|
| `propinas_turnos` | Turnos registrados con lineas de distribución (JSON) |
| `empleados` | Padrón de empleados (compartido con Dashboard y Caja) |

**Schema `propinas_turnos`:**  
`id · fecha · dia_semana · num_semana · datos (JSON) · timestamp`

**Estructura de `datos`:**
```json
{
  "turno": "PM",
  "pool_total": 45000,
  "pool_sala": 30000,
  "pool_efectivo": 10000,
  "pool_barra": 5000,
  "point_rate": 1500,
  "total_pts_val": 30,
  "lineas": [
    {
      "nombre": "DOLORES", "rol": "salonero", "horas": 8,
      "propina_gen": 12000, "pts_val": 80, "take_home": 14000,
      "cobertura": false
    }
  ]
}
```

---

## 🔧 Backend — Apps Script v4.1

**Endpoints relevantes para propinas:**

| Acción | Tipo | Descripción |
|---|---|---|
| `getTurnosPropinas` | GET | Lista todos los turnos |
| `saveTurnoPropinas` | POST | Guarda un turno completo |
| `deleteTurnoPropinas` | POST | Elimina un turno por ID |
| `getEmpleados` | GET | Lista empleados activos e inactivos |
| `saveEmpleado` | POST | Crea o actualiza empleado |
| `getRolesPropinas` | GET | Configuración de puntos por rol |
| `saveRolesPropinas` | POST | Actualiza puntos por rol |

**Cambios recientes en el script:**
- `saveMovimientosBulk` — escritura batch de movimientos de caja, fecha forzada como texto plano para evitar conversión automática de Sheets
- `getMovimientos` — normalización defensiva de fechas tipo `Date` devueltas por Sheets

---

## 📧 Reportes mensuales

Los reportes de propinas se envían desde el **Dashboard de Ventas → Config** (botón "Ambos reportes") o vía triggers automáticos del Apps Script:

- **Día 1 de cada mes** → reporte mes anterior completo
- **Día 15** → reporte mes en curso hasta esa fecha

---

## 🔄 Actualizar el Apps Script

1. Copiar el contenido de `satori_apps_script_v4.1.js`
2. Ir a [script.google.com](https://script.google.com) → proyecto Satori
3. `Ctrl+A` → pegar → `Ctrl+S`
4. **Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar**
5. La URL no cambia — las apps siguen funcionando sin modificaciones

---

## 🚀 Setup en nuevo dispositivo

1. Abrir `https://cachosatori.github.io/satori-propinas/`
2. La app sincroniza automáticamente desde Google Sheets
3. No requiere configuración adicional

---

## 🗺 Relacionado

- [satori-dashboard](https://github.com/CachoSatori/satori-dashboard) — Dashboard de ventas, métricas y análisis
- [satori-caja](https://github.com/CachoSatori/satori-caja) — Control de caja y pagos a proveedores
