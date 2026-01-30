import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { PipelineJob } from "@/types";

const COLORS = [
  'hsl(217, 91%, 35%)',
  'hsl(177, 70%, 30%)',
  'hsl(25, 95%, 53%)',
  'hsl(142, 76%, 36%)',
  'hsl(262, 83%, 58%)',
  'hsl(31, 81%, 56%)',
  'hsl(349, 89%, 60%)',
  'hsl(142, 69%, 58%)',
];

export default function DataVisualizationDemo() {
  const { data: jobs, isLoading, error } = useQuery<PipelineJob[]>({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-muted-foreground mb-4"></i>
          <p className="text-lg">Loading analysis data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <p className="text-lg text-red-600">Error loading data: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const completedJobs = jobs?.filter(job => job.status === 'completed' && job.results) || [];

  if (completedJobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <i className="fas fa-database text-4xl text-muted-foreground mb-4"></i>
          <p className="text-lg">No completed analyses found</p>
          <p className="text-sm text-muted-foreground">Run the seeding script to populate with demo data</p>
        </CardContent>
      </Card>
    );
  }

  // Aggregate diversity metrics across all jobs
  const diversityData = completedJobs.map(job => ({
    name: job.name.split(' ').slice(0, 2).join(' '), // Shorten names
    speciesRichness: job.results?.diversityMetrics?.speciesRichness || 0,
    novelTaxa: job.results?.diversityMetrics?.novelTaxa || 0,
    shannonIndex: job.results?.diversityMetrics?.shannonIndex || 0,
  }));

  // Get taxonomic data from the first job for pie chart
  const firstJob = completedJobs[0];
  const taxonomicData = firstJob.results?.taxonomicDistribution?.slice(0, 6).map(item => ({
    name: item.genus || item.name || 'Unknown',
    value: item.abundance || item.value || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">🧬 Live Data Visualization Demo</h2>
        <p className="text-muted-foreground">
          Showing {completedJobs.length} completed eDNA analyses with real-time data fetching
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {completedJobs.reduce((sum, job) => sum + (job.results?.diversityMetrics?.speciesRichness || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Species</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">
              {completedJobs.reduce((sum, job) => sum + (job.results?.diversityMetrics?.novelTaxa || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Novel Taxa</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary">
              {completedJobs.length}
            </div>
            <div className="text-sm text-muted-foreground">Analyses</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {(completedJobs.reduce((sum, job) => sum + (job.results?.diversityMetrics?.shannonIndex || 0), 0) / completedJobs.length).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Shannon Index</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diversity Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-chart-bar mr-2 text-chart-1"></i>
              Species Diversity Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diversityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="speciesRichness" fill="hsl(217, 91%, 35%)" name="Species Richness" />
                  <Bar dataKey="novelTaxa" fill="hsl(25, 95%, 53%)" name="Novel Taxa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Taxonomic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-chart-pie mr-2 text-chart-2"></i>
              Taxonomic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taxonomicData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {taxonomicData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-table mr-2 text-chart-3"></i>
            Analysis Results Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Analysis Name</th>
                  <th className="text-right p-2">Species</th>
                  <th className="text-right p-2">Novel Taxa</th>
                  <th className="text-right p-2">Shannon Index</th>
                  <th className="text-right p-2">Simpson Index</th>
                </tr>
              </thead>
              <tbody>
                {completedJobs.map((job) => (
                  <tr key={job.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{job.name}</td>
                    <td className="p-2 text-right">{job.results?.diversityMetrics?.speciesRichness || 0}</td>
                    <td className="p-2 text-right text-accent font-semibold">
                      {job.results?.diversityMetrics?.novelTaxa || 0}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {job.results?.diversityMetrics?.shannonIndex?.toFixed(3) || '0.000'}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {job.results?.diversityMetrics?.simpsonIndex?.toFixed(3) || '0.000'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}