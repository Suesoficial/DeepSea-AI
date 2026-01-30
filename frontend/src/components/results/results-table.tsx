import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";

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

interface ResultsTableProps {
  data: TaxonomicData[];
  maxRows?: number;
}

export default function ResultsTable({ data, maxRows = 10 }: ResultsTableProps) {
  const displayData = data.slice(0, maxRows);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge variant="default">High</Badge>;
    if (confidence >= 0.7) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="outline">Low</Badge>;
  };

  return (
    <div className="rounded-md border" data-testid="results-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Species</TableHead>
            <TableHead>Family</TableHead>
            <TableHead>Class</TableHead>
            <TableHead className="text-right">Abundance</TableHead>
            <TableHead className="text-center">Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No taxonomic data available
              </TableCell>
            </TableRow>
          ) : (
            displayData.map((item, index) => (
              <TableRow key={index} data-testid={`table-row-${index}`}>
                <TableCell className="font-medium">
                  <div>
                    <p className="font-medium">{item.genus} {item.species}</p>
                    <p className="text-xs text-muted-foreground italic">
                      {item.genus} {item.species}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{item.family}</TableCell>
                <TableCell>{item.class}</TableCell>
                <TableCell className="text-right font-mono">
                  {item.abundance.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  {getConfidenceBadge(item.confidence)}
                  <div className="text-xs text-muted-foreground mt-1">
                    {(item.confidence * 100).toFixed(1)}%
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {data.length > maxRows && (
        <div className="p-4 text-center text-sm text-muted-foreground border-t">
          Showing {maxRows} of {data.length} species. Download full results for complete data.
        </div>
      )}
    </div>
  );
}
