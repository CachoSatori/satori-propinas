// ═══════════════════════════════════════════════════════════════
// SATORI · Google Apps Script Backend v4.1
// Incluye: Dashboard de Ventas (v2.4) + Módulo Caja (v1.0)
//          + Módulo Propinas (v1.0) + Lista unificada de empleados
// ═══════════════════════════════════════════════════════════════

// ── Hojas: Dashboard Ventas ───────────────────────────────────
const SHEET_NAME_DIAS      = 'dias';
const SHEET_NAME_COMPS     = 'comps';
const SHEET_NAME_META      = 'meta';
const SHEET_NAME_PRODUCTOS = 'productos';
const SHEET_NAME_HIST      = 'historico';
const SHEET_NAME_ANUAL     = 'anual';

// ── Hojas: Módulo Caja ────────────────────────────────────────
const SHEET_TURNOS         = 'turnos';
const SHEET_MOVS           = 'movimientos';
const SHEET_PROV_CAJA      = 'proveedores_caja';
const SHEET_CATS_CAJA      = 'categorias_caja';
const SHEET_CIERRES        = 'cierres_turno';

// ── Lista unificada de empleados (todos los módulos) ──────────
const SHEET_EMPLEADOS      = 'empleados';

// ── Hojas: Módulo Propinas ────────────────────────────────────
const SHEET_PROP_ROLES     = 'propinas_roles';
const SHEET_PROP_TURNOS    = 'propinas_turnos';

const SECRET_KEY = 'satori2026';

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
// doGet — todas las acciones de lectura
// ══════════════════════════════════════════════════════════════
function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  try {
    const params = e.parameter || {};
    if (params.key !== SECRET_KEY)
      return output.setContent(JSON.stringify({ ok:false, error:'Unauthorized' }));
    const action = params.action;
    let result = { ok:false, error:'Unknown action' };

    // ── Dashboard Ventas ──────────────────────────────────────
    if      (action === 'ping')         result = { ok:true, msg:'Satori backend v4.0 online' };
    else if (action === 'getDias')      result = getDias();
    else if (action === 'getComps')     result = getComps();
    else if (action === 'getMetas')     result = getMetas();
    else if (action === 'getProductos') result = getProductos();
    else if (action === 'getHist')      result = getHist();
    else if (action === 'getAnual')     result = getAnual();
    else if (action === 'saveMetas') {
      const d = params.data ? decodeURIComponent(params.data) : null;
      result = saveMetas_sheet(d);
    }
    // ── Módulo Caja ───────────────────────────────────────────
    else if (action === 'getTurnos')       result = getTurnos(params);
    else if (action === 'getMovimientos')  result = getMovimientos(params);
    else if (action === 'getProvCaja')     result = getProvCaja();
    else if (action === 'getCatsCaja')     result = getCatsCaja();
    else if (action === 'getCierresTurno') result = getCierresTurno(params);
    // ── Empleados unificados (todos los módulos) ─────────────
    else if (action === 'getEmpleados')         result = getEmpleados();
    // ── Módulo Propinas ───────────────────────────────────────
    else if (action === 'getEmpleadosPropinas') result = getEmpleados();
    else if (action === 'getRolesPropinas')     result = getRolesPropinas();
    else if (action === 'getTurnosPropinas')    result = getTurnosPropinas(params);
    else if (action === 'setupReporteMensual')  result = setupReporteMensual();

    output.setContent(JSON.stringify(result));
  } catch(err) {
    output.setContent(JSON.stringify({ ok:false, error:err.toString() }));
  }
  return output;
}

// ══════════════════════════════════════════════════════════════
// doPost — todas las acciones de escritura
// ══════════════════════════════════════════════════════════════
function doPost(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  try {
    let params = {};
    if (e.postData && e.postData.contents) params = JSON.parse(e.postData.contents);
    if (!params.action && e.parameter) Object.assign(params, e.parameter);
    if (params.key !== SECRET_KEY)
      return output.setContent(JSON.stringify({ ok:false, error:'Unauthorized' }));
    const action = params.action;
    let result = { ok:false, error:'Unknown action' };

    // ── Dashboard Ventas ──────────────────────────────────────
    if      (action === 'saveDia')        result = saveDia(params.fecha, params.data);
    else if (action === 'saveHist')       result = saveHist(params.data);
    else if (action === 'saveAnual')      result = saveAnual(params.data);
    else if (action === 'deleteDia')      result = deleteDia(params.fecha);
    else if (action === 'saveComps')      result = saveComps(params.data);
    else if (action === 'saveMetas')      result = saveMetas_sheet(params.data);
    else if (action === 'saveProductos')  result = saveProductos(params.data);
    else if (action === 'parseProductos') result = parseProductos(params.filedata, params.filename);
    // ── Módulo Caja ───────────────────────────────────────────
    else if (action === 'saveTurno')       result = saveTurno(params.data);
    else if (action === 'saveMovimiento')  result = saveMovimiento(params.data);
    else if (action === 'deleteMovimiento')result = deleteMovimiento(params.id);
    else if (action === 'updateMovEstado') result = updateMovEstado(params.id, params.estado);
    else if (action === 'saveProvCaja')    result = saveProvCaja(params.data);
    else if (action === 'deleteProvCaja')  result = deleteProvCaja(params.id);
    else if (action === 'saveCatCaja')     result = saveCatCaja(params.data);
    else if (action === 'deleteCatCaja')   result = deleteCatCaja(params.id);
    else if (action === 'saveCierreTurno') result = saveCierreTurno(params.data);
    // ── Empleados unificados (todos los módulos) ─────────────
    else if (action === 'saveEmpleado')              result = saveEmpleado(params.data);
    else if (action === 'deleteEmpleado')            result = deleteEmpleado(params.id);
    else if (action === 'syncEmpleadosDashboard')    result = syncEmpleadosDashboard(params.nombres);
    // ── Módulo Propinas ───────────────────────────────────────
    else if (action === 'saveEmpleadoPropinas')      result = saveEmpleado(params.data);
    else if (action === 'deleteEmpleadoPropinas')    result = deleteEmpleado(params.id);
    else if (action === 'saveRolPropinas')            result = saveRolPropinas(params.data);
    else if (action === 'saveTurnoPropinas')          result = saveTurnoPropinas(params.data);
    else if (action === 'deleteTurnoPropinas')        result = deleteTurnoPropinas(params.id);

    output.setContent(JSON.stringify(result));
  } catch(err) {
    console.error('doPost error:', err.toString());
    output.setContent(JSON.stringify({ ok:false, error:err.toString() }));
  }
  return output;
}

// ══════════════════════════════════════════════════════════════
// INIT — crear todas las hojas necesarias
// ══════════════════════════════════════════════════════════════
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── Dashboard Ventas ──────────────────────────────────────
  const ventasSheets = [
    SHEET_NAME_DIAS, SHEET_NAME_COMPS, SHEET_NAME_META,
    SHEET_NAME_PRODUCTOS, SHEET_NAME_HIST, SHEET_NAME_ANUAL
  ];
  ventasSheets.forEach(name => {
    if (!ss.getSheetByName(name)) {
      const sheet = ss.insertSheet(name);
      if (name === SHEET_NAME_DIAS) {
        sheet.getRange(1,1,1,3).setValues([['fecha','uploadedAt','data']]);
        sheet.setFrozenRows(1);
        sheet.getRange('A:A').setNumberFormat('@STRING@');
      } else if (name === SHEET_NAME_COMPS) {
        sheet.getRange(1,1,1,2).setValues([['id','data']]);
        sheet.setFrozenRows(1);
      } else if (name === SHEET_NAME_META) {
        sheet.getRange(1,1,1,2).setValues([['key','value']]);
        sheet.setFrozenRows(1);
      } else if (name === SHEET_NAME_PRODUCTOS) {
        sheet.getRange(1,1,1,6).setValues([['nombre','tipo','clasificacion','subclasificacion','multiplicador','updatedAt']]);
        sheet.setFrozenRows(1);
      } else if (name === SHEET_NAME_HIST) {
        sheet.getRange(1,1,1,2).setValues([['key','data']]);
        sheet.setFrozenRows(1);
      } else if (name === SHEET_NAME_ANUAL) {
        sheet.getRange(1,1,1,3).setValues([['periodo','updatedAt','data']]);
        sheet.setFrozenRows(1);
      }
    }
  });

  // ── Empleados unificados ─────────────────────────────────
  if (!ss.getSheetByName(SHEET_EMPLEADOS)) {
    const ws = ss.insertSheet(SHEET_EMPLEADOS);
    ws.getRange(1,1,1,4).setValues([['id','nombre','rol','activo']]);
    ws.setFrozenRows(1);
    // Migrar datos de propinas_empleados si existen
    const oldSheet = ss.getSheetByName('propinas_empleados');
    if (oldSheet && oldSheet.getLastRow() >= 2) {
      const oldData = oldSheet.getRange(2, 1, oldSheet.getLastRow() - 1, 4).getValues();
      const existing = new Set();
      oldData.forEach(r => {
        if (!r[0]) return;
        const norm = String(r[1]).toUpperCase().trim();
        if (existing.has(norm)) return;
        existing.add(norm);
        ws.appendRow([r[0], String(r[1]).toUpperCase().trim(), r[2] || 'sin_asignar', r[3] !== false]);
      });
    }
    // Migrar datos de empleados de Caja si existen
    const cajaSheet = ss.getSheetByName('empleados_caja');
    if (cajaSheet && cajaSheet.getLastRow() >= 2) {
      const cajaData = cajaSheet.getRange(2, 1, cajaSheet.getLastRow() - 1, 3).getValues();
      const wsRows = ws.getLastRow() >= 2
        ? ws.getRange(2, 1, ws.getLastRow() - 1, 2).getValues().map(r => String(r[1]).toUpperCase().trim())
        : [];
      const existing = new Set(wsRows);
      cajaData.forEach(r => {
        if (!r[0]) return;
        const norm = String(r[1]).toUpperCase().trim();
        if (existing.has(norm)) return;
        existing.add(norm);
        ws.appendRow([Utilities.getUuid(), norm, r[2] || 'sin_asignar', true]);
      });
    }
  }

  // ── Módulo Caja ──────────────────────────────────────────
  if (!ss.getSheetByName(SHEET_TURNOS)) {
    const s = ss.insertSheet(SHEET_TURNOS);
    s.getRange(1,1,1,12).setValues([[
      'id','fecha','turno','empleado',
      'caja_asignada_crc','caja_asignada_usd',
      'adicionales_json','pagos_json',
      'efectivo_cierre_crc','efectivo_cierre_usd',
      'notas','timestamp'
    ]]);
    s.setFrozenRows(1);
  }

  if (!ss.getSheetByName(SHEET_MOVS)) {
    const s = ss.insertSheet(SHEET_MOVS);
    s.getRange(1,1,1,16).setValues([[
      'id','fecha','turno','tipo','categoria','subcategoria',
      'proveedor_id','proveedor_nombre',
      'empleado_id','empleado_nombre',
      'monto_crc','monto_usd','metodo',
      'caja_origen','estado','referencia','notas','timestamp'
    ]]);
    s.setFrozenRows(1);
  }

  if (!ss.getSheetByName(SHEET_PROV_CAJA)) {
    const s = ss.insertSheet(SHEET_PROV_CAJA);
    s.getRange(1,1,1,9).setValues([[
      'id','nombre','categoria','moneda',
      'ciclo_pago','metodo_pago','cuenta_iban','notas','activo'
    ]]);
    s.setFrozenRows(1);
  }

  if (!ss.getSheetByName(SHEET_CATS_CAJA)) {
    const s = ss.insertSheet(SHEET_CATS_CAJA);
    s.getRange(1,1,1,4).setValues([['id','tipo','nombre','activo']]);
    s.setFrozenRows(1);
    const defaults = [
      ['Ingreso','Ventas efectivo mediodía'],
      ['Ingreso','Ventas efectivo noche'],
      ['Ingreso','SINPE delivery'],
      ['Ingreso','Bitcoin'],
      ['Ingreso','Ingreso de cambio'],
      ['Ingreso','Otros ingresos'],
      ['Egreso - Mercadería','Proveedor mercadería'],
      ['Egreso - Personal','Adelanto de salario'],
      ['Egreso - Personal','Salario pendiente'],
      ['Egreso - Personal','Propinas por tarjeta'],
      ['Egreso - Personal','Otros pagos personal'],
      ['Egreso - Operativo','Mantenimiento'],
      ['Egreso - Operativo','Servicios (agua/luz/internet)'],
      ['Egreso - Operativo','Gas'],
      ['Egreso - Operativo','Seguridad'],
      ['Egreso - Operativo','Librería y papelería'],
      ['Egreso - Operativo','Decoración'],
      ['Egreso - Operativo','Herramientas cocina'],
      ['Egreso - Operativo','Gastos médicos'],
      ['Egreso - Operativo','Otros gastos operativos'],
      ['Egreso - Socios','Retiro de socios'],
      ['Egreso - Socios','Gastos de socios'],
      ['Traspaso','Registradora → Caja Fuerte'],
      ['Traspaso','Caja Fuerte → Banco'],
      ['Traspaso','Caja Fuerte → Caja Proveedores'],
      ['Traspaso','Banco → Caja Fuerte'],
      ['Traspaso','Otro traspaso'],
    ];
    const rows = defaults.map((d,i) => [String(i+1), d[0], d[1], true]);
    s.getRange(2, 1, rows.length, 4).setValues(rows);
  }

  if (!ss.getSheetByName(SHEET_CIERRES)) {
    const s = ss.insertSheet(SHEET_CIERRES);
    s.getRange(1,1,1,4).setValues([['id','fecha','tipo','data']]);
    s.setFrozenRows(1);
  }
}

// ══════════════════════════════════════════════════════════════
// DIAS (Dashboard Ventas)
// ══════════════════════════════════════════════════════════════
function getDias() {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_DIAS);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok:true, dias:{} };
  const dias = {};
  for (let i = 1; i < rows.length; i++) {
    const [fecha, , dataStr] = rows[i];
    if (!fecha) continue;
    let fechaStr = String(fecha);
    if (fecha instanceof Date) {
      fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}`;
    } else {
      const m = fechaStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) fechaStr = `${m[1]}-${m[2]}-${m[3]}`;
    }
    try { dias[fechaStr] = JSON.parse(dataStr); } catch(e) {}
  }
  return { ok:true, dias };
}

function saveDia(fecha, dataStr) {
  if (!fecha || !dataStr) return { ok:false, error:'Missing fecha or data' };
  const m = String(fecha).match(/(\d{4})-(\d{2})-(\d{2})/);
  fecha = m ? `${m[1]}-${m[2]}-${m[3]}` : String(fecha);
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_DIAS);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    let rf = String(rows[i][0]);
    if (rows[i][0] instanceof Date) {
      const d = rows[i][0];
      rf = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    if (rf === fecha) {
      sheet.getRange(i+1, 2, 1, 2).setValues([[new Date().toISOString(), dataStr]]);
      return { ok:true, action:'updated', fecha };
    }
  }
  let insertPos = rows.length + 1;
  for (let i = 1; i < rows.length; i++) {
    let rf = String(rows[i][0]);
    if (rows[i][0] instanceof Date) {
      const d = rows[i][0];
      rf = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    if (rf && rf > fecha) { insertPos = i + 1; break; }
  }
  if (insertPos <= rows.length) sheet.insertRowBefore(insertPos);
  sheet.getRange(insertPos, 1).setNumberFormat('@STRING@');
  sheet.getRange(insertPos, 1, 1, 3).setValues([[fecha, new Date().toISOString(), dataStr]]);
  return { ok:true, action:'created', fecha };
}

function deleteDia(fecha) {
  if (!fecha) return { ok:false, error:'Missing fecha' };
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_DIAS);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(fecha)) { sheet.deleteRow(i+1); return { ok:true, action:'deleted', fecha }; }
  }
  return { ok:false, error:'Fecha not found' };
}

// ══════════════════════════════════════════════════════════════
// HISTORICO
// ══════════════════════════════════════════════════════════════
function getHist() {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_HIST);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok:true, hist:{} };
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'hist') {
      try { return { ok:true, hist: JSON.parse(rows[i][1]) }; } catch(e) {}
    }
  }
  return { ok:true, hist:{} };
}

function saveHist(dataStr) {
  if (!dataStr) return { ok:false, error:'Missing data' };
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_HIST);
  const rows  = sheet.getDataRange().getValues();
  let newData = {};
  try { newData = JSON.parse(dataStr); } catch(e) { return { ok:false, error:'Invalid JSON' }; }
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'hist') {
      let existing = {};
      try { existing = JSON.parse(rows[i][1]); } catch(e) {}
      const merged = Object.assign({}, existing, newData);
      sheet.getRange(i+1, 2).setValue(JSON.stringify(merged));
      return { ok:true, action:'updated', totalKeys:Object.keys(merged).length };
    }
  }
  sheet.appendRow(['hist', dataStr]);
  return { ok:true, action:'created', totalKeys:Object.keys(newData).length };
}

// ══════════════════════════════════════════════════════════════
// ANUAL
// ══════════════════════════════════════════════════════════════
function getAnual() {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_ANUAL);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok:true, anual:{} };
  const anual = {};
  for (let i = 1; i < rows.length; i++) {
    const periodo = String(rows[i][0]||'').trim();
    if (!periodo) continue;
    try { anual[periodo] = JSON.parse(rows[i][2]); } catch(e) {}
  }
  return { ok:true, anual };
}

function saveAnual(dataStr) {
  if (!dataStr) return { ok:false, error:'Missing data' };
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_ANUAL);
  const rows  = sheet.getDataRange().getValues();
  let newData = {};
  try { newData = JSON.parse(dataStr); } catch(e) { return { ok:false, error:'Invalid JSON' }; }
  const now = new Date().toISOString();
  const updated = [], created = [];
  const rowIndex = {};
  for (let i = 1; i < rows.length; i++) {
    const p = String(rows[i][0]||'').trim();
    if (p) rowIndex[p] = i + 1;
  }
  for (const [periodo, items] of Object.entries(newData)) {
    const itemsStr = JSON.stringify(items);
    if (rowIndex[periodo]) {
      sheet.getRange(rowIndex[periodo], 2, 1, 2).setValues([[now, itemsStr]]);
      updated.push(periodo);
    } else {
      sheet.appendRow([periodo, now, itemsStr]);
      created.push(periodo);
    }
  }
  return { ok:true, updated, created, totalPeriodos:Object.keys(newData).length };
}

// ══════════════════════════════════════════════════════════════
// COMPETENCIAS
// ══════════════════════════════════════════════════════════════
function getComps() {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_COMPS);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'all') {
      try { return { ok:true, comps: JSON.parse(rows[i][1]) }; } catch(e) {}
    }
  }
  return { ok:true, comps:[] };
}

function saveComps(dataStr) {
  if (!dataStr) return { ok:false, error:'Missing data' };
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_COMPS);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'all') { sheet.getRange(i+1, 2).setValue(dataStr); return { ok:true, action:'updated' }; }
  }
  sheet.appendRow(['all', dataStr]);
  return { ok:true, action:'created' };
}

// ══════════════════════════════════════════════════════════════
// METAS
// ══════════════════════════════════════════════════════════════
function getMetas() {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_META);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'metas') {
      try { return { ok:true, metas: JSON.parse(rows[i][1]) }; } catch(e) {}
    }
  }
  return { ok:true, metas:{} };
}

function saveMetas_sheet(dataStr) {
  if (!dataStr) return { ok:false, error:'Missing data' };
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_META);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'metas') { sheet.getRange(i+1, 2).setValue(dataStr); return { ok:true, action:'updated' }; }
  }
  sheet.appendRow(['metas', dataStr]);
  return { ok:true, action:'created' };
}

// ══════════════════════════════════════════════════════════════
// PRODUCTOS
// ══════════════════════════════════════════════════════════════
function getProductos() {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PRODUCTOS);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok:true, productos:{}, count:0 };
  const productos = {};
  for (let i = 1; i < rows.length; i++) {
    const nombre = (rows[i][0]||'').toString().trim().toUpperCase();
    const tipo   = (rows[i][1]||'').toString().trim();
    const clas   = (rows[i][2]||'').toString().trim();
    const subcl  = (rows[i][3]||'').toString().trim();
    const mult   = parseFloat(rows[i][4]) || 1;
    if (nombre && tipo) productos[nombre] = { tipo, clas, subcl, mult };
  }
  return { ok:true, productos, count:Object.keys(productos).length };
}

function saveProductos(dataStr) {
  initSheets();
  const items = JSON.parse(dataStr);
  if (!Array.isArray(items)) return { ok:false, error:'Expected array' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PRODUCTOS);
  const now   = new Date().toISOString();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 6).clearContent();
  const rows = items.filter(p => p.nombre && p.tipo).map(p =>
    [p.nombre.toUpperCase().trim(), p.tipo, (p.clas||'').trim(), (p.subcl||'').trim(), p.mult||1, now]
  );
  if (rows.length > 0) sheet.getRange(2, 1, rows.length, 6).setValues(rows);
  return { ok:true, count:rows.length };
}

function parseProductos(dataStr, filename) {
  const NON_FOOD = ['REMERAS','TSHIRTS','T-DARUMAS','T-GORRAS','T-STICKERS','GIFT CARDS','A PAX'];
  const BEV      = ['BEBIDAS'];
  const CORT     = ['X CORTESIAS'];
  const PERS     = ['PERSONAL','XX DUEÑOS'];
  try {
    const decoded  = Utilities.base64Decode(dataStr);
    const blob     = Utilities.newBlob(decoded, MimeType.MICROSOFT_EXCEL, filename||'productos.xlsx');
    const tempFile = Drive.Files.insert(
      { title:'_tmp_productos', mimeType:MimeType.GOOGLE_SHEETS }, blob, { convert:true }
    );
    const ss    = SpreadsheetApp.openById(tempFile.id);
    const sheet = ss.getSheets()[0];
    const data  = sheet.getDataRange().getValues();
    DriveApp.getFileById(tempFile.id).setTrashed(true);
    if (data.length < 2) return { ok:false, error:'Archivo vacío' };
    const header  = data[0].map(h => (h||'').toString().trim());
    const iNombre = header.indexOf('Nombre');
    const iClas   = header.indexOf('NombreClasificacion');
    const iSubcl  = header.indexOf('NombreSubClasificacion');
    if (iNombre < 0 || iClas < 0) return { ok:false, error:'Columnas no encontradas' };
    const seen = {};
    for (let r = 1; r < data.length; r++) {
      const nombre = (data[r][iNombre]||'').toString().trim().toUpperCase();
      const cat    = (data[r][iClas]  ||'').toString().trim().toUpperCase();
      const subcl  = iSubcl >= 0 ? (data[r][iSubcl]||'').toString().trim() : '';
      if (!nombre || !cat || nombre === 'NOMBRE') continue;
      if (seen[nombre]) continue;
      let tipo;
      if      (NON_FOOD.includes(cat)) tipo = 'nofood';
      else if (BEV.includes(cat))      tipo = 'bebida';
      else if (CORT.includes(cat))     tipo = 'cortesia';
      else if (PERS.includes(cat))     tipo = 'personal';
      else                              tipo = 'comida';
      seen[nombre] = { tipo, clas:cat, subcl };
    }
    const items = Object.entries(seen).map(([nombre,info]) => ({
      nombre, tipo:info.tipo, clas:info.clas, subcl:info.subcl
    }));
    saveProductos(JSON.stringify(items.map(p=>({nombre:p.nombre,tipo:p.tipo,clas:p.clas,subcl:p.subcl}))));
    const counts = {};
    items.forEach(p => { counts[p.tipo] = (counts[p.tipo]||0)+1; });
    return { ok:true, items, count:items.length, counts };
  } catch(e) {
    return { ok:false, error:e.toString() };
  }
}

// ══════════════════════════════════════════════════════════════
// MÓDULO CAJA: TURNOS
// ══════════════════════════════════════════════════════════════
function saveTurno(dataStr) {
  initSheets();
  const data = JSON.parse(dataStr);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TURNOS);
  const id  = data.id || Date.now().toString();
  const now = new Date().toISOString();

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i+1, 1, 1, 12).setValues([[
        id, data.fecha, data.turno, data.empleado,
        data.caja_asignada_crc||0, data.caja_asignada_usd||0,
        JSON.stringify(data.adicionales||[]),
        JSON.stringify(data.pagos||[]),
        data.efectivo_cierre_crc||0, data.efectivo_cierre_usd||0,
        data.notas||'', now
      ]]);
      syncPagosTurno(id, data.fecha, data.turno, data.empleado, data.pagos||[]);
      return { ok:true, action:'updated', id };
    }
  }
  sheet.appendRow([
    id, data.fecha, data.turno, data.empleado,
    data.caja_asignada_crc||0, data.caja_asignada_usd||0,
    JSON.stringify(data.adicionales||[]),
    JSON.stringify(data.pagos||[]),
    data.efectivo_cierre_crc||0, data.efectivo_cierre_usd||0,
    data.notas||'', now
  ]);
  syncPagosTurno(id, data.fecha, data.turno, data.empleado, data.pagos||[]);
  return { ok:true, action:'created', id };
}

function getTurnos(params) {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TURNOS);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok:true, turnos:[] };
  const from = params?.from || '';
  const to   = params?.to   || '';
  const turnos = [];
  for (let i = 1; i < rows.length; i++) {
    const fecha = String(rows[i][1]);
    if (from && fecha < from) continue;
    if (to   && fecha > to)   continue;
    turnos.push({
      id: String(rows[i][0]), fecha,
      turno:               rows[i][2],
      empleado:            rows[i][3],
      caja_asignada_crc:   rows[i][4],
      caja_asignada_usd:   rows[i][5],
      adicionales:         tryParse(rows[i][6], []),
      pagos:               tryParse(rows[i][7], []),
      efectivo_cierre_crc: rows[i][8],
      efectivo_cierre_usd: rows[i][9],
      notas:               rows[i][10],
      timestamp:           rows[i][11],
    });
  }
  return { ok:true, turnos };
}

function syncPagosTurno(turnoId, fecha, turno, empleado, pagos) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MOVS);
  const rows  = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]).startsWith(turnoId + '_') && rows[i][4] === 'Egreso - Mercadería') {
      sheet.deleteRow(i + 1);
    }
  }
  const now = new Date().toISOString();
  pagos.forEach(p => {
    sheet.appendRow([
      turnoId + '_' + (p.id||Date.now()),
      fecha, turno, 'Egreso', 'Egreso - Mercadería', 'Proveedor mercadería',
      p.proveedor_id||'', p.proveedor_nombre||'',
      '', empleado,
      p.monto_crc||0, p.monto_usd||0, p.metodo||'Efectivo',
      'Caja Proveedores', 'Pagado',
      p.referencia||'', p.notas||'', now
    ]);
  });
}

// ══════════════════════════════════════════════════════════════
// MÓDULO CAJA: MOVIMIENTOS GENERALES
// ══════════════════════════════════════════════════════════════
function saveMovimiento(dataStr) {
  initSheets();
  const data = JSON.parse(dataStr);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MOVS);
  const id  = data.id || Date.now().toString();
  const now = new Date().toISOString();

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i+1, 1, 1, 18).setValues([[
        id, data.fecha, data.turno||'', data.tipo, data.categoria, data.subcategoria||'',
        data.proveedor_id||'', data.proveedor_nombre||'',
        data.empleado_id||'', data.empleado_nombre||'',
        data.monto_crc||0, data.monto_usd||0, data.metodo||'',
        data.caja_origen||'', data.estado||'Pagado',
        data.referencia||'', data.notas||'', now
      ]]);
      return { ok:true, action:'updated', id };
    }
  }
  sheet.appendRow([
    id, data.fecha, data.turno||'', data.tipo, data.categoria, data.subcategoria||'',
    data.proveedor_id||'', data.proveedor_nombre||'',
    data.empleado_id||'', data.empleado_nombre||'',
    data.monto_crc||0, data.monto_usd||0, data.metodo||'',
    data.caja_origen||'', data.estado||'Pagado',
    data.referencia||'', data.notas||'', now
  ]);
  return { ok:true, action:'created', id };
}

function updateMovEstado(id, estado) {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MOVS);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i+1, 15).setValue(estado);
      return { ok:true };
    }
  }
  return { ok:false, error:'Not found' };
}

function deleteMovimiento(id) {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MOVS);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { ok:true };
    }
  }
  return { ok:false, error:'Not found' };
}

function getMovimientos(params) {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MOVS);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok:true, movimientos:[] };
  const from = params?.from || '';
  const to   = params?.to   || '';
  const prov = params?.prov || '';
  const movs = [];
  for (let i = 1; i < rows.length; i++) {
    const fecha = String(rows[i][1]);
    if (from && fecha < from) continue;
    if (to   && fecha > to)   continue;
    if (prov && String(rows[i][6]) !== prov && String(rows[i][7]) !== prov) continue;
    movs.push({
      id: String(rows[i][0]), fecha,
      turno:             rows[i][2],
      tipo:              rows[i][3],
      categoria:         rows[i][4],
      subcategoria:      rows[i][5],
      proveedor_id:      rows[i][6],
      proveedor_nombre:  rows[i][7],
      empleado_id:       rows[i][8],
      empleado_nombre:   rows[i][9],
      monto_crc:         rows[i][10],
      monto_usd:         rows[i][11],
      metodo:            rows[i][12],
      caja_origen:       rows[i][13],
      estado:            rows[i][14],
      referencia:        rows[i][15],
      notas:             rows[i][16],
      timestamp:         rows[i][17],
    });
  }
  return { ok:true, movimientos:movs };
}

// ══════════════════════════════════════════════════════════════
// MÓDULO CAJA: PROVEEDORES
// ══════════════════════════════════════════════════════════════
function saveProvCaja(dataStr) {
  initSheets();
  const data  = JSON.parse(dataStr);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROV_CAJA);
  const id    = data.id || Date.now().toString();

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i+1, 1, 1, 9).setValues([[
        id, data.nombre, data.categoria, data.moneda||'CRC',
        data.ciclo_pago||'Semanal', data.metodo_pago||'Efectivo',
        data.cuenta_iban||'', data.notas||'', data.activo!==false
      ]]);
      return { ok:true, action:'updated', id };
    }
  }
  sheet.appendRow([
    id, data.nombre, data.categoria, data.moneda||'CRC',
    data.ciclo_pago||'Semanal', data.metodo_pago||'Efectivo',
    data.cuenta_iban||'', data.notas||'', true
  ]);
  return { ok:true, action:'created', id };
}

function deleteProvCaja(id) {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROV_CAJA);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i+1, 9).setValue(false);
      return { ok:true };
    }
  }
  return { ok:false, error:'Not found' };
}

function getProvCaja() {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROV_CAJA);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok:true, proveedores:[] };
  return {
    ok: true,
    proveedores: rows.slice(1).map(r => ({
      id:r[0], nombre:r[1], categoria:r[2], moneda:r[3],
      ciclo_pago:r[4], metodo_pago:r[5], cuenta_iban:r[6],
      notas:r[7], activo:r[8]
    }))
  };
}

// ══════════════════════════════════════════════════════════════
// MÓDULO CAJA: CATEGORÍAS
// ══════════════════════════════════════════════════════════════
function getCatsCaja() {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CATS_CAJA);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok:true, categorias:[] };
  return {
    ok: true,
    categorias: rows.slice(1)
      .filter(r => r[3] !== false)
      .map(r => ({ id:String(r[0]), tipo:r[1], nombre:r[2], activo:r[3] }))
  };
}

function saveCatCaja(dataStr) {
  initSheets();
  const data  = JSON.parse(dataStr);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CATS_CAJA);
  const id    = data.id || Date.now().toString();

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i+1, 1, 1, 4).setValues([[id, data.tipo, data.nombre, data.activo!==false]]);
      return { ok:true, action:'updated', id };
    }
  }
  sheet.appendRow([id, data.tipo, data.nombre, true]);
  return { ok:true, action:'created', id };
}

function deleteCatCaja(id) {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CATS_CAJA);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i+1, 4).setValue(false);
      return { ok:true };
    }
  }
  return { ok:false, error:'Not found' };
}

// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// CIERRES DE TURNO (Módulo Caja)
// ══════════════════════════════════════════════════════════════
function getCierresTurno(params) {
  initSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CIERRES);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok:true, cierres:[] };
  const from = params?.from || '';
  const to   = params?.to   || '';
  const cierres = [];
  for (let i = 1; i < rows.length; i++) {
    const fecha = String(rows[i][1]);
    if (from && fecha < from) continue;
    if (to   && fecha > to)   continue;
    const data = tryParse(rows[i][3], {});
    cierres.push({ id: String(rows[i][0]), fecha, tipo: rows[i][2], ...data });
  }
  return { ok:true, cierres };
}

function saveCierreTurno(dataStr) {
  initSheets();
  const data  = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CIERRES);
  const id    = data.id || ('ct_' + Date.now());
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i+1, 1, 1, 4).setValues([[id, data.fecha, data.tipo, JSON.stringify(data)]]);
      return { ok:true, action:'updated', id };
    }
  }
  sheet.appendRow([id, data.fecha, data.tipo, JSON.stringify(data)]);
  return { ok:true, action:'inserted', id };
}

// ══════════════════════════════════════════════════════════════
// EMPLEADOS — lista unificada (Dashboard · Caja · Propinas)
// ══════════════════════════════════════════════════════════════
function _getEmpSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName(SHEET_EMPLEADOS);
  if (!ws) {
    ws = ss.insertSheet(SHEET_EMPLEADOS);
    ws.getRange(1,1,1,4).setValues([['id','nombre','rol','activo']]);
    ws.setFrozenRows(1);
  }
  return ws;
}

function getEmpleados() {
  const ws = _getEmpSheet();
  if (ws.getLastRow() < 2) return { ok: true, data: [], empleados: [] };
  const rows = ws.getRange(2, 1, ws.getLastRow() - 1, 4).getValues();
  const data = rows.filter(r => r[0]).map(r => ({
    id: String(r[0]), nombre: String(r[1]),
    rol: r[2] || 'sin_asignar',
    activo: r[3] !== false && r[3] !== 'FALSE'
  }));
  return { ok: true, data, empleados: data };
}

function saveEmpleado(data) {
  const ws = _getEmpSheet();
  const d = typeof data === 'string' ? JSON.parse(data) : data;
  const nombre = String(d.nombre || '').toUpperCase().trim();
  const activo = d.activo !== false && d.activo !== 'false';
  if (d.id) {
    const lastRow = ws.getLastRow();
    if (lastRow >= 2) {
      const ids = ws.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(d.id)) {
          ws.getRange(i + 2, 1, 1, 4).setValues([[d.id, nombre, d.rol || 'sin_asignar', activo]]);
          return { ok: true };
        }
      }
    }
  }
  const newId = d.id || Utilities.getUuid();
  ws.appendRow([newId, nombre, d.rol || 'sin_asignar', activo]);
  return { ok: true, id: newId };
}

function deleteEmpleado(id) {
  const ws = _getEmpSheet();
  if (ws.getLastRow() < 2) return { ok: false, error: 'Not found' };
  const ids = ws.getRange(2, 1, ws.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      ws.deleteRow(i + 2);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Not found' };
}

function syncEmpleadosDashboard(nombres) {
  if (!nombres || !Array.isArray(nombres)) return { ok: false, error: 'nombres must be array' };
  const ws = _getEmpSheet();
  const existing = new Set();
  if (ws.getLastRow() >= 2) {
    const rows = ws.getRange(2, 1, ws.getLastRow() - 1, 2).getValues();
    rows.forEach(r => { if (r[1]) existing.add(String(r[1]).toUpperCase().trim()); });
  }
  const added = [];
  nombres.forEach(nombre => {
    const norm = String(nombre).toUpperCase().trim();
    if (!norm || existing.has(norm)) return;
    ws.appendRow([Utilities.getUuid(), norm, 'sin_asignar', true]);
    existing.add(norm);
    added.push(norm);
  });
  return { ok: true, added };
}

// ══════════════════════════════════════════════════════════════
// MÓDULO PROPINAS: ROLES
// ══════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════
// MÓDULO PROPINAS: TURNOS
// ══════════════════════════════════════════════════════════════
function getTurnosPropinas(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName(SHEET_PROP_TURNOS);
  if (!ws) {
    ws = ss.insertSheet(SHEET_PROP_TURNOS);
    ws.appendRow(['id', 'fecha', 'dia_semana', 'num_semana', 'datos_json', 'created_at']);
    return { ok: true, data: [] };
  }
  if (ws.getLastRow() < 2) return { ok: true, data: [] };
  const tz = Session.getScriptTimeZone();
  const rows = ws.getRange(2, 1, ws.getLastRow() - 1, 6).getValues();
  let data = rows.filter(r => r[0]).map(r => {
    // Sheets auto-convierte fechas a Date objects — normalizar a YYYY-MM-DD
    const fechaStr = r[1] instanceof Date
      ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd')
      : String(r[1]);
    let datos = {};
    try { datos = JSON.parse(r[4] || '{}'); } catch(e) {}
    return { id: String(r[0]), fecha: fechaStr, dia_semana: r[2], num_semana: r[3], datos, created_at: r[5] };
  });
  if (params.mes && params.anio) {
    const prefix = `${params.anio}-${String(params.mes).padStart(2, '0')}`;
    data = data.filter(r => r.fecha.startsWith(prefix));
  }
  data.sort((a, b) => b.fecha.localeCompare(a.fecha));
  return { ok: true, data };
}

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

// ══════════════════════════════════════════════════════════════
// REPORTE MENSUAL DE PROPINAS
// ══════════════════════════════════════════════════════════════

/**
 * Configurar trigger mensual (ejecutar una sola vez desde el editor de Apps Script,
 * o llamar vía GET: ?action=setupReporteMensual&secret=satori2026)
 */
function setupReporteMensual() {
  // Eliminar triggers duplicados
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'reporteMensualPropinas') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('reporteMensualPropinas')
    .timeBased().onMonthDay(1).atHour(8).inTimezone('America/Costa_Rica').create();
  return { ok: true, msg: 'Trigger mensual creado. Se ejecutará el 1° de cada mes a las 8am (CR).' };
}

/**
 * Genera y envía el reporte mensual de propinas por email.
 * Se ejecuta automáticamente el 1° de cada mes via trigger.
 */
function reporteMensualPropinas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(SHEET_PROP_TURNOS);
  if (!ws || ws.getLastRow() < 2) return;

  // Mes anterior (el reporte se genera el 1° → reporta el mes que terminó)
  const hoy     = new Date();
  const mesPrev = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const prefix  = Utilities.formatDate(mesPrev, 'America/Costa_Rica', 'yyyy-MM');
  const MESES_N = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Setiembre','Octubre','Noviembre','Diciembre'];
  const mesNombre = MESES_N[mesPrev.getMonth()];
  const anio      = mesPrev.getFullYear();

  // Leer y filtrar turnos del mes anterior
  const rows   = ws.getRange(2, 1, ws.getLastRow() - 1, 6).getValues();
  const turnos = rows
    .filter(r => String(r[1]).startsWith(prefix))
    .map(r => ({ fecha: String(r[1]), datos: tryParse(r[4], {}) }));

  if (!turnos.length) return; // Sin datos, no enviar email vacío

  // Calcular métricas
  let poolTotal = 0, poolBarra = 0;
  let amCount = 0, pmCount = 0, amPool = 0, pmPool = 0;
  const empMap = {};

  turnos.forEach(t => {
    const pool  = t.datos.pool_total || 0;
    const barra = t.datos.pool_barra || 0;
    poolTotal += pool;
    poolBarra += barra;
    const isAM = (t.datos.turno || 'PM') === 'AM';
    if (isAM) { amCount++; amPool += pool; }
    else       { pmCount++; pmPool += pool; }
    (t.datos.lineas || []).forEach(l => {
      if (!l.nombre) return;
      if (!empMap[l.nombre]) empMap[l.nombre] = { take: 0, dias: 0, rol: l.rol || '' };
      empMap[l.nombre].take += l.take_home || 0;
      empMap[l.nombre].dias++;
    });
  });

  const avgPool = turnos.length > 0 ? poolTotal / turnos.length : 0;
  const avgAM   = amCount > 0 ? amPool / amCount : 0;
  const avgPM   = pmCount > 0 ? pmPool / pmCount : 0;
  const top5    = Object.entries(empMap)
    .map(([n, d]) => ({ nombre: n, ...d }))
    .sort((a, b) => b.take - a.take)
    .slice(0, 5);

  const fmt = v => '₡ ' + Math.round(v).toLocaleString('es-CR');
  const row = (label, val, bold) =>
    `<tr><td style="padding:6px 0;color:#666;font-size:13px">${label}</td>
         <td style="padding:6px 0;font-size:13px${bold?';font-weight:bold;color:#c8a96e':''}">${val}</td></tr>`;

  const htmlBody = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2 style="color:#2a4a6b;border-bottom:2px solid #e8e3db;padding-bottom:8px">
    📊 Propinas ${mesNombre} ${anio}
  </h2>
  <h3 style="color:#555;font-size:14px;margin-top:20px">Resumen del mes</h3>
  <table style="width:100%;border-collapse:collapse">
    ${row('Turnos registrados', `${turnos.length} (${amCount} AM · ${pmCount} PM)`)}
    ${row('Pool total generado', fmt(poolTotal), true)}
    ${poolBarra > 0 ? row('Pool barra', fmt(poolBarra)) : ''}
    ${row('Promedio por turno', fmt(avgPool))}
    ${amCount > 0 ? row('Promedio turno AM', fmt(avgAM)) : ''}
    ${pmCount > 0 ? row('Promedio turno PM', fmt(avgPM)) : ''}
  </table>
  <h3 style="color:#555;font-size:14px;margin-top:24px">Top 5 empleados</h3>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <tr style="background:#f5f0e8">
      <th style="padding:8px;text-align:left;color:#666">#</th>
      <th style="padding:8px;text-align:left;color:#666">Empleado</th>
      <th style="padding:8px;text-align:left;color:#666">Rol</th>
      <th style="padding:8px;text-align:center;color:#666">Días</th>
      <th style="padding:8px;text-align:right;color:#666">Take Home</th>
    </tr>
    ${top5.map((e, i) =>
      `<tr style="border-bottom:1px solid #eee">
        <td style="padding:8px;color:#999">${i+1}</td>
        <td style="padding:8px;font-weight:bold">${e.nombre}</td>
        <td style="padding:8px;color:#666">${e.rol}</td>
        <td style="padding:8px;text-align:center;color:#666">${e.dias}</td>
        <td style="padding:8px;text-align:right;color:#c8a96e;font-weight:bold">${fmt(e.take)}</td>
      </tr>`).join('')}
  </table>
  <p style="font-size:11px;color:#aaa;margin-top:24px;border-top:1px solid #eee;padding-top:8px">
    Generado automáticamente por Satori Backend · ${mesNombre} ${anio}
  </p>
</div>`;

  const recipient = Session.getActiveUser().getEmail();
  if (!recipient) return;

  GmailApp.sendEmail(
    recipient,
    `📊 Propinas ${mesNombre} ${anio} — Resumen mensual`,
    `Propinas ${mesNombre} ${anio}. Pool total: ${fmt(poolTotal)}. Turnos: ${turnos.length}. Promedio/turno: ${fmt(avgPool)}.`,
    { htmlBody }
  );
}

// ══════════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════════
function tryParse(str, def) {
  try { return typeof str === 'string' ? JSON.parse(str) : (str || def); }
  catch(e) { return def; }
}
