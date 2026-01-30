export interface PipelineJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStage?: string;
  uploadedFiles: string[];
  parameters: {
    minSequenceLength: number;
    maxSequenceLength: number;
    clusteringMethod: string;
    qualityFiltering: boolean;
  };
  results?: {
    abundanceCsvPath?: string;
    taxonomyCsvPath?: string;
    diversityMetrics?: {
      shannonIndex: number;
      simpsonIndex: number;
      speciesRichness: number;
      novelTaxa: number;
    };
    taxonomicDistribution?: Array<{
      kingdom: string;
      phylum: string;
      class: string;
      family: string;
      genus: string;
      species: string;
      abundance: number;
      confidence: number;
    }>;
  };
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  jobId: string;
  stageName: string;
  stageNumber: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  metadata?: any;
}

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  jobId?: string;
  uploadedAt: string;
}

export interface JobWithDetails {
  job: PipelineJob;
  stages: PipelineStage[];
  files: UploadedFile[];
}
