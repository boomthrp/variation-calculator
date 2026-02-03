/**
 * Design Philosophy: Formal Minimal
 * - Pattern-based variation grouping
 * - Support N-way variation grouping
 * 
 * Data Model:
 * - Base data: 1 Excel file, 1 Worksheet (F-List)
 * - Metadata rows: before startRow (Grade, Destination, Plant, Model)
 * - Feature + Item rows: from startRow onwards
 *   - Feature column: contains feature name or blank (if item of same feature)
 *   - Item column: contains item name
 * - Grade columns: from firstGradeColumn onwards (O/- values)
 * - Variation: rule for grouping columns by pattern
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
 * Handles blank cells in feature column (items of same feature)
 */
export function extractFeatures(
  rawData: any[][],
  config: {
    featureColumn: string;
    itemColumn: string;
    startRow: number;
  }
): Feature[] {
  const featureColIndex = columnLetterToIndex(config.featureColumn);
  const itemColIndex = columnLetterToIndex(config.itemColumn);
  const startRowIndex = config.startRow - 1;

  const featureList: Feature[] = [];
  let currentFeature: Feature | null = null;

  // Extract features and items from data
  for (let i = startRowIndex; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length <= Math.max(featureColIndex, itemColIndex)) break;

    const featureName = String(row[featureColIndex] || "").trim();
    const itemName = String(row[itemColIndex] || "").trim();

    // Stop if both feature and item are empty
    if (!featureName && !itemName) break;

    // If feature name is provided, create new feature
    if (featureName) {
      currentFeature = {
        name: featureName,
        items: [],
        isSelected: false,
      };
      featureList.push(currentFeature);
    }

    // Add item to current feature
    if (itemName && currentFeature) {
      currentFeature.items.push({
        name: itemName,
        isSelected: true, // Default: select all items
      });
    }
  }

  console.log("Extracted features:", featureList);
  return featureList;
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
 * Extract pattern for a single column (feature-item combinations)
 */
function extractColumnPattern(
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

  const pattern: string[] = [];
  let currentFeature: string | null = null;

  for (let i = startRowIndex; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length <= Math.max(featureColIndex, itemColIndex)) break;

    const featureName = String(row[featureColIndex] || "").trim();
    const itemName = String(row[itemColIndex] || "").trim();

    if (!featureName && !itemName) break;

    // Update current feature
    if (featureName) {
      currentFeature = featureName;
    }

    // Check if this feature-item is selected
    if (currentFeature && selectedFeatures[currentFeature]) {
      const selectedItems = selectedFeatures[currentFeature];
      if (Array.isArray(selectedItems) && selectedItems.includes(itemName)) {
        const cellValue = String(row[columnIndex] || "").trim();
        pattern.push(cellValue === "O" ? "O" : "-");
      }
    }
  }

  return pattern.join("");
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
    variationGroup: string; // A, B, C, etc.
    backgroundColor: string;
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

  console.log("Debug analyzeVariations:", {
    featureColIndex,
    itemColIndex,
    startRowIndex,
    startDataColIndex,
    endDataColIndex,
    rawDataLength: rawData.length,
  });

  // Extract header rows (before feature data starts)
  const headerRows: any[][] = [];
  for (let i = 0; i < startRowIndex; i++) {
    if (rawData[i]) {
      headerRows.push(
        rawData[i].slice(startDataColIndex, endDataColIndex + 1)
      );
    }
  }

  // Extract feature rows - only selected features and items
  const selectedFeatureSet = new Set<string>();
  const selectedItemsMap: { [featureName: string]: Set<string> } = {};

  for (const group of variationGroups) {
    Object.entries(group.selectedFeatures).forEach(([fname, items]) => {
      selectedFeatureSet.add(fname);
      if (!selectedItemsMap[fname]) {
        selectedItemsMap[fname] = new Set();
      }
      items.forEach((item) => {
        selectedItemsMap[fname].add(item);
      });
    });
  }

  const featureRows: Array<{
    feature: string;
    item: string;
    values: string[];
  }> = [];

  let currentFeature: string | null = null;

  for (let i = startRowIndex; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length <= Math.max(featureColIndex, itemColIndex)) break;

    const featureName = String(row[featureColIndex] || "").trim();
    const itemName = String(row[itemColIndex] || "").trim();

    if (!featureName && !itemName) break;

    // Update current feature
    if (featureName) {
      currentFeature = featureName;
    }

    // Only include selected features and items
    if (!currentFeature || !selectedFeatureSet.has(currentFeature)) continue;
    if (!itemName) continue;

    const selectedItems = selectedItemsMap[currentFeature];
    if (!selectedItems || !selectedItems.has(itemName)) continue;

    const values = [];
    for (let j = startDataColIndex; j <= endDataColIndex; j++) {
      values.push(String(row[j] || "").trim());
    }

    featureRows.push({
      feature: currentFeature,
      item: itemName,
      values,
    });
  }

  console.log("Feature rows extracted:", featureRows.length);

  // Generate column patterns and group them
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

  // Map each column to its pattern
  const columnPatternMap = new Map<number, string>();
  const selectedItemsMapForPattern: { [featureName: string]: string[] } = {};
  for (const [fname, items] of Object.entries(selectedItemsMap)) {
    selectedItemsMapForPattern[fname] = Array.from(items);
  }
  for (let colIndex = startDataColIndex; colIndex <= endDataColIndex; colIndex++) {
    const pattern = extractColumnPattern(
      rawData,
      colIndex,
      config,
      selectedItemsMapForPattern
    );
    columnPatternMap.set(colIndex, pattern);
  }

  // Group columns by pattern
  const patternToGroupMap = new Map<string, string>();
  let groupCounter = 0;
  const groupLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  columnPatternMap.forEach((pattern) => {
    if (!patternToGroupMap.has(pattern)) {
      patternToGroupMap.set(pattern, groupLetters[groupCounter % groupLetters.length]);
      groupCounter++;
    }
  });

  // Generate column patterns with group assignments
  const columnPatterns: Array<{
    columnLetter: string;
    gradeName: string;
    variationGroup: string;
    backgroundColor: string;
  }> = [];

  for (let colIndex = startDataColIndex; colIndex <= endDataColIndex; colIndex++) {
    const columnLetter = indexToColumnLetter(colIndex);
    const gradeName = String(rawData[startRowIndex - 2]?.[colIndex] || "").trim();
    const pattern = columnPatternMap.get(colIndex) || "";
    const variationGroup = patternToGroupMap.get(pattern) || "?";
    const colorIndex = groupLetters.indexOf(variationGroup);
    const backgroundColor = colors[Math.max(0, colorIndex) % colors.length];

    columnPatterns.push({
      columnLetter,
      gradeName,
      variationGroup,
      backgroundColor,
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
