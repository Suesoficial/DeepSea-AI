import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { PipelineStage } from "@/types";

interface PipelineStatusProps {
  stages: PipelineStage[];
}

export default function PipelineStatus({ stages }: PipelineStatusProps) {
  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <i className="fas fa-check-circle text-green-600"></i>;
      case 'running':
        return <i className="fas fa-spinner fa-spin text-blue-600"></i>;
      case 'failed':
        return <i className="fas fa-exclamation-circle text-red-600"></i>;
      default:
        return <i className="fas fa-clock text-muted-foreground"></i>;
    }
  };

  const getStageStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  return (
    <Card data-testid="pipeline-status">
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-stream mr-2 text-accent"></i>
          Pipeline Execution Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stages.slice(0, 4).map((stage) => (
              <div
                key={stage.id}
                className={`pipeline-step p-4 border rounded-lg ${getStageStyle(stage.status)}`}
                data-testid={`pipeline-stage-${stage.stageNumber}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{stage.stageName}</span>
                  {getStageIcon(stage.status)}
                </div>
                <div className="w-full bg-muted-foreground/20 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      stage.status === 'completed' ? 'bg-green-600' :
                      stage.status === 'running' ? 'bg-blue-600' :
                      stage.status === 'failed' ? 'bg-red-600' : 'bg-muted-foreground'
                    }`}
                    style={{ width: `${stage.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stage.status === 'completed' && stage.duration
                    ? `Completed in ${stage.duration.toFixed(1)}s`
                    : stage.status === 'running'
                    ? 'Processing...'
                    : stage.status === 'failed'
                    ? 'Failed'
                    : 'Queued'
                  }
                </p>
              </div>
            ))}
          </div>
          
          {stages.length > 4 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {stages.slice(4).map((stage) => (
                <div
                  key={stage.id}
                  className={`text-center p-2 rounded ${
                    stage.status === 'completed' ? 'bg-green-100 text-green-800' :
                    stage.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    stage.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-muted/30 text-muted-foreground'
                  }`}
                  data-testid={`pipeline-stage-mini-${stage.stageNumber}`}
                >
                  {stage.stageName}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
