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
  const itemColIndex = columnLetterToIndex(config.featureColumn) + 1; // Assume item column is next to feature
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

    const itemName = String(row[itemColIndex] || "").trim();
    if (itemName) {
      featureMap[featureName].add(itemName);
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
    variationGroupId: string;
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

  // Get variation labels from row before start row (typically row 5 in example)
  const variationLabelRow = rawData[startRowIndex - 1] || [];
  const variationLabelMap = new Map<number, string>();

  for (let colIdx = startDataColIndex; colIdx <= endDataColIndex; colIdx++) {
    const label = String(variationLabelRow[colIdx] || "").trim();
    if (label) {
      variationLabelMap.set(colIdx, label);
    }
  }

  // Extract feature rows - only selected features and items
  const selectedFeatureSet = new Set<string>();
  for (const group of variationGroups) {
    Object.keys(group.selectedFeatures).forEach((fname) => {
      selectedFeatureSet.add(fname);
    });
  }

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

    // Only include selected features
    if (!selectedFeatureSet.has(featureName)) continue;

    const itemName = String(row[itemColIndex] || "").trim();
    if (!itemName) continue;

    // Check if this item is selected in any variation group
    let isItemSelected = false;
    for (const group of variationGroups) {
      const selectedItems = group.selectedFeatures[featureName];
      if (selectedItems && selectedItems.includes(itemName)) {
        isItemSelected = true;
        break;
      }
    }

    if (!isItemSelected) continue;

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

  // Generate column patterns
  const colors = [
    "#FFE5E5", // Light red
    "#E5F3FF", // Light blue
    "#E5FFE5", // Light green
    "#FFF9E5", // Light yellow
    "#F0E5FF", // Light purple
    "#FFE5F5", // Light pink
    "#E5FFFF", // Light cyan
    "#FFE5CC", // Light orange
  ];

  const columnPatterns: Array<{
    columnLetter: string;
    gradeName: string;
    variationGroupId: string;
  }> = [];

  // Map variation labels to variation group IDs
  const labelToGroupMap = new Map<string, string>();
  for (const group of variationGroups) {
    labelToGroupMap.set(group.name, group.id);
  }

  for (let colIndex = startDataColIndex; colIndex <= endDataColIndex; colIndex++) {
    const columnLetter = indexToColumnLetter(colIndex);
    const gradeName = String(rawData[startRowIndex - 2]?.[colIndex] || "").trim(); // Grade name from row before variation labels
    const variationLabel = variationLabelMap.get(colIndex) || "";

    // Find which variation group this label belongs to
    let groupId = labelToGroupMap.get(variationLabel) || variationLabel;

    columnPatterns.push({
      columnLetter,
      gradeName,
      variationGroupId: groupId,
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
