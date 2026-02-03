/**
 * Design Philosophy: Formal Minimal
 * - Simple file upload interface
 * - Drag & drop support
 * - Worksheet selection
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
import { Upload } from "lucide-react";
import {
  readExcelFile,
  readExcelSheet,
  getExcelSheetNames,
} from "@/lib/excelUtils";
import { extractFeatures } from "@/lib/variationUtils";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const { setImportedData, setSelectedSheet } = useProject();
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheetLocal] = useState<string>("F-List");
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFile(file);

    try {
      const sheetNames = await getExcelSheetNames(file);
      setSheets(sheetNames);

      // Auto-select F-List if exists, otherwise first sheet
      if (sheetNames.includes("F-List")) {
        setSelectedSheetLocal("F-List");
      } else {
        setSelectedSheetLocal(sheetNames[0]);
      }

      toast.success(`File loaded: ${file.name}`);
    } catch (error) {
      toast.error("Failed to read Excel file");
      console.error(error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.ms-excel.sheet.macroEnabled.12": [".xlsm"],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file || !selectedSheet) {
      toast.error("Please select a file and sheet");
      return;
    }

    setLoading(true);

    try {
      const data = await readExcelSheet(file, selectedSheet);
      const features = extractFeatures(data, {
        featureColumn: "M",
        itemColumn: "N",
        startRow: 19,
      });

      setImportedData({
        rawData: data,
        headers: data[0] || [],
        features,
        sheetName: selectedSheet,
      });

      setSelectedSheet(selectedSheet);

      toast.success("Data loaded successfully");
      setLocation("/configure");
    } catch (error) {
      toast.error("Failed to import data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-foreground">Upload Data</h2>
        <p className="text-muted-foreground">
          Select an Excel file to analyze variations
        </p>
      </div>

      {/* Upload Area */}
      <Card className="p-12 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <div
          {...getRootProps()}
          className={`text-center cursor-pointer ${
            isDragActive ? "opacity-60" : ""
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          {file ? (
            <div className="space-y-2">
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                Click or drag to replace
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-foreground">
                Drag and drop your Excel file here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Sheet Selection */}
      {sheets.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Select Worksheet
          </label>
          <Select value={selectedSheet} onValueChange={setSelectedSheetLocal}>
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

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          disabled={!file || !selectedSheet || loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || !selectedSheet || loading}
        >
          {loading ? "Loading..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
