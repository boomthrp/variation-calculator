/**
 * Design Philosophy: Formal Minimal
 * - Centralized state management
 * - Type-safe context API
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import type {
  Configuration,
  ImportedData,
  VariationAnalysis,
  ProjectState,
} from "@/lib/types";

interface ProjectContextType {
  state: ProjectState;
  setConfiguration: (config: Configuration) => void;
  setImportedData: (data: ImportedData) => void;
  setVariationAnalysis: (analysis: VariationAnalysis) => void;
  setSelectedSheet: (sheet: string) => void;
  resetProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const initialState: ProjectState = {
  configuration: null,
  importedData: null,
  variationAnalysis: null,
  selectedSheet: "F-List",
};

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProjectState>(initialState);

  const setConfiguration = useCallback((config: Configuration) => {
    setState((prev) => ({ ...prev, configuration: config }));
  }, []);

  const setImportedData = useCallback((data: ImportedData) => {
    setState((prev) => ({ ...prev, importedData: data }));
  }, []);

  const setVariationAnalysis = useCallback((analysis: VariationAnalysis) => {
    setState((prev) => ({ ...prev, variationAnalysis: analysis }));
  }, []);

  const setSelectedSheet = useCallback((sheet: string) => {
    setState((prev) => ({ ...prev, selectedSheet: sheet }));
  }, []);

  const resetProject = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        state,
        setConfiguration,
        setImportedData,
        setVariationAnalysis,
        setSelectedSheet,
        resetProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }
  return context;
}
