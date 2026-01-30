import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useState } from "react";
import TaxonomyChart from "../components/visualizations/taxonomy-chart";
import BiodiversityMetrics from "../components/visualizations/biodiversity-metrics";
import PhylogeneticTree from "../components/visualizations/phylogenetic-tree";
import ConversationalInterface from "../components/ai/conversational-interface";
import type { PipelineJob } from "@/types";

export default function Analysis() {
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  const { data: jobs } = useQuery<PipelineJob[]>({
    queryKey: ['/api/jobs'],
  });

  const completedJobs = jobs?.filter(job => job.status === 'completed' && job.results) || [];
  const selectedJob = completedJobs.find(job => job.id === selectedJobId) || completedJobs[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Advanced Analysis
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore detailed biodiversity insights and scientific visualizations from your eDNA analyses.
        </p>
      </div>

      {completedJobs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <i className="fas fa-chart-bar text-6xl text-muted-foreground mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">No Completed Analyses</h3>
            <p className="text-muted-foreground mb-6">
              Upload and analyze your eDNA sequences to unlock detailed biodiversity insights and visualizations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Analysis Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedJobId || completedJobs[0]?.id} onValueChange={setSelectedJobId}>
                <SelectTrigger className="w-full" data-testid="select-analysis">
                  <SelectValue placeholder="Choose an analysis to explore" />
                </SelectTrigger>
                <SelectContent>
                  {completedJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.name} • {job.results?.diversityMetrics?.speciesRichness || 0} species
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedJob && (
            <>
              {/* Analysis Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <i className="fas fa-dna text-primary text-xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {selectedJob.results?.diversityMetrics?.speciesRichness || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Species</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <i className="fas fa-star text-accent text-xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-accent">
                        {selectedJob.results?.diversityMetrics?.novelTaxa || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Novel Taxa</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <i className="fas fa-chart-line text-secondary text-xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-foreground font-mono">
                        {selectedJob.results?.diversityMetrics?.shannonIndex.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-sm text-muted-foreground">Shannon Index</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <i className="fas fa-balance-scale text-green-600 text-xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-foreground font-mono">
                        {selectedJob.results?.diversityMetrics?.simpsonIndex.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-sm text-muted-foreground">Simpson Index</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Taxonomic Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-chart-pie mr-2 text-chart-1"></i>
                      Taxonomic Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TaxonomyChart 
                      data={selectedJob.results?.taxonomicDistribution || []} 
                    />
                  </CardContent>
                </Card>

                {/* Biodiversity Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-chart-bar mr-2 text-chart-2"></i>
                      Biodiversity Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BiodiversityMetrics 
                      metrics={selectedJob.results?.diversityMetrics}
                    />
                  </CardContent>
                </Card>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <PhylogeneticTree jobId={selectedJob.id} />

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <i className="fas fa-globe-americas text-blue-600"></i>
                      </div>
                      <div>
                        <h3 className="font-semibold">Geospatial Mapping</h3>
                        <p className="text-sm text-muted-foreground">Global distribution analysis</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg h-16 flex items-center justify-center mb-3 relative overflow-hidden">
                      <i className="fas fa-map text-2xl text-blue-600"></i>
                      <div className="absolute top-2 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-2 left-4 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Conversational Interface */}
              <div className="mt-8">
                <ConversationalInterface selectedJob={selectedJob} />
              </div>
            </>
          )}
        </div>
      )}

      {/* AI Conversational Interface - Always Available at Bottom */}
      {completedJobs.length === 0 && (
        <div className="mt-8">
          <ConversationalInterface selectedJob={selectedJob} />
        </div>
      )}
    </div>
  );
}
