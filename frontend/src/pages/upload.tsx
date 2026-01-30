import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { useToast } from "../hooks/use-toast";
import { createPipelineJob } from "../lib/api";
import FileUpload from "../components/upload/file-upload";
import { useLocation } from "wouter";

export default function Upload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: `Analysis ${new Date().toISOString().split('T')[0]}`,
    minSequenceLength: 120,
    maxSequenceLength: 250,
    clusteringMethod: 'HDBSCAN',
    qualityFiltering: true,
  });
  
  const [files, setFiles] = useState<File[]>([]);

  const createJobMutation = useMutation({
    mutationFn: createPipelineJob,
    onSuccess: (job) => {
      toast({
        title: "Analysis Started",
        description: `Pipeline ${job.name} has been started successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one FASTA file to upload.",
        variant: "destructive",
      });
      return;
    }

    createJobMutation.mutate({
      ...formData,
      files,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Upload FASTA Files
        </h1>
        <p className="text-lg text-muted-foreground">
          Configure your analysis parameters and upload your environmental DNA sequence files.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* File Upload Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-upload mr-2 text-primary"></i>
                File Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload files={files} onFilesChange={setFiles} />
              
              {files.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Selected Files</h4>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                        data-testid={`selected-file-${index}`}
                      >
                        <div className="flex items-center space-x-3">
                          <i className="fas fa-file-alt text-primary"></i>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                          data-testid={`remove-file-${index}`}
                        >
                          <i className="fas fa-times text-red-500"></i>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuration Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-sliders-h mr-2 text-secondary"></i>
                Pipeline Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name">Analysis Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter analysis name"
                  data-testid="input-analysis-name"
                />
              </div>

              <div>
                <Label>Sequence Length Range</Label>
                <div className="mt-2 space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Min Length: {formData.minSequenceLength} bp
                    </Label>
                    <Slider
                      value={[formData.minSequenceLength]}
                      onValueChange={([value]) =>
                        setFormData({ ...formData, minSequenceLength: value })
                      }
                      min={100}
                      max={200}
                      step={10}
                      data-testid="slider-min-length"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Max Length: {formData.maxSequenceLength} bp
                    </Label>
                    <Slider
                      value={[formData.maxSequenceLength]}
                      onValueChange={([value]) =>
                        setFormData({ ...formData, maxSequenceLength: value })
                      }
                      min={200}
                      max={400}
                      step={10}
                      data-testid="slider-max-length"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="clustering">Clustering Method</Label>
                <Select
                  value={formData.clusteringMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clusteringMethod: value })
                  }
                >
                  <SelectTrigger data-testid="select-clustering-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HDBSCAN">HDBSCAN</SelectItem>
                    <SelectItem value="K-means">K-means</SelectItem>
                    <SelectItem value="GMM">Gaussian Mixture Model</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="quality-filtering">Quality Filtering</Label>
                  <p className="text-sm text-muted-foreground">
                    Remove low-quality sequences
                  </p>
                </div>
                <Switch
                  id="quality-filtering"
                  checked={formData.qualityFiltering}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, qualityFiltering: checked })
                  }
                  data-testid="switch-quality-filtering"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pipeline Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Duration:</span>
                  <span className="font-medium">5-15 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pipeline Stages:</span>
                  <span className="font-medium">10 stages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Output Files:</span>
                  <span className="font-medium">2 CSV files</span>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full mt-6 active:bg-blue-600 active:border-blue-600"
                disabled={files.length === 0 || createJobMutation.isPending}
                data-testid="button-start-pipeline"
              >
                {createJobMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Starting Pipeline...
                  </>
                ) : (
                  <>
                    <i className="fas fa-play mr-2"></i>
                    Start Analysis Pipeline
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
