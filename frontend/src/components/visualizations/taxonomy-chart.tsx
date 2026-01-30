import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TaxonomicData {
  kingdom: string;
  phylum: string;
  class: string;
  family: string;
  genus: string;
  species: string;
  abundance: number;
  confidence: number;
}

interface TaxonomyChartProps {
  data: TaxonomicData[];
}

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

export default function TaxonomyChart({ data }: TaxonomyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <i className="fas fa-chart-pie text-4xl mb-3"></i>
          <p>No taxonomic data available</p>
        </div>
      </div>
    );
  }

  // Aggregate data by family for the pie chart
  const familyData = data.reduce((acc: Record<string, number>, item) => {
    acc[item.family] = (acc[item.family] || 0) + item.abundance;
    return acc;
  }, {});

  const chartData = Object.entries(familyData)
    .map(([family, abundance]) => ({
      name: family,
      value: abundance,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 families

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-md">
          <p className="font-semibold">{data.payload.name}</p>
          <p className="text-sm text-muted-foreground">
            Abundance: {data.value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64" data-testid="taxonomy-chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => (
              <span className="text-sm">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
