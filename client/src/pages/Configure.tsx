/**
 * Design Philosophy: Formal Minimal
 * - Multi-step variation group configuration
 * - Feature and item selection per group
 * - Real-time search
 */

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";
import { extractFeatures } from "@/lib/variationUtils";
import type { Feature } from "@/lib/types";
import { X, Plus } from "lucide-react";

interface VariationGroupConfig {
  id: string;
  name: string;
  selectedFeatures: { [featureName: string]: string[] }; // feature name -> selected item names
}

export default function ConfigurePage() {
  const [, setLocation] = useLocation();
  const { state, setImportedData } = useProject();

  // Column settings
  const [featureColumn, setFeatureColumn] = useState("M");
  const [startRow, setStartRow] = useState(19);
  const [startDataColumn, setStartDataColumn] = useState("V");

  // Available features from data
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);

  // Variation groups configuration
  const [variationGroups, setVariationGroups] = useState<VariationGroupConfig[]>(
    []
  );
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Re-extract features when column settings change
  useEffect(() => {
    if (state.importedData && state.importedData.rawData) {
      try {
        const updatedFeatures = extractFeatures(
          state.importedData.rawData,
          {
            featureColumn,
            startRow,
            startDataColumn,
            selectedFeatures: [],
          }
        );
        setAllFeatures(updatedFeatures);
      } catch (error) {
        console.error("Error extracting features:", error);
        toast.error("Failed to extract features");
      }
    }
  }, [featureColumn, startRow, state.importedData]);

  // Filter features based on search
  const filteredFeatures = useMemo(() => {
    if (!searchQuery) return allFeatures;

    const query = searchQuery.toLowerCase();
    return allFeatures
      .filter((f) => f.name.toLowerCase().includes(query))
      .map((feature) => ({
        ...feature,
        items: feature.items.filter((item) =>
          item.name.toLowerCase().includes(query)
        ),
      }));
  }, [allFeatures, searchQuery]);

  // Get active group
  const activeGroup = variationGroups.find((g) => g.id === activeGroupId);

  // Add new variation group
  const handleAddVariationGroup = () => {
    const newId = `group-${Date.now()}`;
    const newGroup: VariationGroupConfig = {
      id: newId,
      name: `Variation ${variationGroups.length + 1}`,
      selectedFeatures: {},
    };
    setVariationGroups([...variationGroups, newGroup]);
    setActiveGroupId(newId);
    setSearchQuery("");
  };

  // Remove variation group
  const handleRemoveVariationGroup = (id: string) => {
    const updated = variationGroups.filter((g) => g.id !== id);
    setVariationGroups(updated);
    if (activeGroupId === id) {
      setActiveGroupId(updated[0]?.id || null);
    }
  };

  // Update group name
  const handleUpdateGroupName = (id: string, name: string) => {
    setVariationGroups(
      variationGroups.map((g) => (g.id === id ? { ...g, name } : g))
    );
  };

  // Toggle feature selection in active group
  const handleToggleFeature = (featureName: string) => {
    if (!activeGroup) return;

    const updated = { ...activeGroup.selectedFeatures };

    if (updated[featureName]) {
      delete updated[featureName];
    } else {
      updated[featureName] = [];
    }

    setVariationGroups(
      variationGroups.map((g) =>
        g.id === activeGroupId ? { ...g, selectedFeatures: updated } : g
      )
    );
  };

  // Toggle item selection in active group
  const handleToggleItem = (featureName: string, itemName: string) => {
    if (!activeGroup) return;

    const updated = { ...activeGroup.selectedFeatures };
    const items = updated[featureName] || [];

    if (items.includes(itemName)) {
      updated[featureName] = items.filter((i) => i !== itemName);
      if (updated[featureName].length === 0) {
        delete updated[featureName];
      }
    } else {
      updated[featureName] = [...items, itemName];
    }

    setVariationGroups(
      variationGroups.map((g) =>
        g.id === activeGroupId ? { ...g, selectedFeatures: updated } : g
      )
    );
  };

  // Select all items for a feature
  const handleSelectAllItems = (featureName: string) => {
    if (!activeGroup) return;

    const feature = allFeatures.find((f) => f.name === featureName);
    if (!feature) return;

    const updated = { ...activeGroup.selectedFeatures };
    updated[featureName] = feature.items.map((i) => i.name);

    setVariationGroups(
      variationGroups.map((g) =>
        g.id === activeGroupId ? { ...g, selectedFeatures: updated } : g
      )
    );
  };

  // Deselect all items for a feature
  const handleDeselectAllItems = (featureName: string) => {
    if (!activeGroup) return;

    const updated = { ...activeGroup.selectedFeatures };
    delete updated[featureName];

    setVariationGroups(
      variationGroups.map((g) =>
        g.id === activeGroupId ? { ...g, selectedFeatures: updated } : g
      )
    );
  };

  const handleContinue = () => {
    if (variationGroups.length === 0) {
      toast.error("Please create at least one variation group");
      return;
    }

    // Validate that each group has at least one feature selected
    const allValid = variationGroups.every(
      (g) => Object.keys(g.selectedFeatures).length > 0
    );

    if (!allValid) {
      toast.error("Each variation group must have at least one feature selected");
      return;
    }

    // Store configuration
    if (state.importedData) {
      setImportedData({
        ...state.importedData,
        features: allFeatures,
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
          Configure Variations
        </h2>
        <p className="text-muted-foreground">
          Define variation groups and select features for each group
        </p>
      </div>

      {/* Column Settings */}
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
              maxLength={2}
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
              maxLength={2}
            />
          </div>
        </div>
      </Card>

      {/* Variation Groups Tabs */}
      {variationGroups.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {variationGroups.map((group) => (
              <div key={group.id} className="relative">
                <button
                  onClick={() => setActiveGroupId(group.id)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    activeGroupId === group.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  {group.name}
                  <Badge variant="secondary" className="ml-2">
                    {Object.keys(group.selectedFeatures).length}
                  </Badge>
                </button>
                {variationGroups.length > 1 && (
                  <button
                    onClick={() => handleRemoveVariationGroup(group.id)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Variation Button */}
          <Button
            variant="outline"
            onClick={handleAddVariationGroup}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Variation Group
          </Button>
        </div>
      )}

      {/* Active Group Configuration */}
      {activeGroup && (
        <Card className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Variation Group Name
            </label>
            <Input
              value={activeGroup.name}
              onChange={(e) => handleUpdateGroupName(activeGroupId!, e.target.value)}
              placeholder="e.g., Base, Premium, Enterprise"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Search Features
            </label>
            <Input
              placeholder="Type to search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Features List */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Selected: {Object.keys(activeGroup.selectedFeatures).length} feature(s)
            </p>

            {filteredFeatures.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No features found
              </p>
            ) : (
              filteredFeatures.map((feature) => {
                const isSelected = activeGroup.selectedFeatures[feature.name];
                const selectedItems = isSelected || [];

                return (
                  <Card key={feature.name} className="p-4">
                    {/* Feature Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <Checkbox
                        checked={!!isSelected}
                        onCheckedChange={() => handleToggleFeature(feature.name)}
                      />
                      <h4 className="font-medium text-foreground flex-1">
                        {feature.name}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {selectedItems.length} / {feature.items.length}
                      </span>
                    </div>

                    {/* Items List */}
                    {isSelected && feature.items.length > 0 && (
                      <>
                        {/* Quick Actions */}
                        <div className="flex gap-2 mb-3 text-xs">
                          <button
                            onClick={() => handleSelectAllItems(feature.name)}
                            className="text-primary hover:underline"
                          >
                            Select All
                          </button>
                          <span className="text-muted-foreground">•</span>
                          <button
                            onClick={() => handleDeselectAllItems(feature.name)}
                            className="text-primary hover:underline"
                          >
                            Deselect All
                          </button>
                        </div>

                        {/* Items */}
                        <div className="ml-6 space-y-2">
                          {feature.items.map((item) => (
                            <div key={item.name} className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedItems.includes(item.name)}
                                onCheckedChange={() =>
                                  handleToggleItem(feature.name, item.name)
                                }
                              />
                              <span className="text-sm text-foreground">
                                {item.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {variationGroups.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No variation groups created yet
          </p>
          <Button onClick={handleAddVariationGroup}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Variation Group
          </Button>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setLocation("/")}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={variationGroups.length === 0}
        >
          Continue to Analysis
        </Button>
      </div>
    </div>
  );
}
