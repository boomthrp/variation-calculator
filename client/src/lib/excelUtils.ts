/**
 * Design Philosophy: Technical Command Center
 * - Excel import/export utilities
 * - Type-safe XLSX operations
 */

import * as XLSX from "xlsx";
import type { Configuration, ImportedData } from "./types";

/**
 * Read Excel file and convert to 2D array
 */
export async function readExcelFile(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to 2D array
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        }) as any[][];

        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
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

        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsBinaryString(file);
  });
}

/**
 * Get sheet names from Excel file
 */
export async function getExcelSheetNames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        resolve(workbook.SheetNames);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
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

/**
 * Parse configuration from Excel data
 */
export function parseConfiguration(data: any[][]): Configuration {
  const features = [];

  // Read configuration starting from row 2 (index 1)
  for (let i = 1; i < data.length; i++) {
    const name = String(data[i]?.[0] || "").trim();
    if (!name) break;

    const useForMap = data[i]?.[1] === 1 || data[i]?.[1] === "1";
    const useForVariant = data[i]?.[2] === 1 || data[i]?.[2] === "1";

    features.push({ name, useForMap, useForVariant });
  }

  const featureColumn = String(data[1]?.[3] || "M").trim();
  const startRow = parseInt(String(data[1]?.[4] || "19"));
  const dataStartColumn = String(data[1]?.[5] || "V").trim();

  return {
    features,
    featureColumn,
    startRow,
    dataStartColumn,
  };
}

/**
 * Create default configuration
 */
export function createDefaultConfiguration(): Configuration {
  return {
    features: [
      { name: "STEERING GEAR BOX", useForMap: false, useForVariant: true },
      { name: "TIRE SIZE", useForMap: true, useForVariant: true },
      { name: "DRIVE TYPE", useForMap: true, useForVariant: true },
      { name: "TRANSMISSION", useForMap: true, useForVariant: true },
      { name: "HIGH ROAD CLEARANCE", useForMap: false, useForVariant: true },
      { name: "ENGINE MODEL", useForMap: false, useForVariant: true },
    ],
    featureColumn: "M",
    startRow: 19,
    dataStartColumn: "V",
  };
}

/**
 * Validate configuration
 */
export function validateConfiguration(config: Configuration): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.features || config.features.length === 0) {
    errors.push("No features defined");
  }

  if (!config.featureColumn || !/^[A-Z]+$/.test(config.featureColumn)) {
    errors.push("Invalid feature column");
  }

  if (!config.startRow || config.startRow < 1) {
    errors.push("Invalid start row");
  }

  if (!config.dataStartColumn || !/^[A-Z]+$/.test(config.dataStartColumn)) {
    errors.push("Invalid data start column");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
