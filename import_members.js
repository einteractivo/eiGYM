const XLSX = require('xlsx');

function excelDateToJSDate(serial) {
  if (!serial || typeof serial !== 'number') return 'NULL';
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date = new Date(utc_value * 1000);
  return "'" + date.toISOString().split('T')[0] + "'";
}

function processName(name) {
  name = (name || '').trim();
  if (!name) return { firstName: 'Sin Nombre', lastName: '' };
  const parts = name.split(' ');
  if (parts.length === 1) return { firstName: parts[0].replace(/'/g, "''"), lastName: '' };
  return { firstName: parts[0].replace(/'/g, "''"), lastName: parts.slice(1).join(' ').replace(/'/g, "''") };
}

function esc(s) { return (s || '').replace(/'/g, "''"); }

console.log('INSERT INTO member (gymId, firstName, lastName, dni, phone, birthday, status, registrationDate) VALUES');

const values = [];

// File 1
const wb1 = XLSX.readFile('sociosexel/SOCIOS 2026 ACTUAL.xlsx');
const ws1 = wb1.Sheets[wb1.SheetNames[0]];
const data1 = XLSX.utils.sheet_to_json(ws1, { defval: '' });
data1.forEach(row => {
  const name = String(row['NOMBRE'] || '').trim();
  const { firstName, lastName } = processName(name);
  values.push("(6,'" + esc(firstName) + "','" + esc(lastName) + "','" + esc(String(row['DNI'])) + "','" + esc(String(row['CELULAR'])) + "'," + excelDateToJSDate(row['FECHA DE NACIMIENTO ']) + ",'ACTIVE',NOW())");
});

// File 2
const wb2 = XLSX.readFile('sociosexel/SOCIOS2.xlsx');
const ws2 = wb2.Sheets[wb2.SheetNames[0]];
const data2 = XLSX.utils.sheet_to_json(ws2, { defval: '' });
data2.forEach(row => {
  const name = esc(String(row['NOMBRE'] || '').trim());
  const lastName = esc(String(row['APELLIDOS'] || '').trim());
  values.push("(6,'" + name + "','" + lastName + "','" + esc(String(row['DNI'])) + "','" + esc(String(row['CELULAR'])) + "'," + excelDateToJSDate(row['FECHA DE NACIMIENTO ']) + ",'ACTIVE',NOW())");
});

console.log(values.join(',\n') + ';');
