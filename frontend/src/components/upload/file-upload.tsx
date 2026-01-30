import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "../../lib/utils";

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export default function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesChange([...files, ...acceptedFiles]);
  }, [files, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.fasta', '.fa', '.fas'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "drag-zone border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300",
        isDragActive && !isDragReject && "border-primary bg-primary/5",
        isDragReject && "border-red-500 bg-red-50",
        !isDragActive && "border-border hover:border-primary hover:bg-primary/5"
      )}
      data-testid="file-upload-zone"
    >
      <input {...getInputProps()} />
      <div className="space-y-3">
        <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground"></i>
        {isDragActive ? (
          isDragReject ? (
            <div>
              <p className="text-red-600 font-medium">Invalid file type</p>
              <p className="text-sm text-red-500">Only FASTA files (.fasta, .fa, .fas) are allowed</p>
            </div>
          ) : (
            <p className="text-primary font-medium">Drop your FASTA files here...</p>
          )
        ) : (
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Drop your FASTA files here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse files (max 100MB each)
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Supported formats: .fasta, .fa, .fas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
