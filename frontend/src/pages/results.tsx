import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useWebSocket } from "../hooks/use-websocket";
import { getAllJobs, downloadJobResults } from "../lib/api";
import { useToast } from "../hooks/use-toast";
import ResultsDashboard from "../components/visualizations/results-dashboard";
import type { PipelineJob } from "@/types";

export default function Results() {
  const { toast } = useToast();
  
  const { data: jobs, refetch } = useQuery<PipelineJob[]>({
    queryKey: ['/api/jobs'],
    queryFn: getAllJobs,
  });

  // WebSocket for real-time updates
  useWebSocket((message) => {
    if (message.type === 'JOB_UPDATE') {
      refetch();
    }
  });

  const handleDownload = async (jobId: string, type: 'abundance' | 'taxonomy' | 'report') => {
    try {
      await downloadJobResults(jobId, type);
      toast({
        title: "Download Started",
        description: `${type} results are being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      running: "secondary",
      completed: "default",
      failed: "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "outline"} data-testid={`badge-status-${status}`}>
        {status === 'running' && <i className="fas fa-spinner fa-spin mr-1"></i>}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt || !completedAt) return "—";
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (!jobs) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground"></i>
        </div>
      </div>
    );
  }

  const completedJobs = jobs.filter(job => job.status === 'completed');
  const runningJobs = jobs.filter(job => job.status === 'running');
  const otherJobs = jobs.filter(job => !['completed', 'running'].includes(job.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Analysis Results
        </h1>
        <p className="text-lg text-muted-foreground">
          View and download results from your eDNA sequence analyses.
        </p>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <i className="fas fa-flask text-6xl text-muted-foreground mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">No Analyses Yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload your first FASTA file to start analyzing eDNA sequences.
            </p>
            <Button onClick={() => window.location.href = '/upload'}>
              <i className="fas fa-upload mr-2"></i>
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      ) : completedJobs.length === 0 && runningJobs.length === 0 && otherJobs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <i className="fas fa-spinner fa-spin text-6xl text-muted-foreground mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">Processing Analyses</h3>
            <p className="text-muted-foreground">
              Your analyses are being processed. Results will appear here shortly.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Completed Jobs with Full Results */}
          {completedJobs.map((job) => (
            <div key={job.id} className="space-y-6">
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <i className="fas fa-check-circle text-green-600 mr-2"></i>
                      {job.name}
                    </CardTitle>
                    {getStatusBadge(job.status)}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Completed: {formatDate(job.completedAt!)}</span>
                    <span>Duration: {formatDuration(job.startedAt || undefined, job.completedAt!)}</span>
                    <span>{job.uploadedFiles.length} files</span>
                  </div>
                </CardHeader>
              </Card>
              
              <ResultsDashboard 
                job={job} 
                onDownload={(type) => handleDownload(job.id, type)}
              />
            </div>
          ))}

          {/* Running Jobs */}
          {runningJobs.map((job) => (
            <Card key={job.id} className="border-blue-200 bg-blue-50/50" data-testid={`job-card-${job.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-cog fa-spin text-blue-600 mr-2"></i>
                    {job.name}
                  </CardTitle>
                  {getStatusBadge(job.status)}
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Started: {formatDate(job.startedAt!)}</span>
                  <span>{job.uploadedFiles.length} files</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Current Stage:</span>
                      <span className="font-medium">{job.currentStage}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="progress-bar h-3 rounded-full transition-all duration-500"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      {job.progress}% complete
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Other Jobs (Pending/Failed) */}
          {otherJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow" data-testid={`job-card-${job.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{job.name}</CardTitle>
                  {getStatusBadge(job.status)}
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Created: {formatDate(job.createdAt)}</span>
                  <span>{job.uploadedFiles.length} files</span>
                </div>
              </CardHeader>
              <CardContent>
                {job.status === 'failed' ? (
                  <div className="text-sm text-red-600">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {job.errorMessage || "Analysis failed"}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    <i className="fas fa-clock mr-2"></i>
                    Waiting to start...
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
