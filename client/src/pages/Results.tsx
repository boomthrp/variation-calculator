/**
 * Design Philosophy: Formal Minimal
 * - Display analysis results in table format
 * - Color-coded by variation group
 * - Export options
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";
import { analyzeVariations, type AnalysisResult } from "@/lib/variationUtils";
import { exportToExcel } from "@/lib/excelUtils";

interface VariationGroupConfig {
  id: string;
  name: string;
  selectedFeatures: { [featureName: string]: string[] };
}

export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const { state } = useProject();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [exporting, setExporting] = useState(false);

  // Get variation groups from session storage
  const getVariationGroups = (): VariationGroupConfig[] => {
    try {
      const stored = sessionStorage.getItem("variationGroups");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse variation groups");
    }
    return [];
  };

  // Load analysis result
  useEffect(() => {
    if (!state.importedData || !state.configuration) {
      return;
    }

    try {
      const variationGroups = getVariationGroups();
      if (variationGroups.length === 0) {
        toast.error("No variation groups found");
        return;
      }

      const result = analyzeVariations(
        state.importedData.rawData,
        {
          featureColumn: state.configuration.featureColumn,
          itemColumn: (state.configuration as any).itemColumn || "N",
          startRow: state.configuration.startRow,
          startDataColumn: state.configuration.startDataColumn,
        },
        variationGroups
      );

      setAnalysisResult(result);
    } catch (error) {
      console.error("Failed to load analysis:", error);
      toast.error("Failed to load analysis results");
    }
  }, [state.importedData, state.configuration]);

  const handleExportResults = () => {
    if (!analysisResult) {
      toast.error("No analysis results");
      return;
    }

    setExporting(true);

    try {
      // Build export data
      const exportData: any[][] = [];

      // Add header rows
      analysisResult.headerRows.forEach((row) => {
        exportData.push(row);
      });

      // Add feature rows with data
      analysisResult.featureRows.forEach((row) => {
        const exportRow = [row.feature, row.item, ...row.values];
        exportData.push(exportRow);
      });

      exportToExcel(exportData, "variation_results.xlsx", "Results");
      toast.success("Exported: variation_results.xlsx");
    } catch (error) {
      toast.error("Export failed");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  if (!state.importedData || !state.configuration) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">No data available</p>
        <Button onClick={() => setLocation("/upload")}>Go to Upload</Button>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Loading analysis results...</p>
        <Button onClick={() => setLocation("/analyze")}>Go to Analysis</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-foreground">Results</h2>
        <p className="text-muted-foreground">
          Variation analysis with color-coded grouping
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Variation Groups</p>
          <p className="text-3xl font-semibold text-primary">
            {analysisResult.variationGroups.length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Columns</p>
          <p className="text-3xl font-semibold text-primary">
            {analysisResult.columnPatterns.length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Feature Rows</p>
          <p className="text-3xl font-semibold text-primary">
            {analysisResult.featureRows.length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">
            Variation Groups Legend
          </p>
          <div className="flex flex-wrap gap-2">
            {analysisResult.variationGroups.map((group) => (
              <div
                key={group.id}
                className="w-4 h-4 rounded"
                style={{ backgroundColor: group.color }}
                title={group.name}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Results Table */}
      <Card className="p-6 overflow-x-auto">
        <h3 className="font-semibold text-foreground mb-4">Variation Analysis</h3>

        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-3 py-2 text-left font-medium text-foreground sticky left-0 bg-muted">
                  Feature
                </th>
                <th className="border border-border px-3 py-2 text-left font-medium text-foreground sticky left-16 bg-muted">
                  Item
                </th>
                {analysisResult.columnPatterns.map((cp) => {
                  const group = analysisResult.variationGroups.find(
                    (g) => g.id === cp.variationGroupId
                  );
                  return (
                    <th
                      key={cp.columnLetter}
                      className="border border-border px-3 py-2 text-center font-medium text-xs"
                      style={{
                        backgroundColor: group?.color || "#f5f5f5",
                        color: "#000",
                      }}
                      title={`${cp.gradeName} (${group?.name})`}
                    >
                      <div>{cp.columnLetter}</div>
                      <div className="text-xs font-normal">{cp.gradeName}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {analysisResult.featureRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/50">
                  <td className="border border-border px-3 py-2 font-medium text-foreground sticky left-0 bg-background">
                    {row.feature}
                  </td>
                  <td className="border border-border px-3 py-2 text-muted-foreground sticky left-16 bg-background">
                    {row.item}
                  </td>
                  {row.values.map((value, colIdx) => {
                    const cp = analysisResult.columnPatterns[colIdx];
                    const group = analysisResult.variationGroups.find(
                      (g) => g.id === cp?.variationGroupId
                    );
                    return (
                      <td
                        key={colIdx}
                        className="border border-border px-3 py-2 text-center"
                        style={{
                          backgroundColor:
                            value === "O" || value === "o"
                              ? group?.color || "#f5f5f5"
                              : "#ffffff",
                          opacity: value === "-" ? 0.5 : 1,
                        }}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Variation Groups Legend */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Variation Groups</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisResult.variationGroups.map((group) => {
            const columnCount = analysisResult.columnPatterns.filter(
              (cp) => cp.variationGroupId === group.id
            ).length;

            return (
              <div
                key={group.id}
                className="p-4 border border-border rounded-lg flex items-start gap-3"
              >
                <div
                  className="w-6 h-6 rounded flex-shrink-0 mt-1"
                  style={{ backgroundColor: group.color }}
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {columnCount} column{columnCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Export */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Export Results</h3>
        <Button
          className="w-full"
          onClick={handleExportResults}
          disabled={exporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? "Exporting..." : "Export to Excel"}
        </Button>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setLocation("/analyze")}>
          Back
        </Button>
        <Button variant="outline" onClick={() => setLocation("/upload")}>
          New Analysis
        </Button>
      </div>
    </div>
  );
}
