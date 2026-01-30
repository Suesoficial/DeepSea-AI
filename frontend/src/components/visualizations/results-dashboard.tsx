import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import type { PipelineJob } from "@/types";

interface ResultsDashboardProps {
  job: PipelineJob;
  onDownload: (type: 'abundance' | 'taxonomy' | 'report') => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

export default function ResultsDashboard({ job, onDownload }: ResultsDashboardProps) {
  if (!job.results?.diversityMetrics || !job.results?.taxonomicDistribution) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <i className="fas fa-chart-bar text-6xl text-muted-foreground mb-4"></i>
          <h3 className="text-xl font-semibold mb-2">No Results Available</h3>
          <p className="text-muted-foreground">
            Analysis results will appear here once the pipeline completes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { diversityMetrics, taxonomicDistribution } = job.results;

  // Prepare data for charts
  const abundanceData = taxonomicDistribution
    .sort((a, b) => b.abundance - a.abundance)
    .slice(0, 10)
    .map(item => ({
      name: item.family,
      abundance: item.abundance,
      confidence: item.confidence
    }));

  const phylumData = taxonomicDistribution
    .reduce((acc, item) => {
      const existing = acc.find(p => p.name === item.phylum);
      if (existing) {
        existing.value += item.abundance;
      } else {
        acc.push({ name: item.phylum, value: item.abundance });
      }
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value);

  const diversityData = [
    { metric: 'Shannon Index', value: diversityMetrics.shannonIndex, max: 5 },
    { metric: 'Simpson Index', value: diversityMetrics.simpsonIndex, max: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Species Richness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{diversityMetrics.speciesRichness}</div>
            <p className="text-xs text-muted-foreground mt-1">Total species identified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Novel Taxa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{diversityMetrics.novelTaxa}</div>
            <p className="text-xs text-muted-foreground mt-1">Potential new species</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shannon Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{diversityMetrics.shannonIndex.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Diversity measure</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Simpson Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{diversityMetrics.simpsonIndex.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Dominance measure</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Species Abundance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-chart-bar mr-2 text-primary"></i>
              Top 10 Most Abundant Families
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={abundanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'abundance' ? `${value} sequences` : `${(value as number * 100).toFixed(1)}%`,
                    name === 'abundance' ? 'Abundance' : 'Confidence'
                  ]}
                />
                <Bar dataKey="abundance" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Phylogenetic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-chart-pie mr-2 text-secondary"></i>
              Phylogenetic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={phylumData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {phylumData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} sequences`, 'Abundance']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Diversity Metrics Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-chart-line mr-2 text-accent"></i>
            Diversity Indices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={diversityData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 'dataMax']} />
              <YAxis dataKey="metric" type="category" width={100} />
              <Tooltip formatter={(value) => [value.toFixed(3), 'Value']} />
              <Bar dataKey="value" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Taxonomic Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <i className="fas fa-table mr-2 text-primary"></i>
              Taxonomic Classification Results
            </span>
            <Badge variant="outline">{taxonomicDistribution.length} taxa</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Kingdom</th>
                  <th className="text-left p-2">Phylum</th>
                  <th className="text-left p-2">Class</th>
                  <th className="text-left p-2">Family</th>
                  <th className="text-left p-2">Genus</th>
                  <th className="text-left p-2">Species</th>
                  <th className="text-right p-2">Abundance</th>
                  <th className="text-right p-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {taxonomicDistribution.slice(0, 10).map((item, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2">{item.kingdom}</td>
                    <td className="p-2">{item.phylum}</td>
                    <td className="p-2">{item.class}</td>
                    <td className="p-2 font-medium">{item.family}</td>
                    <td className="p-2 text-muted-foreground">{item.genus}</td>
                    <td className="p-2 text-muted-foreground">{item.species}</td>
                    <td className="p-2 text-right font-mono">{item.abundance}</td>
                    <td className="p-2 text-right">
                      <Badge variant={item.confidence > 0.8 ? "default" : "secondary"}>
                        {(item.confidence * 100).toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {taxonomicDistribution.length > 10 && (
              <div className="text-center py-4 text-muted-foreground">
                ... and {taxonomicDistribution.length - 10} more taxa
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Download Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-download mr-2 text-accent"></i>
            Download Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => onDownload('abundance')}
              className="w-full"
            >
              <i className="fas fa-file-csv mr-2"></i>
              Abundance Data (CSV)
            </Button>
            <Button
              variant="outline"
              onClick={() => onDownload('taxonomy')}
              className="w-full"
            >
              <i className="fas fa-file-csv mr-2"></i>
              Taxonomy Data (CSV)
            </Button>
            <Button
              variant="outline"
              onClick={() => onDownload('report')}
              className="w-full"
            >
              <i className="fas fa-file-alt mr-2"></i>
              Full Report (TXT)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}