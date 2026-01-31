/**
 * Design Philosophy: Technical Command Center
 * - Precise type definitions for data integrity
 * - Monospace-friendly naming conventions
 */

export interface Feature {
  name: string;
  useForMap: boolean;
  useForVariant: boolean;
}

export interface Configuration {
  features: Feature[];
  featureColumn: string;
  startRow: number;
  dataStartColumn: string;
}

export interface CellData {
  value: string | number;
  color?: string;
}

export interface ColumnData {
  [rowIndex: number]: CellData;
}

export interface SheetData {
  [columnKey: string]: ColumnData;
}

export interface MapLabel {
  id: string; // A, B, C, ...
  pattern: string;
  color: string;
  columns: string[]; // Column keys that have this MAP
}

export interface VariantLabel {
  id: number; // 0, 1, 2, ...
  pattern: string;
  color: string;
  columns: string[]; // Column keys that have this VARIANT
}

export interface VariationAnalysis {
  maps: MapLabel[];
  variants: VariantLabel[];
  columnMappings: {
    [columnKey: string]: {
      mapId: string;
      variantId: number;
    };
  };
}

export interface VariantSummaryRow {
  variantId: number;
  mapId: string;
  features: { [featureName: string]: string };
}

export interface ImportedData {
  configuration: Configuration;
  rawData: any[][]; // Raw Excel data
  headers: string[];
}

export interface ProjectState {
  configuration: Configuration | null;
  importedData: ImportedData | null;
  variationAnalysis: VariationAnalysis | null;
  variantSummary: VariantSummaryRow[] | null;
}
