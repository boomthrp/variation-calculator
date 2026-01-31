/**
 * Design Philosophy: Technical Command Center
 * - Feature configuration interface
 * - Real-time validation
 * - Inline editing
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";
import type { Feature, Configuration } from "@/lib/types";
import { validateConfiguration } from "@/lib/excelUtils";

export default function Configure() {
  const [, setLocation] = useLocation();
  const { state, setConfiguration } = useProject();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [featureColumn, setFeatureColumn] = useState("M");
  const [startRow, setStartRow] = useState(19);
  const [dataStartColumn, setDataStartColumn] = useState("V");

  useEffect(() => {
    if (state.configuration) {
      setFeatures(state.configuration.features);
      setFeatureColumn(state.configuration.featureColumn);
      setStartRow(state.configuration.startRow);
      setDataStartColumn(state.configuration.dataStartColumn);
    }
  }, [state.configuration]);

  const handleAddFeature = () => {
    setFeatures([
      ...features,
      { name: "", useForMap: false, useForVariant: false },
    ]);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (
    index: number,
    field: keyof Feature,
    value: string | boolean
  ) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
  };

  const handleSave = () => {
    const config: Configuration = {
      features,
      featureColumn,
      startRow,
      dataStartColumn,
    };

    const validation = validateConfiguration(config);
    if (!validation.valid) {
      toast.error(`VALIDATION ERROR: ${validation.errors.join(", ")}`);
      return;
    }

    setConfiguration(config);
    toast.success("CONFIGURATION SAVED");
  };

  const handleNext = () => {
    handleSave();
    setLocation("/analyze");
  };

  if (!state.importedData) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center bg-card border-border">
          <p className="text-muted-foreground">
            ERROR: No data imported. Please import data first.
          </p>
          <Button
            className="mt-4"
            onClick={() => setLocation("/")}
          >
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
          [CONFIGURE FEATURES]
        </h1>
        <p className="text-muted-foreground">
          Define features and analysis parameters
        </p>
      </div>

      {/* Settings */}
      <Card className="p-6 space-y-4 bg-card border-border">
        <h2 className="text-lg font-bold text-foreground">[PARAMETERS]</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              FEATURE COLUMN:
            </label>
            <Input
              value={featureColumn}
              onChange={(e) => setFeatureColumn(e.target.value.toUpperCase())}
              placeholder="M"
              className="font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">START ROW:</label>
            <Input
              type="number"
              value={startRow}
              onChange={(e) => setStartRow(parseInt(e.target.value))}
              placeholder="19"
              className="font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              DATA START COLUMN:
            </label>
            <Input
              value={dataStartColumn}
              onChange={(e) =>
                setDataStartColumn(e.target.value.toUpperCase())
              }
              placeholder="V"
              className="font-bold"
            />
          </div>
        </div>
      </Card>

      {/* Features Table */}
      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">[FEATURES]</h2>
          <Button onClick={handleAddFeature} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            ADD FEATURE
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-bold">
                  FEATURE NAME
                </th>
                <th className="text-center py-3 px-2 text-muted-foreground font-bold">
                  USE FOR MAP
                </th>
                <th className="text-center py-3 px-2 text-muted-foreground font-bold">
                  USE FOR VARIANT
                </th>
                <th className="text-center py-3 px-2 text-muted-foreground font-bold">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b border-border/50">
                  <td className="py-3 px-2">
                    <Input
                      value={feature.name}
                      onChange={(e) =>
                        handleFeatureChange(index, "name", e.target.value)
                      }
                      placeholder="Feature name"
                      className="bg-background"
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Checkbox
                      checked={feature.useForMap}
                      onCheckedChange={(checked) =>
                        handleFeatureChange(index, "useForMap", !!checked)
                      }
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Checkbox
                      checked={feature.useForVariant}
                      onCheckedChange={(checked) =>
                        handleFeatureChange(index, "useForVariant", !!checked)
                      }
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {features.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            NO FEATURES DEFINED. Click "ADD FEATURE" to start.
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setLocation("/")}>
          ← BACK
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            SAVE CONFIG
          </Button>
          <Button onClick={handleNext} className="font-bold">
            ANALYZE DATA →
          </Button>
        </div>
      </div>
    </div>
  );
}
