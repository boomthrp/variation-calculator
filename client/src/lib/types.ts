/**
 * Design Philosophy: Formal Minimal
 * - Clean, simple data structures
 * - Flexible variation grouping
 */

export interface Feature {
  name: string;
  items: FeatureItem[];
  isSelected: boolean;
}

export interface FeatureItem {
  name: string;
  isSelected: boolean;
}

export interface Configuration {
  featureColumn: string; // e.g., "M"
  startRow: number; // e.g., 19
  startDataColumn: string; // e.g., "V"
  selectedFeatures: string[]; // Feature names to include
}

export interface ImportedData {
  rawData: any[][];
  headers: any[];
  features: Feature[];
  sheetName: string;
}

export interface VariationPattern {
  id: string; // Unique pattern identifier
  pattern: string; // e.g., "O|-|O|O"
  columns: string[]; // Column letters where this pattern appears
  itemNames: string[]; // Item names that apply this pattern
}

export interface VariationGroup {
  id: number;
  name: string;
  patterns: VariationPattern[];
  color?: string;
}

export interface VariationAnalysis {
  groups: VariationGroup[];
  columnMappings: {
    [colKey: string]: {
      groupIds: number[];
      patterns: string[];
    };
  };
}

export interface ProjectState {
  configuration: Configuration | null;
  importedData: ImportedData | null;
  variationAnalysis: VariationAnalysis | null;
  selectedSheet: string | null;
}

export interface VariantSummaryRow {
  variantId: number;
  features: { [key: string]: string };
  mapId: string;
}
