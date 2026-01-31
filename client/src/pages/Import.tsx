/**
 * Design Philosophy: Technical Command Center
 * - File upload with drag & drop
 * - Sheet selection interface
 * - Data preview table
 */

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import {
  readExcelFile,
  readExcelSheet,
  getExcelSheetNames,
  parseConfiguration,
  createDefaultConfiguration,
} from "@/lib/excelUtils";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";

export default function Import() {
  const [, setLocation] = useLocation();
  const { setConfiguration, setImportedData } = useProject();
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [configFile, setConfigFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Dropzone for main data file
  const onDropData = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFile(file);

    try {
      const sheetNames = await getExcelSheetNames(file);
      setSheets(sheetNames);

      // Auto-select "F-List" if exists
      if (sheetNames.includes("F-List")) {
        setSelectedSheet("F-List");
      } else {
        setSelectedSheet(sheetNames[0]);
      }

      toast.success(`FILE LOADED: ${file.name}`);
    } catch (error) {
      toast.error("ERROR: Failed to read Excel file");
      console.error(error);
    }
  }, []);

  const { getRootProps: getRootPropsData, getInputProps: getInputPropsData, isDragActive: isDragActiveData } =
    useDropzone({
      onDrop: onDropData,
      accept: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.ms-excel.sheet.macroEnabled.12": [".xlsm"],
      },
      multiple: false,
    });

  // Dropzone for configuration file
  const onDropConfig = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setConfigFile(file);

    try {
      const data = await readExcelSheet(file, "Configuration");
      const config = parseConfiguration(data);
      setConfiguration(config);
      toast.success(`CONFIG LOADED: ${file.name}`);
    } catch (error) {
      toast.error("ERROR: Failed to read configuration");
      console.error(error);
    }
  }, [setConfiguration]);

  const { getRootProps: getRootPropsConfig, getInputProps: getInputPropsConfig, isDragActive: isDragActiveConfig } =
    useDropzone({
      onDrop: onDropConfig,
      accept: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.ms-excel.sheet.macroEnabled.12": [".xlsm"],
      },
      multiple: false,
    });

  const handleUseDefaultConfig = () => {
    const defaultConfig = createDefaultConfiguration();
    setConfiguration(defaultConfig);
    setConfigFile(null);
    toast.success("DEFAULT CONFIG LOADED");
  };

  const handleImport = async () => {
    if (!file || !selectedSheet) {
      toast.error("ERROR: Please select a file and sheet");
      return;
    }

    setLoading(true);

    try {
      const data = await readExcelSheet(file, selectedSheet);

      setImportedData({
        configuration: createDefaultConfiguration(),
        rawData: data,
        headers: data[0] || [],
      });

      toast.success("DATA IMPORTED SUCCESSFULLY");
      setLocation("/configure");
    } catch (error) {
      toast.error("ERROR: Failed to import data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary glow-cyan">
          [IMPORT DATA]
        </h1>
        <p className="text-muted-foreground">
          Upload Excel files and configure data sources
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration File */}
        <Card className="p-6 space-y-4 bg-card border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              [1] CONFIGURATION
            </h2>
            {configFile && (
              <CheckCircle2 className="w-5 h-5 text-lime-400 glow-lime" />
            )}
          </div>

          <div
            {...getRootPropsConfig()}
            className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all duration-150 ${
              isDragActiveConfig
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputPropsConfig()} />
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {configFile ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-primary">{configFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  Click or drag to replace
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  Drop configuration file here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse
                </p>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleUseDefaultConfig}
          >
            USE DEFAULT CONFIG
          </Button>
        </Card>

        {/* Data File */}
        <Card className="p-6 space-y-4 bg-card border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">[2] DATA FILE</h2>
            {file && (
              <CheckCircle2 className="w-5 h-5 text-lime-400 glow-lime" />
            )}
          </div>

          <div
            {...getRootPropsData()}
            className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all duration-150 ${
              isDragActiveData
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputPropsData()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {file ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-primary">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  Click or drag to replace
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-foreground">Drop Excel file here</p>
                <p className="text-xs text-muted-foreground">
                  or click to browse
                </p>
              </div>
            )}
          </div>

          {sheets.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                SELECT SHEET:
              </label>
              <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sheets.map((sheet) => (
                    <SelectItem key={sheet} value={sheet}>
                      {sheet}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </Card>
      </div>

      {/* Import Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleImport}
          disabled={!file || !selectedSheet || loading}
          className="min-w-[200px] font-bold"
        >
          {loading ? "IMPORTING..." : "IMPORT DATA →"}
        </Button>
      </div>
    </div>
  );
}
