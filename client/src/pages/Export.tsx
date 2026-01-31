/**
 * Design Philosophy: Technical Command Center
 * - Multiple export formats
 * - Preview before export
 * - Download management
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";
import { exportToExcel, exportMultipleSheetsToExcel } from "@/lib/excelUtils";
import { lettersToNumber } from "@/lib/variationUtils";

export default function Export() {
  const [, setLocation] = useLocation();
  const { state } = useProject();
  const [exporting, setExporting] = useState(false);

  const handleExportVariationSheet = () => {
    if (!state.importedData || !state.variationAnalysis || !state.configuration) {
      toast.error("ERROR: Missing data");
      return;
    }

    setExporting(true);

    try {
      const data = [...state.importedData.rawData];
      const startCol = lettersToNumber(state.configuration.dataStartColumn) - 1;

      // Add MAP and VARIANT rows
      const mapRow: any[] = new Array(data[0].length).fill("");
      const variantRow: any[] = new Array(data[0].length).fill("");

      Object.entries(state.variationAnalysis.columnMappings).forEach(
        ([colKey, mapping]) => {
          const colIndex = lettersToNumber(colKey) - 1;
          mapRow[colIndex] = mapping.mapId;
          variantRow[colIndex] = mapping.variantId;
        }
      );

      // Insert summary rows
      data.push([]);
      data.push([
        `${state.variationAnalysis.maps.length} MAP`,
        ...mapRow.slice(1),
      ]);
      data.push([
        `${state.variationAnalysis.variants.length} VARIANT`,
        ...variantRow.slice(1),
      ]);

      exportToExcel(data, "variation_analysis.xlsx", "Variation");
      toast.success("EXPORTED: variation_analysis.xlsx");
    } catch (error) {
      toast.error("ERROR: Export failed");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportVariantList = () => {
    if (!state.importedData || !state.variationAnalysis || !state.configuration) {
      toast.error("ERROR: Missing data");
      return;
    }

    setExporting(true);

    try {
      // Create variant summary table
      const headers = ["Variant ID", "MAP ID", "Column Count"];
      const rows = state.variationAnalysis.variants.map((variant) => [
        variant.id,
        state.variationAnalysis!.variants.find((v) => v.id === variant.id)
          ? "Multiple"
          : "",
        variant.columns.length,
      ]);

      const data = [headers, ...rows];

      exportToExcel(data, "variant_list.xlsx", "Variant List");
      toast.success("EXPORTED: variant_list.xlsx");
    } catch (error) {
      toast.error("ERROR: Export failed");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = () => {
    if (!state.importedData || !state.variationAnalysis || !state.configuration) {
      toast.error("ERROR: Missing data");
      return;
    }

    setExporting(true);

    try {
      // Prepare variation sheet
      const variationData = [...state.importedData.rawData];
      const mapRow: any[] = new Array(variationData[0].length).fill("");
      const variantRow: any[] = new Array(variationData[0].length).fill("");

      Object.entries(state.variationAnalysis.columnMappings).forEach(
        ([colKey, mapping]) => {
          const colIndex = lettersToNumber(colKey) - 1;
          mapRow[colIndex] = mapping.mapId;
          variantRow[colIndex] = mapping.variantId;
        }
      );

      variationData.push([]);
      variationData.push([
        `${state.variationAnalysis.maps.length} MAP`,
        ...mapRow.slice(1),
      ]);
      variationData.push([
        `${state.variationAnalysis.variants.length} VARIANT`,
        ...variantRow.slice(1),
      ]);

      // Prepare variant list
      const variantHeaders = ["Variant ID", "MAP ID", "Column Count"];
      const variantRows = state.variationAnalysis.variants.map((variant) => [
        variant.id,
        "Multiple",
        variant.columns.length,
      ]);
      const variantListData = [variantHeaders, ...variantRows];

      // Export multiple sheets
      exportMultipleSheetsToExcel(
        [
          { name: "Variation", data: variationData },
          { name: "Variant List", data: variantListData },
        ],
        "complete_analysis.xlsx"
      );

      toast.success("EXPORTED: complete_analysis.xlsx");
    } catch (error) {
      toast.error("ERROR: Export failed");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  if (!state.variationAnalysis) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center bg-card border-border">
          <p className="text-muted-foreground">
            ERROR: No analysis results. Please run analysis first.
          </p>
          <Button className="mt-4" onClick={() => setLocation("/analyze")}>
            GO TO ANALYZE
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary glow-cyan">
          [EXPORT RESULTS]
        </h1>
        <p className="text-muted-foreground">
          Download analysis results in various formats
        </p>
      </div>

      {/* Summary */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-bold text-foreground mb-4">
          [ANALYSIS SUMMARY]
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">MAPs</p>
            <p className="text-2xl font-bold text-lime-400">
              {state.variationAnalysis.maps.length}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">VARIANTs</p>
            <p className="text-2xl font-bold text-fuchsia-400">
              {state.variationAnalysis.variants.length}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">FEATURES</p>
            <p className="text-2xl font-bold text-cyan-400">
              {state.configuration?.features.length || 0}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">COLUMNS</p>
            <p className="text-2xl font-bold text-amber-400">
              {Object.keys(state.variationAnalysis.columnMappings).length}
            </p>
          </div>
        </div>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4 bg-card border-border">
          <FileSpreadsheet className="w-12 h-12 text-primary" />
          <div>
            <h3 className="text-lg font-bold text-foreground">
              VARIATION SHEET
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Export data with MAP and VARIANT labels
            </p>
          </div>
          <Button
            className="w-full font-bold"
            onClick={handleExportVariationSheet}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            EXPORT
          </Button>
        </Card>

        <Card className="p-6 space-y-4 bg-card border-border">
          <FileText className="w-12 h-12 text-lime-400" />
          <div>
            <h3 className="text-lg font-bold text-foreground">VARIANT LIST</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Export variant summary table
            </p>
          </div>
          <Button
            className="w-full font-bold"
            onClick={handleExportVariantList}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            EXPORT
          </Button>
        </Card>

        <Card className="p-6 space-y-4 bg-card border-border">
          <FileSpreadsheet className="w-12 h-12 text-fuchsia-400" />
          <div>
            <h3 className="text-lg font-bold text-foreground">
              COMPLETE PACKAGE
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Export all sheets in one file
            </p>
          </div>
          <Button
            className="w-full font-bold"
            onClick={handleExportAll}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            EXPORT ALL
          </Button>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setLocation("/analyze")}>
          ← BACK
        </Button>
        <Button variant="outline" onClick={() => setLocation("/")}>
          NEW ANALYSIS
        </Button>
      </div>
    </div>
  );
}
