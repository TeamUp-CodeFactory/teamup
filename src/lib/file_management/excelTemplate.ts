import * as XLSX from 'xlsx';

/**
 * Generates an Excel template as a Blob object with predefined headers for student data.
 *
 * The generated Excel file contains a single sheet named "Estudiantes" with the following columns:
 * ID, Nombre completo, Correo electrónico, Materias, Grupos.
 *
 * @returns {Blob} A Blob representing the Excel (.xlsx) file with the specified headers.
 */
export function generateExcelTemplate(): Blob {
  const headers = ['ID', 'Nombre completo', 'Correo electrónico', 'Materias', 'Grupos'];
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return data;
}