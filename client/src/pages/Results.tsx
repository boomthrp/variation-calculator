/**
 * Design Philosophy: Formal Minimal
 * - Clean results display
 * - Export options
 * - Data summary
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";
import { exportToExcel, exportMultipleSheetsToExcel } from "@/lib/excelUtils";
import { exportAnalysisToArray, lettersToNumber } from "@/lib/variationUtils";

export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const { state } = useProject();
  const [exporting, setExporting] = useState(false);

  const handleExportAnalysis = () => {
    if (!state.importedData || !state.variationAnalysis || !state.configuration) {
      toast.error("Missing data");
      return;
    }

    setExporting(true);

    try {
      const data = exportAnalysisToArray(
        state.importedData.rawData,
        state.variationAnalysis,
        state.configuration
      );

      exportToExcel(data, "variation_analysis.xlsx", "Analysis");
      toast.success("Exported: variation_analysis.xlsx");
    } catch (error) {
      toast.error("Export failed");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportSummary = () => {
    if (!state.variationAnalysis) {
      toast.error("No analysis data");
      return;
    }

    setExporting(true);

    try {
      const headers = ["Variation Group", "Pattern", "Columns", "Item Count"];
      const rows = state.variationAnalysis.groups.map((group) => [
        group.name,
        group.patterns.map((p) => p.pattern).join("; "),
        group.patterns
          .flatMap((p) => p.columns)
          .join(", "),
        group.patterns.reduce((sum, p) => sum + p.itemNames.length, 0),
      ]);

      const data = [headers, ...rows];
      exportToExcel(data, "variation_summary.xlsx", "Summary");
      toast.success("Exported: variation_summary.xlsx");
    } catch (error) {
      toast.error("Export failed");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  if (!state.variationAnalysis) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">No analysis results available</p>
        <Button onClick={() => setLocation("/analyze")}>Go to Analysis</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-foreground">Results</h2>
        <p className="text-muted-foreground">View and export analysis results</p>
      </div>

      {/* Summary */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Analysis Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Variation Groups</p>
            <p className="text-2xl font-semibold text-primary">
              {state.variationAnalysis.groups.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Columns</p>
            <p className="text-2xl font-semibold text-primary">
              {Object.keys(state.variationAnalysis.columnMappings).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Selected Features</p>
            <p className="text-2xl font-semibold text-primary">
              {state.importedData?.features.filter((f) => f.isSelected).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-2xl font-semibold text-primary">
              {state.importedData?.features
                .filter((f) => f.isSelected)
                .reduce((sum, f) => sum + f.items.filter((i) => i.isSelected).length, 0)}
            </p>
          </div>
        </div>
      </Card>

      {/* Variation Groups Table */}
      <Card className="p-6 overflow-x-auto">
        <h3 className="font-semibold text-foreground mb-4">Variation Groups</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                Group
              </th>
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                Pattern
              </th>
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                Columns
              </th>
              <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {state.variationAnalysis.groups.map((group) => (
              <tr key={group.id} className="border-b border-border/50">
                <td className="py-3 px-2 font-medium text-foreground">
                  {group.name}
                </td>
                <td className="py-3 px-2 text-muted-foreground">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {group.patterns.map((p) => p.pattern).join("; ")}
                  </code>
                </td>
                <td className="py-3 px-2 text-muted-foreground">
                  {group.patterns
                    .flatMap((p) => p.columns)
                    .join(", ")}
                </td>
                <td className="py-3 px-2 text-right text-foreground font-medium">
                  {group.patterns.reduce((sum, p) => sum + p.columns.length, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Export Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Export full analysis with variation groups
          </p>
          <Button
            className="w-full"
            onClick={handleExportAnalysis}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Analysis
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Export Summary</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Export variation groups summary table
          </p>
          <Button
            className="w-full"
            onClick={handleExportSummary}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Summary
          </Button>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setLocation("/analyze")}>
          Back
        </Button>
        <Button variant="outline" onClick={() => setLocation("/")}>
          New Analysis
        </Button>
      </div>
    </div>
  );
}
