/**
 * Design Philosophy: Formal Minimal
 * - Display analysis results
 * - Show variation patterns and grouping
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";
import { analyzeVariations } from "@/lib/variationUtils";
import type { AnalysisResult } from "@/lib/variationUtils";

interface VariationGroupConfig {
  id: string;
  name: string;
  selectedFeatures: { [featureName: string]: string[] };
}

export default function AnalyzePage() {
  const [, setLocation] = useLocation();
  const { state } = useProject();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [analyzing, setAnalyzing] = useState(false);

  // Get variation groups from session storage or state
  const getVariationGroups = (): VariationGroupConfig[] => {
    try {
      const stored = sessionStorage.getItem("variationGroups");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse variation groups from storage");
    }
    return [];
  };

  const handleAnalyze = () => {
    if (!state.importedData || !state.configuration) {
      toast.error("Missing data or configuration");
      return;
    }

    const variationGroups = getVariationGroups();
    if (variationGroups.length === 0) {
      toast.error("No variation groups configured");
      return;
    }

    setAnalyzing(true);

    try {
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
      toast.success("Analysis complete");
    } catch (error) {
      toast.error("Analysis failed");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    // Auto-analyze if not done yet
    if (!analysisResult && state.importedData && state.configuration) {
      // Don't auto-analyze, wait for user click
    }
  }, [state.importedData, state.configuration]);

  if (!state.importedData || !state.configuration) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">No data available</p>
        <Button onClick={() => setLocation("/upload")}>Go to Upload</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-foreground">
          Analyze Variations
        </h2>
        <p className="text-muted-foreground">
          Review variation patterns and grouping
        </p>
      </div>

      {/* Analysis Control */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              {analysisResult
                ? `${analysisResult.variationGroups.length} Variation Groups`
                : "Ready to Analyze"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {analysisResult
                ? `${analysisResult.columnPatterns.length} columns analyzed`
                : "Click Run Analysis to start"}
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? "Analyzing..." : "Run Analysis"}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {analysisResult && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">
                Variation Groups
              </p>
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
              <p className="text-sm text-muted-foreground mb-2">
                Feature Rows
              </p>
              <p className="text-3xl font-semibold text-primary">
                {analysisResult.featureRows.length}
              </p>
            </Card>
          </div>

          {/* Variation Groups */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Variation Groups</h3>

            <div className="space-y-3">
              {analysisResult.variationGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 border border-border rounded-lg flex items-center gap-3"
                >
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: group.color }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {
                        analysisResult.columnPatterns.filter(
                          (cp) => cp.variationGroupId === group.id
                        ).length
                      }{" "}
                      columns
                    </p>
                  </div>
                  <Badge variant="outline">{group.id}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Column Patterns Preview */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground">
              Column Patterns (First 10)
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analysisResult.columnPatterns.slice(0, 10).map((cp) => {
                const group = analysisResult.variationGroups.find(
                  (g) => g.id === cp.variationGroupId
                );
                return (
                  <div
                    key={cp.columnLetter}
                    className="p-3 border border-border rounded-lg flex items-center gap-3"
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: group?.color || "#ccc" }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {cp.columnLetter}: {cp.gradeName}
                      </p>

                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setLocation("/configure")}>
          Back
        </Button>
        <Button
          onClick={() => setLocation("/results")}
          disabled={!analysisResult}
        >
          View Results Table
        </Button>
      </div>
    </div>
  );
}
