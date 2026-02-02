/**
 * Design Philosophy: Formal Minimal
 * - Simple configuration interface
 * - Feature and item selection
 * - Real-time search
 */

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";
import type { Feature } from "@/lib/types";

export default function ConfigurePage() {
  const [, setLocation] = useLocation();
  const { state, setImportedData } = useProject();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [featureColumn, setFeatureColumn] = useState("M");
  const [startRow, setStartRow] = useState(19);
  const [startDataColumn, setStartDataColumn] = useState("V");

  useEffect(() => {
    if (state.importedData) {
      setFeatures(state.importedData.features);
    }
  }, [state.importedData]);

  // Filter features based on search
  const filteredFeatures = useMemo(() => {
    if (!searchQuery) return features;

    const query = searchQuery.toLowerCase();
    return features.map((feature) => ({
      ...feature,
      items: feature.items.filter((item) =>
        item.name.toLowerCase().includes(query)
      ),
    }));
  }, [features, searchQuery]);

  const handleToggleFeature = (featureName: string) => {
    setFeatures(
      features.map((f) =>
        f.name === featureName ? { ...f, isSelected: !f.isSelected } : f
      )
    );
  };

  const handleToggleItem = (featureName: string, itemName: string) => {
    setFeatures(
      features.map((f) =>
        f.name === featureName
          ? {
              ...f,
              items: f.items.map((item) =>
                item.name === itemName
                  ? { ...item, isSelected: !item.isSelected }
                  : item
              ),
            }
          : f
      )
    );
  };

  const handleContinue = () => {
    const selectedFeatures = features.filter((f) => f.isSelected);
    if (selectedFeatures.length === 0) {
      toast.error("Please select at least one feature");
      return;
    }

    if (state.importedData) {
      setImportedData({
        ...state.importedData,
        features,
      });
    }

    setLocation("/analyze");
  };

  if (!state.importedData) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          No data imported. Please upload a file first.
        </p>
        <Button onClick={() => setLocation("/")}>Go to Upload</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-foreground">
          Configure Features
        </h2>
        <p className="text-muted-foreground">
          Select features and items to analyze
        </p>
      </div>

      {/* Settings */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Column Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Feature Column
            </label>
            <Input
              value={featureColumn}
              onChange={(e) => setFeatureColumn(e.target.value.toUpperCase())}
              placeholder="M"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Start Row
            </label>
            <Input
              type="number"
              value={startRow}
              onChange={(e) => setStartRow(parseInt(e.target.value))}
              placeholder="19"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Data Start Column
            </label>
            <Input
              value={startDataColumn}
              onChange={(e) => setStartDataColumn(e.target.value.toUpperCase())}
              placeholder="V"
            />
          </div>
        </div>
      </Card>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Search Features & Items
        </label>
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Features List */}
      <div className="space-y-4">
        {filteredFeatures.map((feature) => (
          <Card key={feature.name} className="p-4">
            {/* Feature Header */}
            <div className="flex items-center gap-3 mb-4">
              <Checkbox
                checked={feature.isSelected}
                onCheckedChange={() => handleToggleFeature(feature.name)}
              />
              <h4 className="font-medium text-foreground flex-1">
                {feature.name}
              </h4>
              <span className="text-xs text-muted-foreground">
                {feature.items.filter((i) => i.isSelected).length} /{" "}
                {feature.items.length}
              </span>
            </div>

            {/* Items List */}
            {feature.isSelected && (
              <div className="ml-6 space-y-2">
                {feature.items.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <Checkbox
                      checked={item.isSelected}
                      onCheckedChange={() =>
                        handleToggleItem(feature.name, item.name)
                      }
                    />
                    <span className="text-sm text-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setLocation("/")}>
          Back
        </Button>
        <Button onClick={handleContinue}>Continue to Analysis</Button>
      </div>
    </div>
  );
}
