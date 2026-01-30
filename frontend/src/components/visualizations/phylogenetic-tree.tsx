import { useEffect, useState } from "react";
import Tree from "react-d3-tree";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// Type definitions for react-d3-tree
interface RawNodeDatum {
  name: string;
  abundance?: number;
  confidence?: number;
  children?: RawNodeDatum[];
}

interface TreeNodeDatum extends RawNodeDatum {
  __rd3t?: {
    id: string;
    depth: number;
  };
}

interface PhylogeneticTreeProps {
  jobId: string;
}

export default function PhylogeneticTree({ jobId }: PhylogeneticTreeProps) {
  const [treeData, setTreeData] = useState<RawNodeDatum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTreeData = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/phylogeny`);
        if (!response.ok) {
          throw new Error('Failed to fetch phylogenetic data');
        }
        const data = await response.json();
        setTreeData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchTreeData();
    }
  }, [jobId]);

  const handleNodeClick = (nodeData: { data: TreeNodeDatum }) => {
    const node = nodeData.data;
    if (node.abundance || node.confidence) {
      alert(`${node.name}\nAbundance: ${node.abundance || 'N/A'}\nConfidence: ${node.confidence?.toFixed(3) || 'N/A'}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-project-diagram mr-2 text-green-600"></i>
            Phylogenetic Tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground"></i>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !treeData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-project-diagram mr-2 text-green-600"></i>
            Phylogenetic Tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <p>No phylogenetic data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-project-diagram mr-2 text-green-600"></i>
          Phylogenetic Tree
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full">
          <Tree
            data={treeData}
            orientation="vertical"
            translate={{ x: 200, y: 50 }}
            scaleExtent={{ min: 0.1, max: 3 }}
            zoom={0.8}
            nodeSize={{ x: 120, y: 80 }}
            separation={{ siblings: 1, nonSiblings: 2 }}
            onNodeClick={handleNodeClick}
            renderCustomNodeElement={({ nodeDatum, toggleNode }: { nodeDatum: TreeNodeDatum; toggleNode: () => void }) => (
              <g>
                <circle
                  r={8}
                  fill={nodeDatum.children ? "#3b82f6" : "#10b981"}
                  stroke="#1f2937"
                  strokeWidth={2}
                  onClick={toggleNode}
                  style={{ cursor: "pointer" }}
                />
                <text
                  fill="#1f2937"
                  strokeWidth="0"
                  x={15}
                  y={5}
                  fontSize="12"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleNodeClick({ data: nodeDatum })}
                >
                  {nodeDatum.name}
                </text>
                {nodeDatum.abundance && (
                  <text
                    fill="#6b7280"
                    strokeWidth="0"
                    x={15}
                    y={18}
                    fontSize="10"
                  >
                    {nodeDatum.abundance}
                  </text>
                )}
              </g>
            )}
          />
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>• Click nodes to view details • Drag to pan • Scroll to zoom</p>
        </div>
      </CardContent>
    </Card>
  );
}