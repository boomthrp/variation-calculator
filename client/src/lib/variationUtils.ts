/**
 * Design Philosophy: Formal Minimal
 * - Pattern-based variation grouping
 * - Support N-way variation grouping
 */

import type { Feature } from "./types";

/**
 * Convert column letter to index (A=0, B=1, ..., Z=25, AA=26, etc.)
 */
export function columnLetterToIndex(letter: string): number {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Convert index to column letter (0=A, 1=B, ..., 25=Z, 26=AA, etc.)
 */
export function indexToColumnLetter(index: number): string {
  let letter = "";
  index++;
  while (index > 0) {
    index--;
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26);
  }
  return letter;
}

/**
 * Extract features and items from Excel data
 */
export function extractFeatures(
  rawData: any[][],
  config: {
    featureColumn: string;
    startRow: number;
    startDataColumn: string;
    selectedFeatures: string[];
  }
): Feature[] {
  const featureColIndex = columnLetterToIndex(config.featureColumn);
  const startRowIndex = config.startRow - 1;

  const features: Feature[] = [];
  const featureMap: { [name: string]: Set<string> } = {};

  // Extract features and items from data
  for (let i = startRowIndex; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[featureColIndex]) break;

    const featureName = String(row[featureColIndex]).trim();
    if (!featureName) break;

    if (!featureMap[featureName]) {
      featureMap[featureName] = new Set();
    }
  }

  // Convert to Feature array
  Object.entries(featureMap).forEach(([featureName, items]) => {
    features.push({
      name: featureName,
      items: Array.from(items).map((itemName) => ({
        name: itemName,
        isSelected: false,
      })),
      isSelected: false,
    });
  });

  return features;
}

/**
 * Extract items for a specific feature from Excel data
 */
export function extractItemsForFeature(
  rawData: any[][],
  config: {
    featureColumn: string;
    itemColumn: string;
    startRow: number;
  },
  featureName: string
): string[] {
  const featureColIndex = columnLetterToIndex(config.featureColumn);
  const itemColIndex = columnLetterToIndex(config.itemColumn);
  const startRowIndex = config.startRow - 1;

  const items = new Set<string>();

  for (let i = startRowIndex; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row) break;

    const currentFeature = String(row[featureColIndex] || "").trim();
    if (!currentFeature) break;

    if (currentFeature === featureName) {
      const itemName = String(row[itemColIndex] || "").trim();
      if (itemName) {
        items.add(itemName);
      }
    }
  }

  return Array.from(items);
}

/**
 * Generate pattern string for a column based on selected features
 * Pattern: "O|O|-" means first feature has O, second has O, third has -
 */
export function generatePattern(
  rawData: any[][],
  columnIndex: number,
  config: {
    featureColumn: string;
    itemColumn: string;
    startRow: number;
  },
  selectedFeatures: { [featureName: string]: string[] }
): string {
  const featureColIndex = columnLetterToIndex(config.featureColumn);
  const itemColIndex = columnLetterToIndex(config.itemColumn);
  const startRowIndex = config.startRow - 1;

  const patternParts: string[] = [];
  const selectedFeatureNames = Object.keys(selectedFeatures);

  // For each selected feature in order
  for (const featureName of selectedFeatureNames) {
    const selectedItems = selectedFeatures[featureName];

    // Find rows for this feature
    let hasMatch = false;
    for (let i = startRowIndex; i < rawData.length; i++) {
      const currentFeature = String(rawData[i]?.[featureColIndex] || "").trim();
      if (!currentFeature) break;

      if (currentFeature === featureName) {
        const itemName = String(rawData[i]?.[itemColIndex] || "").trim();
        if (selectedItems.includes(itemName)) {
          const cellValue = String(rawData[i]?.[columnIndex] || "").trim();
          if (cellValue === "O" || cellValue === "o") {
            hasMatch = true;
            break;
          }
        }
      }
    }

    patternParts.push(hasMatch ? "O" : "-");
  }

  return patternParts.join("|");
}

/**
 * Find all data columns (from startDataColumn to last column with data)
 */
export function findDataColumnRange(
  rawData: any[][],
  startDataColumn: string
): { start: number; end: number } {
  const startIndex = columnLetterToIndex(startDataColumn);
  let endIndex = startIndex;

  // Find last column with data
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (row) {
      for (let j = row.length - 1; j >= startIndex; j--) {
        if (row[j] && String(row[j]).trim()) {
          endIndex = Math.max(endIndex, j);
        }
      }
    }
  }

  return { start: startIndex, end: endIndex };
}

/**
 * Analyze variations and return result data
 */
export interface AnalysisResult {
  headerRows: any[][];
  featureRows: Array<{
    feature: string;
    item: string;
    values: string[];
  }>;
  columnPatterns: Array<{
    columnLetter: string;
    gradeName: string;
    pattern: string;
    variationGroupId: string | null;
  }>;
  variationGroups: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export function analyzeVariations(
  rawData: any[][],
  config: {
    featureColumn: string;
    itemColumn: string;
    startRow: number;
    startDataColumn: string;
  },
  variationGroups: Array<{
    id: string;
    name: string;
    selectedFeatures: { [featureName: string]: string[] };
  }>
): AnalysisResult {
  const featureColIndex = columnLetterToIndex(config.featureColumn);
  const itemColIndex = columnLetterToIndex(config.itemColumn);
  const startRowIndex = config.startRow - 1;

  const { start: startDataColIndex, end: endDataColIndex } = findDataColumnRange(
    rawData,
    config.startDataColumn
  );

  // Extract header rows (before feature data starts)
  const headerRows: any[][] = [];
  for (let i = 0; i < startRowIndex; i++) {
    if (rawData[i]) {
      headerRows.push(
        rawData[i].slice(startDataColIndex, endDataColIndex + 1)
      );
    }
  }

  // Extract feature rows
  const featureRows: Array<{
    feature: string;
    item: string;
    values: string[];
  }> = [];

  for (let i = startRowIndex; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row) break;

    const featureName = String(row[featureColIndex] || "").trim();
    if (!featureName) break;

    const itemName = String(row[itemColIndex] || "").trim();
    if (!itemName) continue;

    const values = [];
    for (let j = startDataColIndex; j <= endDataColIndex; j++) {
      values.push(String(row[j] || "").trim());
    }

    featureRows.push({
      feature: featureName,
      item: itemName,
      values,
    });
  }

  // Generate column patterns and assign to variation groups
  const colors = [
    "#FFD700", // Yellow
    "#9370DB", // Purple
    "#87CEEB", // Sky Blue
    "#90EE90", // Light Green
    "#FFB6C1", // Light Pink
    "#DEB887", // Burlywood
    "#F0E68C", // Khaki
    "#B0E0E6", // Powder Blue
  ];

  const columnPatterns: Array<{
    columnLetter: string;
    gradeName: string;
    pattern: string;
    variationGroupId: string | null;
  }> = [];

  for (let colIndex = startDataColIndex; colIndex <= endDataColIndex; colIndex++) {
    const columnLetter = indexToColumnLetter(colIndex);
    const gradeName = String(rawData[startRowIndex - 1]?.[colIndex] || "").trim();

    // Generate patterns for each variation group
    let matchedGroupId: string | null = null;
    let matchedPattern = "";

    for (const group of variationGroups) {
      const pattern = generatePattern(
        rawData,
        colIndex,
        config,
        group.selectedFeatures
      );

      if (matchedGroupId === null) {
        matchedGroupId = group.id;
        matchedPattern = pattern;
      } else if (pattern === matchedPattern) {
        // Pattern matches, keep this group
        break;
      }
    }

    columnPatterns.push({
      columnLetter,
      gradeName,
      pattern: matchedPattern,
      variationGroupId: matchedGroupId,
    });
  }

  // Create variation groups with colors
  const variationGroupsWithColor = variationGroups.map((group, index) => ({
    id: group.id,
    name: group.name,
    color: colors[index % colors.length],
  }));

  return {
    headerRows,
    featureRows,
    columnPatterns,
    variationGroups: variationGroupsWithColor,
  };
}
