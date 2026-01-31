/**
 * Design Philosophy: Technical Command Center
 * - Core logic ported from VBA macro
 * - Functional programming approach
 * - Type-safe implementations
 */

import type {
  Configuration,
  Feature,
  MapLabel,
  VariantLabel,
  VariationAnalysis,
} from "./types";

/**
 * Convert number to letters (1->A, 26->Z, 27->AA, ...)
 * Ported from VBA: NumberToLetters()
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
 * Convert letters to number (A->1, Z->26, AA->27, ...)
 */
export function lettersToNumber(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64);
  }
  return result;
}

/**
 * Generate color for MAP label
 * Ported from VBA color generation logic
 */
export function generateMapColor(mapIndex: number): string {
  const r = 230 - ((mapIndex * 25) % 100);
  const g = 240 - ((mapIndex * 40) % 100);
  const b = 255;
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generate color for VARIANT label
 * Ported from VBA color generation logic
 */
export function generateVariantColor(variantIndex: number): string {
  const r = 255;
  const g = 220 - ((variantIndex * 35) % 100);
  const b = 180 + ((variantIndex * 20) % 75);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Create pattern key from feature values
 * Ported from VBA pattern creation logic
 */
export function createPatternKey(values: (string | number)[]): string {
  return values.map((v) => String(v).trim()).join("|");
}

/**
 * Analyze variations and generate MAP/VARIANT labels
 * Ported from VBA: EPS_Variation()
 */
export function analyzeVariations(
  data: any[][],
  config: Configuration,
  startRow: number,
  startCol: number
): VariationAnalysis {
  const mapDict = new Map<string, number>();
  const variantDict = new Map<string, number>();
  const columnMappings: { [key: string]: { mapId: string; variantId: number } } = {};

  let mapCounter = 1;
  let variantCounter = 0;

  // Get feature rows for MAP
  const mapFeatureRows = getFeatureRows(data, config, startRow, true);
  // Get feature rows for VARIANT
  const variantFeatureRows = getFeatureRows(data, config, startRow, false);

  // Get number of columns
  const numCols = data[0]?.length || 0;

  // Loop through each column starting from dataStartColumn
  for (let col = startCol; col < numCols; col++) {
    const colKey = numberToLetters(col + 1);

    // === MAP Analysis ===
    const mapValues = mapFeatureRows.map((row) => data[row]?.[col] ?? "");
    const mapPattern = createPatternKey(mapValues);

    if (!mapDict.has(mapPattern)) {
      mapDict.set(mapPattern, mapCounter);
      mapCounter++;
    }

    const mapId = numberToLetters(mapDict.get(mapPattern)!);
    const mapColor = generateMapColor(mapDict.get(mapPattern)!);

    // === VARIANT Analysis ===
    const variantValues = variantFeatureRows.map((row) => data[row]?.[col] ?? "");
    const variantPattern = createPatternKey(variantValues);

    if (!variantDict.has(variantPattern)) {
      variantDict.set(variantPattern, variantCounter);
      variantCounter++;
    }

    const variantId = variantDict.get(variantPattern)!;
    const variantColor = generateVariantColor(variantId);

    columnMappings[colKey] = { mapId, variantId };
  }

  // Build MAP labels
  const maps: MapLabel[] = Array.from(mapDict.entries()).map(([pattern, index]) => {
    const id = numberToLetters(index);
    const color = generateMapColor(index);
    const columns = Object.entries(columnMappings)
      .filter(([_, mapping]) => mapping.mapId === id)
      .map(([col]) => col);

    return { id, pattern, color, columns };
  });

  // Build VARIANT labels
  const variants: VariantLabel[] = Array.from(variantDict.entries()).map(
    ([pattern, index]) => {
      const color = generateVariantColor(index);
      const columns = Object.entries(columnMappings)
        .filter(([_, mapping]) => mapping.variantId === index)
        .map(([col]) => col);

      return { id: index, pattern, color, columns };
    }
  );

  return {
    maps,
    variants,
    columnMappings,
  };
}

/**
 * Get feature rows based on configuration
 * Helper function for analyzeVariations
 */
function getFeatureRows(
  data: any[][],
  config: Configuration,
  startRow: number,
  forMap: boolean
): number[] {
  const featureRows: number[] = [];
  const featureColIndex = lettersToNumber(config.featureColumn) - 1;

  const selectedFeatures = config.features.filter((f) =>
    forMap ? f.useForMap : f.useForVariant
  );

  for (const feature of selectedFeatures) {
    // Find the row where this feature starts
    for (let row = startRow; row < data.length; row++) {
      const cellValue = data[row]?.[featureColIndex];
      if (cellValue === feature.name) {
        // Add all rows in this feature group
        let currentRow = row;
        while (
          currentRow < data.length &&
          (data[currentRow]?.[featureColIndex] === "" ||
            data[currentRow]?.[featureColIndex] === feature.name)
        ) {
          featureRows.push(currentRow);
          currentRow++;
        }
        break;
      }
    }
  }

  return featureRows;
}

/**
 * Filter data based on feature names
 * Ported from VBA: ImportFilteredData_FromConfiguration()
 */
export function filterDataByFeatures(
  data: any[][],
  config: Configuration,
  startRow: number
): any[][] {
  const featureColIndex = lettersToNumber(config.featureColumn) - 1;
  const selectedFeatureNames = config.features.map((f) => f.name);

  const filteredData: any[][] = [];

  // Copy header rows (before startRow)
  for (let i = 0; i < startRow; i++) {
    filteredData.push([...(data[i] || [])]);
  }

  // Filter data rows
  let copyGroup = false;
  for (let i = startRow; i < data.length; i++) {
    const currentName = String(data[i]?.[featureColIndex] || "").trim();

    if (currentName !== "") {
      copyGroup = selectedFeatureNames.includes(currentName);
    }

    if (copyGroup) {
      filteredData.push([...(data[i] || [])]);
    }
  }

  return filteredData;
}

/**
 * Rename MAP/VARIANT labels
 * Ported from VBA: UpdateNames()
 */
export function updateLabels(
  analysis: VariationAnalysis,
  mapRenames: { [oldId: string]: string },
  variantRenames: { [oldId: number]: string }
): VariationAnalysis {
  const updatedMaps = analysis.maps.map((map) => ({
    ...map,
    id: mapRenames[map.id] || map.id,
  }));

  const updatedVariants = analysis.variants.map((variant) => ({
    ...variant,
    id: variantRenames[variant.id] !== undefined
      ? parseInt(variantRenames[variant.id])
      : variant.id,
  }));

  const updatedMappings = Object.fromEntries(
    Object.entries(analysis.columnMappings).map(([col, mapping]) => [
      col,
      {
        mapId: mapRenames[mapping.mapId] || mapping.mapId,
        variantId:
          variantRenames[mapping.variantId] !== undefined
            ? parseInt(variantRenames[mapping.variantId])
            : mapping.variantId,
      },
    ])
  );

  return {
    maps: updatedMaps,
    variants: updatedVariants,
    columnMappings: updatedMappings,
  };
}
