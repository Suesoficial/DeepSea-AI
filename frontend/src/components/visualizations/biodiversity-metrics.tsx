import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BiodiversityMetricsProps {
  metrics?: {
    shannonIndex: number;
    simpsonIndex: number;
    speciesRichness: number;
    novelTaxa: number;
  };
}

export default function BiodiversityMetrics({ metrics }: BiodiversityMetricsProps) {
  if (!metrics) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <i className="fas fa-chart-bar text-4xl mb-3"></i>
          <p>No diversity metrics available</p>
        </div>
      </div>
    );
  }

  const data = [
    {
      name: 'Shannon Index',
      value: metrics.shannonIndex,
      maxValue: 5,
      color: 'hsl(217, 91%, 35%)',
    },
    {
      name: 'Simpson Index',
      value: metrics.simpsonIndex,
      maxValue: 1,
      color: 'hsl(177, 70%, 30%)',
    },
    {
      name: 'Species Richness',
      value: metrics.speciesRichness,
      maxValue: Math.max(metrics.speciesRichness * 1.2, 500),
      color: 'hsl(25, 95%, 53%)',
    },
    {
      name: 'Novel Taxa',
      value: metrics.novelTaxa,
      maxValue: Math.max(metrics.novelTaxa * 1.5, 50),
      color: 'hsl(142, 76%, 36%)',
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-md">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">
            Value: {typeof data.value === 'number' && data.value < 10 
              ? data.value.toFixed(2) 
              : Math.round(data.value).toLocaleString()
            }
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" data-testid="biodiversity-metrics">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4">
        {data.map((metric, index) => (
          <div key={index} className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {metric.name}
              </span>
              <span 
                className="text-lg font-bold"
                style={{ color: metric.color }}
              >
                {typeof metric.value === 'number' && metric.value < 10 
                  ? metric.value.toFixed(2) 
                  : Math.round(metric.value).toLocaleString()
                }
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-1000"
                style={{
                  backgroundColor: metric.color,
                  width: `${Math.min((metric.value / metric.maxValue) * 100, 100)}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              animationBegin={0}
              animationDuration={1000}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
