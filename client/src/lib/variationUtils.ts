/**
 * Design Philosophy: Formal Minimal
 * - Core logic for flexible variation grouping
 * - Support N-way variation grouping (not just MAP/Variant)
 */

import type {
  Configuration,
  Feature,
  FeatureItem,
  VariationPattern,
  VariationGroup,
  VariationAnalysis,
} from "./types";

/**
 * Convert column number to letters (1->A, 26->Z, 27->AA)
 */
export function numberToLetters(colNum: number): string {
  let result = "";
  let n = colNum;
  while (n > 0) {
    result = String.fromCharCode(((n - 1) % 26) + 65) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

/**
 * Convert letters to number (A->1, Z->26, AA->27)
 */
export function lettersToNumber(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64);
  }
  return result;
}

/**
 * Create pattern key from feature values
 */
export function createPatternKey(values: (string | number)[]): string {
  return values.map((v) => String(v).trim()).join("|");
}

/**
 * Extract features from data based on configuration
 */
export function extractFeatures(
  data: any[][],
  config: Configuration
): Feature[] {
  const featureColIndex = lettersToNumber(config.featureColumn) - 1;
  const startRow = config.startRow - 1;

  const features: Feature[] = [];
  const featureMap = new Map<string, FeatureItem[]>();

  // Scan data to find all features and their items
  for (let row = startRow; row < data.length; row++) {
    const featureName = String(data[row]?.[featureColIndex] || "").trim();

    if (!featureName) continue;

    // Check if this is a new feature or an item
    if (!featureMap.has(featureName)) {
      featureMap.set(featureName, []);
    }

    // Get item name from the next column (feature column + 1)
    const itemName = String(data[row]?.[featureColIndex + 1] || "").trim();
    if (itemName && itemName !== featureName) {
      featureMap.get(featureName)!.push({
        name: itemName,
        isSelected: true,
      });
    }
  }

  // Convert to Feature array
  featureMap.forEach((items, featureName) => {
    features.push({
      name: featureName,
      items,
      isSelected: true,
    });
  });

  return features;
}

/**
 * Get feature rows for analysis
 */
function getFeatureRows(
  data: any[][],
  features: Feature[],
  featureColIndex: number,
  startRow: number
): number[] {
  const featureRows: number[] = [];
  const selectedFeatureNames = features
    .filter((f) => f.isSelected)
    .map((f) => f.name);

  for (const feature of features) {
    if (!feature.isSelected) continue;

    // Find rows for selected items only
    for (let row = startRow; row < data.length; row++) {
      const cellValue = String(data[row]?.[featureColIndex] || "").trim();

      if (cellValue === feature.name) {
        // Check if item is selected
        const itemName = String(data[row]?.[featureColIndex + 1] || "").trim();
        const item = feature.items.find((i) => i.name === itemName);

        if (item?.isSelected) {
          featureRows.push(row);
        }
      }
    }
  }

  return featureRows;
}

/**
 * Analyze variations with flexible grouping
 */
export function analyzeVariations(
  data: any[][],
  config: Configuration,
  features: Feature[]
): VariationAnalysis {
  const featureColIndex = lettersToNumber(config.featureColumn) - 1;
  const startDataColIndex = lettersToNumber(config.startDataColumn) - 1;
  const startRow = config.startRow - 1;

  const patternMap = new Map<string, VariationPattern>();
  const columnMappings: {
    [colKey: string]: { groupIds: number[]; patterns: string[] };
  } = {};

  let patternCounter = 0;

  // Get feature rows to analyze
  const featureRows = getFeatureRows(data, features, featureColIndex, startRow);

  if (featureRows.length === 0) {
    return { groups: [], columnMappings: {} };
  }

  // Analyze each column
  const numCols = data[0]?.length || 0;

  for (let col = startDataColIndex; col < numCols; col++) {
    const colKey = numberToLetters(col + 1);

    // Get pattern for this column
    const values = featureRows.map((row) => data[row]?.[col] ?? "");
    const pattern = createPatternKey(values);

    // Create or get pattern
    if (!patternMap.has(pattern)) {
      const patternId = String(patternCounter);
      patternMap.set(pattern, {
        id: patternId,
        pattern,
        columns: [],
        itemNames: featureRows
          .map((row) => String(data[row]?.[featureColIndex + 1] || "").trim())
          .filter((name) => name),
      });
      patternCounter++;
    }

    const variationPattern = patternMap.get(pattern)!;
    variationPattern.columns.push(colKey);

    columnMappings[colKey] = {
      groupIds: [parseInt(variationPattern.id)],
      patterns: [pattern],
    };
  }

  // Create variation groups
  const groups: VariationGroup[] = Array.from(patternMap.values()).map(
    (pattern, index) => ({
      id: index,
      name: `Variation ${index + 1}`,
      patterns: [pattern],
    })
  );

  return {
    groups,
    columnMappings,
  };
}

/**
 * Get unique patterns from analysis
 */
export function getUniquePatterns(analysis: VariationAnalysis): string[] {
  const patterns = new Set<string>();
  analysis.groups.forEach((group) => {
    group.patterns.forEach((pattern) => {
      patterns.add(pattern.pattern);
    });
  });
  return Array.from(patterns);
}

/**
 * Export analysis to array format
 */
export function exportAnalysisToArray(
  data: any[][],
  analysis: VariationAnalysis,
  config: Configuration
): any[][] {
  const result = [...data];
  const startDataColIndex = lettersToNumber(config.startDataColumn) - 1;

  // Add variation group rows
  result.push([]);

  analysis.groups.forEach((group) => {
    const groupRow: any[] = new Array(result[0].length).fill("");
    groupRow[0] = group.name;

    group.patterns.forEach((pattern) => {
      pattern.columns.forEach((colKey) => {
        const colIndex = lettersToNumber(colKey) - 1;
        groupRow[colIndex] = group.id;
      });
    });

    result.push(groupRow);
  });

  return result;
}
