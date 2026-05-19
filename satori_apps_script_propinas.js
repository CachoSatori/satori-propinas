// ═══════════════════════════════════════════════════════════════
// SATORI · Módulo Propinas — Adiciones al Apps Script v3.0
// Agregar estas funciones al satori_apps_script_v3.js existente
// y registrar las acciones en doGet y doPost
// ═══════════════════════════════════════════════════════════════

// ── Hojas: Módulo Propinas ────────────────────────────────────
const SHEET_PROP_EMPLEADOS = 'propinas_empleados';
const SHEET_PROP_ROLES     = 'propinas_roles';
const SHEET_PROP_TURNOS    = 'propinas_turnos';

// ── Roles por defecto ─────────────────────────────────────────
const ROLES_DEFAULT = [
  ['salonero', 10],
  ['barman',    5],
  ['barback',   4],
  ['runner',    3],
  ['cocina',    5],
  ['manager',   3],
];

// ══════════════════════════════════════════════════════════════
// AGREGAR EN doGet — dentro del bloque if/else if de acciones:
//
//   else if (action === 'getEmpleadosPropinas') result = getEmpleadosPropinas();
//   else if (action === 'getRolesPropinas')     result = getRolesPropinas();
//   else if (action === 'getTurnosPropinas')    result = getTurnosPropinas(params);
//
// AGREGAR EN doPost:
//   else if (action === 'saveEmpleadoPropinas')  result = saveEmpleadoPropinas(params.data);
//   else if (action === 'deleteEmpleadoPropinas')result = deleteEmpleadoPropinas(params.id);
//   else if (action === 'saveRolPropinas')        result = saveRolPropinas(params.data);
//   else if (action === 'saveTurnoPropinas')      result = saveTurnoPropinas(params.data);
//   else if (action === 'deleteTurnoPropinas')    result = deleteTurnoPropinas(params.id);
// ══════════════════════════════════════════════════════════════

// ── GET: Empleados ────────────────────────────────────────────
function getEmpleadosPropinas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName(SHEET_PROP_EMPLEADOS);
  if (!ws) {
    ws = ss.insertSheet(SHEET_PROP_EMPLEADOS);
    ws.appendRow(['id', 'nombre', 'rol', 'activo']);
    return { ok: true, data: [] };
  }
  if (ws.getLastRow() < 2) return { ok: true, data: [] };
  const rows = ws.getRange(2, 1, ws.getLastRow() - 1, 4).getValues();
  return {
    ok: true,
    data: rows.filter(r => r[0]).map(r => ({
      id: String(r[0]), nombre: r[1], rol: r[2], activo: r[3] !== false && r[3] !== 'FALSE'
    }))
  };
}

// ── GET: Roles ────────────────────────────────────────────────
function getRolesPropinas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName(SHEET_PROP_ROLES);
  if (!ws) {
    ws = ss.insertSheet(SHEET_PROP_ROLES);
    ws.appendRow(['rol', 'puntos']);
    ROLES_DEFAULT.forEach(r => ws.appendRow(r));
  }
  if (ws.getLastRow() < 2) {
    ROLES_DEFAULT.forEach(r => ws.appendRow(r));
  }
  const rows = ws.getRange(2, 1, ws.getLastRow() - 1, 2).getValues();
  return {
    ok: true,
    data: rows.filter(r => r[0]).map(r => ({ rol: r[0], puntos: Number(r[1]) }))
  };
}

// ── GET: Turnos ───────────────────────────────────────────────
function getTurnosPropinas(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName(SHEET_PROP_TURNOS);
  if (!ws) {
    ws = ss.insertSheet(SHEET_PROP_TURNOS);
    ws.appendRow(['id', 'fecha', 'dia_semana', 'num_semana', 'datos_json', 'created_at']);
    return { ok: true, data: [] };
  }
  if (ws.getLastRow() < 2) return { ok: true, data: [] };
  const rows = ws.getRange(2, 1, ws.getLastRow() - 1, 6).getValues();
  let data = rows.filter(r => r[0]).map(r => {
    let datos = {};
    try { datos = JSON.parse(r[4] || '{}'); } catch(e) {}
    return { id: String(r[0]), fecha: r[1], dia_semana: r[2], num_semana: r[3], datos, created_at: r[5] };
  });
  if (params.mes && params.anio) {
    const prefix = `${params.anio}-${String(params.mes).padStart(2, '0')}`;
    data = data.filter(r => String(r.fecha).startsWith(prefix));
  }
  data.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  return { ok: true, data };
}

// ── POST: Guardar/Editar Empleado ─────────────────────────────
function saveEmpleadoPropinas(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName(SHEET_PROP_EMPLEADOS);
  if (!ws) {
    ws = ss.insertSheet(SHEET_PROP_EMPLEADOS);
    ws.appendRow(['id', 'nombre', 'rol', 'activo']);
  }
  const d = typeof data === 'string' ? JSON.parse(data) : data;
  const activo = d.activo !== false && d.activo !== 'false';
  if (d.id) {
    const lastRow = ws.getLastRow();
    if (lastRow >= 2) {
      const ids = ws.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(d.id)) {
          ws.getRange(i + 2, 1, 1, 4).setValues([[d.id, d.nombre, d.rol, activo]]);
          return { ok: true };
        }
      }
    }
  }
  const newId = d.id || Utilities.getUuid();
  ws.appendRow([newId, d.nombre, d.rol, activo]);
  return { ok: true, id: newId };
}

// ── POST: Eliminar Empleado ───────────────────────────────────
function deleteEmpleadoPropinas(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(SHEET_PROP_EMPLEADOS);
  if (!ws || ws.getLastRow() < 2) return { ok: false, error: 'Not found' };
  const ids = ws.getRange(2, 1, ws.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      ws.deleteRow(i + 2);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Not found' };
}

// ── POST: Guardar/Editar Rol ──────────────────────────────────
function saveRolPropinas(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName(SHEET_PROP_ROLES);
  if (!ws) {
    ws = ss.insertSheet(SHEET_PROP_ROLES);
    ws.appendRow(['rol', 'puntos']);
    ROLES_DEFAULT.forEach(r => ws.appendRow(r));
  }
  const d = typeof data === 'string' ? JSON.parse(data) : data;
  const lastRow = ws.getLastRow();
  if (lastRow >= 2) {
    const rols = ws.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < rols.length; i++) {
      if (String(rols[i][0]) === String(d.rol)) {
        ws.getRange(i + 2, 2).setValue(Number(d.puntos));
        return { ok: true };
      }
    }
  }
  ws.appendRow([d.rol, Number(d.puntos)]);
  return { ok: true };
}

// ── POST: Guardar Turno ───────────────────────────────────────
function saveTurnoPropinas(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName(SHEET_PROP_TURNOS);
  if (!ws) {
    ws = ss.insertSheet(SHEET_PROP_TURNOS);
    ws.appendRow(['id', 'fecha', 'dia_semana', 'num_semana', 'datos_json', 'created_at']);
  }
  const d = typeof data === 'string' ? JSON.parse(data) : data;
  const datosJson = JSON.stringify(d.datos || {});
  if (d.id) {
    const lastRow = ws.getLastRow();
    if (lastRow >= 2) {
      const ids = ws.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(d.id)) {
          const existing = ws.getRange(i + 2, 6).getValue();
          ws.getRange(i + 2, 1, 1, 6).setValues([[
            d.id, d.fecha, d.dia_semana, d.num_semana, datosJson, existing
          ]]);
          return { ok: true };
        }
      }
    }
  }
  const newId = Utilities.getUuid();
  ws.appendRow([newId, d.fecha, d.dia_semana, d.num_semana, datosJson, new Date().toISOString()]);
  return { ok: true, id: newId };
}

// ── POST: Eliminar Turno ──────────────────────────────────────
function deleteTurnoPropinas(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(SHEET_PROP_TURNOS);
  if (!ws || ws.getLastRow() < 2) return { ok: false, error: 'Not found' };
  const ids = ws.getRange(2, 1, ws.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      ws.deleteRow(i + 2);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Not found' };
}
