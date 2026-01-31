/**
 * Design Philosophy: Technical Command Center
 * - Real-time variation analysis
 * - Interactive MAP/VARIANT editing
 * - Color-coded visualization
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, Save, Download } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";
import {
  analyzeVariations,
  updateLabels,
  lettersToNumber,
} from "@/lib/variationUtils";
import type { MapLabel, VariantLabel } from "@/lib/types";

export default function Analyze() {
  const [, setLocation] = useLocation();
  const { state, setVariationAnalysis } = useProject();
  const [maps, setMaps] = useState<MapLabel[]>([]);
  const [variants, setVariants] = useState<VariantLabel[]>([]);
  const [mapRenames, setMapRenames] = useState<{ [key: string]: string }>({});
  const [variantRenames, setVariantRenames] = useState<{ [key: number]: string }>({});
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (state.variationAnalysis) {
      setMaps(state.variationAnalysis.maps);
      setVariants(state.variationAnalysis.variants);
    }
  }, [state.variationAnalysis]);

  const handleAnalyze = () => {
    if (!state.importedData || !state.configuration) {
      toast.error("ERROR: Missing data or configuration");
      return;
    }

    setAnalyzing(true);

    try {
      const startCol = lettersToNumber(state.configuration.dataStartColumn) - 1;
      const analysis = analyzeVariations(
        state.importedData.rawData,
        state.configuration,
        state.configuration.startRow - 1,
        startCol
      );

      setVariationAnalysis(analysis);
      setMaps(analysis.maps);
      setVariants(analysis.variants);

      toast.success(
        `ANALYSIS COMPLETE: ${analysis.maps.length} MAPs, ${analysis.variants.length} VARIANTs`
      );
    } catch (error) {
      toast.error("ERROR: Analysis failed");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateLabels = () => {
    if (!state.variationAnalysis) return;

    const updated = updateLabels(
      state.variationAnalysis,
      mapRenames,
      variantRenames
    );

    setVariationAnalysis(updated);
    setMaps(updated.maps);
    setVariants(updated.variants);
    setMapRenames({});
    setVariantRenames({});

    toast.success("LABELS UPDATED");
  };

  if (!state.importedData || !state.configuration) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center bg-card border-border">
          <p className="text-muted-foreground">
            ERROR: No data or configuration. Please complete previous steps.
          </p>
          <Button className="mt-4" onClick={() => setLocation("/")}>
            GO TO IMPORT
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
          [VARIATION ANALYSIS]
        </h1>
        <p className="text-muted-foreground">
          Analyze patterns and generate MAP/VARIANT labels
        </p>
      </div>

      {/* Analysis Control */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              [ANALYSIS ENGINE]
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {state.configuration.features.length} features configured
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="font-bold"
          >
            <Play className="w-5 h-5 mr-2" />
            {analyzing ? "ANALYZING..." : "RUN ANALYSIS"}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {maps.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-card border-border">
              <div className="space-y-2">
                <h3 className="text-sm text-muted-foreground">TOTAL MAPs</h3>
                <p className="text-4xl font-bold text-lime-400 glow-lime">
                  {maps.length}
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="space-y-2">
                <h3 className="text-sm text-muted-foreground">
                  TOTAL VARIANTs
                </h3>
                <p className="text-4xl font-bold text-fuchsia-400 glow-fuchsia">
                  {variants.length}
                </p>
              </div>
            </Card>
          </div>

          {/* MAP Editor */}
          <Card className="p-6 space-y-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">[MAP LABELS]</h2>
              <Button variant="outline" size="sm" onClick={handleUpdateLabels}>
                <Save className="w-4 h-4 mr-2" />
                UPDATE LABELS
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {maps.map((map) => (
                <div
                  key={map.id}
                  className="space-y-2 p-4 rounded-sm border border-border bg-background"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      style={{ backgroundColor: map.color }}
                      className="text-xs font-bold text-black"
                    >
                      {map.id}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {map.columns.length} cols
                    </span>
                  </div>
                  <Input
                    placeholder="New name"
                    value={mapRenames[map.id] || ""}
                    onChange={(e) =>
                      setMapRenames({ ...mapRenames, [map.id]: e.target.value })
                    }
                    className="text-xs h-8"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* VARIANT Editor */}
          <Card className="p-6 space-y-4 bg-card border-border">
            <h2 className="text-lg font-bold text-foreground">
              [VARIANT LABELS]
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="space-y-2 p-4 rounded-sm border border-border bg-background"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      style={{ backgroundColor: variant.color }}
                      className="text-xs font-bold text-black"
                    >
                      {variant.id}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {variant.columns.length} cols
                    </span>
                  </div>
                  <Input
                    placeholder="New name"
                    value={variantRenames[variant.id] || ""}
                    onChange={(e) =>
                      setVariantRenames({
                        ...variantRenames,
                        [variant.id]: e.target.value,
                      })
                    }
                    className="text-xs h-8"
                  />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setLocation("/configure")}>
          ← BACK
        </Button>
        <Button
          onClick={() => setLocation("/export")}
          disabled={maps.length === 0}
          className="font-bold"
        >
          <Download className="w-4 h-4 mr-2" />
          EXPORT RESULTS →
        </Button>
      </div>
    </div>
  );
}
