/**
 * Design Philosophy: Formal Minimal
 * - Excel import/export utilities
 * - Type-safe XLSX operations
 */

import * as XLSX from "xlsx";

/**
 * Read Excel file and return sheet names
 */
export async function getExcelSheetNames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.includes('spreadsheet') && !file.type.includes('sheet') && !file.name.match(/\.(xlsx?|xlsm)$/i)) {
      reject(new Error('Invalid file type. Please upload an Excel file.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }
        const workbook = XLSX.read(data, { type: "binary" });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('No sheets found in workbook'));
          return;
        }
        resolve(workbook.SheetNames);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onabort = () => reject(new Error('File reading aborted'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Read specific sheet from Excel file
 */
export async function readExcelSheet(
  file: File,
  sheetName: string
): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }

        const workbook = XLSX.read(data, { type: "binary" });

        if (!workbook.SheetNames.includes(sheetName)) {
          reject(new Error(`Sheet "${sheetName}" not found`));
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        }) as any[][];

        if (!jsonData || jsonData.length === 0) {
          reject(new Error('Sheet is empty'));
          return;
        }

        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Failed to read sheet: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onabort = () => reject(new Error('File reading aborted'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Read Excel file and return all data
 */
export async function readExcelFile(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }

        const workbook = XLSX.read(data, { type: "binary" });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('No sheets found in workbook'));
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        }) as any[][];

        if (!jsonData || jsonData.length === 0) {
          reject(new Error('Sheet is empty'));
          return;
        }

        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onabort = () => reject(new Error('File reading aborted'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Export data to Excel file
 */
export function exportToExcel(
  data: any[][],
  filename: string,
  sheetName: string = "Sheet1"
): void {
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

/**
 * Export multiple sheets to Excel file
 */
export function exportMultipleSheetsToExcel(
  sheets: { name: string; data: any[][] }[],
  filename: string
): void {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  XLSX.writeFile(workbook, filename);
}
