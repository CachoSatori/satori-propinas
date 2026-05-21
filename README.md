# 里 Satori Propinas

App de distribución de propinas para el restaurante Satori (Costa Rica).  
Construida como aplicación web HTML puro + Google Sheets como backend.

---

## 🔗 Links del proyecto

| Recurso | URL |
|---|---|
| App en producción | https://cachosatori.github.io/satori-propinas/ |
| Repositorio GitHub | https://github.com/CachoSatori/satori-propinas |
| Apps Script URL | `https://script.google.com/macros/s/AKfycbz_MPh6TFtM6ToY_2CbbdHvtyKCwGg5uFPzYpw-9vcTtmtXX5BDIpnqE3KJgKtZwFBkeg/exec` |

> Mismo Apps Script y Google Sheet que el Dashboard de Ventas y la app de Caja.

---

## 📁 Archivos del proyecto

```
SATORI PROPINAS/
├── index.html                    ← App completa (frontend + lógica)
├── satori_apps_script_v4.1.js    ← Backend unificado (ventas + propinas + reportes)
├── email_ejemplo_abril.html      ← Preview interactivo del correo mensual
└── README.md                     ← Este archivo
```

---

## 🏗 Arquitectura

```
Empleado / Manager registra propinas
        ↓
  App web (index.html en GitHub Pages)
        ↓
  Google Sheets (hoja 'propinas_turnos') vía Apps Script
        ↓
  Manager consulta historial y resúmenes
        ↓
  Reporte mensual por correo (automático o manual)
```

**Stack:**
- **Frontend:** HTML/CSS/JS puro — sin frameworks ni dependencias externas
- **Backend:** Google Apps Script (Web App) sobre Google Sheets
- **Hosting:** GitHub Pages (gratuito)
- **Persistencia:** Google Sheets

---

## 🔐 Sistema de acceso

| Rol | Acceso | Cómo entra |
|---|---|---|
| **Owner / Manager** | Todo + Admin | PIN (hardcodeado en `index.html`) |
| **Empleado** | Registro de propinas de su turno | Selecciona su nombre |

Para cambiar el PIN: editar `index.html` en GitHub, buscar `ADMIN_PIN`, cambiar el valor, hacer commit.

---

## 📊 Funcionalidades

### Vista Empleado
- Seleccionar nombre y turno (Mediodía / Noche)
- Ingresar propinas del turno: monto en ₡, método (efectivo / tarjeta)
- Historial de sus propinas recientes

### Vista Manager / Owner
| Sección | Descripción |
|---|---|
| **Resumen** | Total propinas del período, desglose por empleado, filtro por fecha |
| **Por turno** | Detalle de cada turno registrado |
| **Admin** | Gestión de empleados + botón de reporte mensual |

### Admin — Reporte Mensual
- **💰 Enviar reporte de propinas** — envía el reporte del mes actual a satorisushibar@gmail.com
- El reporte de ventas completo (incluyendo propinas) se envía desde el Dashboard de Ventas → Config

---

## 🗄 Estructura de datos

### Google Sheets — hoja `propinas_turnos`
| fecha | turno | empleado | monto | metodo | registradoEn |
|---|---|---|---|---|---|
| 2026-05-14 | noche | Dolores | 15000 | efectivo | 2026-05-14T22:30:00Z |

---

## 📧 Reportes por correo

El sistema de reportes está documentado en detalle en:  
**`/reporte/README.md`** (carpeta hermana de esta)

Resumen rápido:
- **Automático día 1**: reporta mes anterior, incluye ventas + propinas
- **Automático día 15**: reporta mes en curso hasta ese día
- **Manual**: desde el botón Admin de esta app (solo propinas) o desde Dashboard → Config (ventas + propinas)

---

## 🔧 Backend — Apps Script

El archivo `satori_apps_script_v4.1.js` es el script unificado que maneja:
- Ventas y métricas del dashboard
- Propinas
- Caja (pagos a proveedores, movimientos)
- Reportes por correo

**Endpoints relevantes para propinas:**

| Acción | Tipo | Descripción |
|---|---|---|
| `savePropina` | POST | Registra una propina de turno |
| `getPropinas` | GET | Lista propinas del período |
| `getEmpleados` | GET | Lista de empleados activos |
| `saveEmpleado` | POST | Crea o actualiza empleado |
| `enviarReportePropinas` | GET | Dispara reporte de propinas del mes actual |

---

## 🔄 Cómo desplegar cambios

1. Copiar el contenido de `satori_apps_script_v4.1.js`
2. Ir a [script.google.com](https://script.google.com) → proyecto Satori
3. `Ctrl+A` → pegar → `Ctrl+S`
4. **Deploy → Manage deployments → lápiz → New version → Deploy**
5. La URL no cambia — las apps siguen funcionando sin cambios

---

## 🚀 Setup en nuevo dispositivo

1. Abrir `https://cachosatori.github.io/satori-propinas/`
2. La app sincroniza automáticamente desde Google Sheets
3. No requiere configuración adicional

---

## 🗺 Relacionado

- [satori-dashboard](https://github.com/CachoSatori/satori-dashboard) — Dashboard principal de ventas, métricas y análisis
- [satori-caja](https://github.com/CachoSatori/satori-caja) — Control de caja y pagos a proveedores
