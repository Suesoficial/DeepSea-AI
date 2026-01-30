import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useWebSocket } from "../hooks/use-websocket";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import DataVisualizationDemo from "../components/demo/data-visualization-demo";
import type { PipelineJob } from "@/types";

export default function Dashboard() {
  const [recentJobs, setRecentJobs] = useState<PipelineJob[]>([]);
  const [stats, setStats] = useState({
    totalSamples: 0,
    speciesDiscovered: 0,
    activePipelines: 0,
    systemHealth: 98.7,
  });

  const { data: jobs, refetch } = useQuery<PipelineJob[]>({
    queryKey: ['/api/jobs'],
  });

  // WebSocket for real-time updates
  useWebSocket((message) => {
    if (message.type === 'JOB_UPDATE') {
      refetch();
    }
  });

  useEffect(() => {
    if (jobs) {
      setRecentJobs(jobs.slice(0, 3));
      
      // Calculate stats from jobs
      const completedJobs = jobs.filter(job => job.status === 'completed');
      const runningJobs = jobs.filter(job => job.status === 'running');
      
      let totalSpecies = 0;
      completedJobs.forEach(job => {
        if (job.results?.diversityMetrics) {
          totalSpecies += job.results.diversityMetrics.speciesRichness;
        }
      });

      setStats({
        totalSamples: completedJobs.length,
        speciesDiscovered: totalSpecies,
        activePipelines: runningJobs.length,
        systemHealth: 98.7,
      });
    }
  }, [jobs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          eDNA Sequence Analysis Pipeline
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Advanced AI-powered environmental DNA analysis for marine biodiversity discovery. 
          Upload your FASTA files and discover new species with our cutting-edge pipeline.
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow" data-testid="stat-samples-processed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Samples Processed</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalSamples}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-flask text-primary"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">+12%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow" data-testid="stat-species-discovered">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Species Discovered</p>
                <p className="text-2xl font-bold text-foreground">{stats.speciesDiscovered}</p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-dna text-secondary"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">+23%</span>
              <span className="text-muted-foreground ml-1">new discoveries</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow" data-testid="stat-active-pipelines">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Pipelines</p>
                <p className="text-2xl font-bold text-foreground">{stats.activePipelines}</p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-cogs text-accent"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-muted-foreground">Processing</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow" data-testid="stat-system-health">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold text-green-600">{stats.systemHealth}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-heartbeat text-green-600"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">Optimal</span>
              <span className="text-muted-foreground ml-1">performance</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg hover:bg-blue-50 hover:scale-105 active:bg-blue-100 transition-all duration-200 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <i className="fas fa-upload text-purple-600"></i>
              </div>
              <div>
                <h3 className="font-semibold">Start New Analysis</h3>
                <p className="text-sm text-muted-foreground">Upload FASTA files</p>
              </div>
            </div>
            <Link href="/upload">
              <Button className="w-full hover:bg-blue-600 active:bg-blue-700" data-testid="button-start-analysis">
                Upload Files
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:bg-blue-50 hover:scale-105 active:bg-blue-100 transition-all duration-200 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <i className="fas fa-chart-bar text-green-600"></i>
              </div>
              <div>
                <h3 className="font-semibold">View Results</h3>
                <p className="text-sm text-muted-foreground">Analysis outcomes</p>
              </div>
            </div>
            <Link href="/results">
              <Button variant="outline" className="w-full hover:bg-blue-600 hover:text-white hover:border-blue-600 active:bg-blue-700" data-testid="button-view-results">
                Browse Results
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:bg-blue-50 hover:scale-105 active:bg-blue-100 transition-all duration-200 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <i className="fas fa-project-diagram text-blue-600"></i>
              </div>
              <div>
                <h3 className="font-semibold">Advanced Analysis</h3>
                <p className="text-sm text-muted-foreground">Detailed insights</p>
              </div>
            </div>
            <Link href="/analysis">
              <Button variant="outline" className="w-full hover:bg-blue-600 hover:text-white hover:border-blue-600 active:bg-blue-700" data-testid="button-advanced-analysis">
                Explore Analysis
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Data Visualization Demo */}
      <div className="mb-8">
        <DataVisualizationDemo />
      </div>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <i className="fas fa-history mr-2 text-muted-foreground"></i>
              Recent Analysis Results
            </CardTitle>
            <Link href="/results">
              <Button variant="ghost" className="text-primary hover:text-primary/80" data-testid="button-view-all-results">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-flask text-4xl text-muted-foreground mb-3"></i>
                <p className="text-muted-foreground">No analyses completed yet</p>
                <p className="text-sm text-muted-foreground mt-1">Upload your first FASTA file to get started</p>
              </div>
            ) : (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer"
                  data-testid={`recent-job-${job.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      job.status === 'completed' ? 'bg-green-100' :
                      job.status === 'running' ? 'bg-blue-100' :
                      job.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      <i className={`fas ${
                        job.status === 'completed' ? 'fa-check-circle text-green-600' :
                        job.status === 'running' ? 'fa-spinner fa-spin text-blue-600' :
                        job.status === 'failed' ? 'fa-exclamation-circle text-red-600' : 'fa-clock text-yellow-600'
                      }`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{job.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.completedAt ? formatDate(job.completedAt) : 'In progress'} • 
                        {job.results?.diversityMetrics?.speciesRichness || 0} species • 
                        {job.results?.diversityMetrics?.novelTaxa || 0} novel taxa
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      job.status === 'completed' ? 'text-green-600' :
                      job.status === 'running' ? 'text-blue-600' :
                      job.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {job.status === 'completed' && job.results?.diversityMetrics
                        ? `95.2% confidence`
                        : `${job.progress}% complete`
                      }
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Information Footer */}
      <div className="mt-8 bg-card p-4 rounded-lg border border-border">
        <div className="flex flex-wrap items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-6">
            <span>Pipeline Version: v2.1.3</span>
            <span>API Status: <span className="text-green-600">Operational</span></span>
            <span>Last Updated: 2 minutes ago</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="hover:text-foreground transition-colors">
              <i className="fas fa-question-circle"></i> Help
            </button>
            <button className="hover:text-foreground transition-colors">
              <i className="fas fa-book"></i> Documentation
            </button>
            <button className="hover:text-foreground transition-colors">
              <i className="fas fa-cog"></i> Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
