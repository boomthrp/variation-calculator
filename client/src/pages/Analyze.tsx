/**
 * Design Philosophy: Formal Minimal
 * - Clean analysis interface
 * - Variation grouping display
 * - Flexible group management
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";
import { analyzeVariations } from "@/lib/variationUtils";
import type { VariationGroup } from "@/lib/types";

export default function AnalyzePage() {
  const [, setLocation] = useLocation();
  const { state, setVariationAnalysis } = useProject();
  const [groups, setGroups] = useState<VariationGroup[]>([]);
  const [groupNames, setGroupNames] = useState<{ [key: number]: string }>({});
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!state.importedData || !state.configuration) {
      toast.error("Missing data or configuration");
      return;
    }

    setAnalyzing(true);

    try {
      const analysis = analyzeVariations(
        state.importedData.rawData,
        state.configuration,
        state.importedData.features
      );

      setVariationAnalysis(analysis);
      setGroups(analysis.groups);

      // Initialize group names
      const names: { [key: number]: string } = {};
      analysis.groups.forEach((group) => {
        names[group.id] = group.name;
      });
      setGroupNames(names);

      toast.success(`Analysis complete: ${analysis.groups.length} variations`);
    } catch (error) {
      toast.error("Analysis failed");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateNames = () => {
    if (!state.variationAnalysis) return;

    const updatedGroups = groups.map((group) => ({
      ...group,
      name: groupNames[group.id] || group.name,
    }));

    setGroups(updatedGroups);
    setVariationAnalysis({
      ...state.variationAnalysis,
      groups: updatedGroups,
    });

    toast.success("Names updated");
  };

  if (!state.importedData) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">No data available</p>
        <Button onClick={() => setLocation("/")}>Go to Upload</Button>
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
          Identify and group variation patterns
        </p>
      </div>

      {/* Analysis Control */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              {groups.length > 0
                ? `${groups.length} Variation Groups Found`
                : "Ready to Analyze"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {state.importedData.features.filter((f) => f.isSelected).length}{" "}
              features selected
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? "Analyzing..." : "Run Analysis"}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {groups.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">
                Total Variations
              </p>
              <p className="text-3xl font-semibold text-primary">
                {groups.length}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Columns</p>
              <p className="text-3xl font-semibold text-primary">
                {Object.keys(state.variationAnalysis?.columnMappings || {})
                  .length}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">
                Selected Features
              </p>
              <p className="text-3xl font-semibold text-primary">
                {
                  state.importedData.features.filter((f) => f.isSelected)
                    .length
                }
              </p>
            </Card>
          </div>

          {/* Variation Groups */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Variation Groups</h3>

            <div className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 border border-border rounded-lg space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Group {group.id}</Badge>
                    <Input
                      placeholder="Group name"
                      value={groupNames[group.id] || ""}
                      onChange={(e) =>
                        setGroupNames({
                          ...groupNames,
                          [group.id]: e.target.value,
                        })
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      {group.patterns.reduce(
                        (sum, p) => sum + p.columns.length,
                        0
                      )}{" "}
                      columns
                    </span>
                  </div>

                  {/* Pattern Info */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    {group.patterns.map((pattern) => (
                      <div key={pattern.id}>
                        <p>
                          Pattern: <code>{pattern.pattern}</code>
                        </p>
                        <p>Columns: {pattern.columns.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleUpdateNames} className="w-full">
              Update Names
            </Button>
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
          disabled={groups.length === 0}
        >
          View Results
        </Button>
      </div>
    </div>
  );
}
