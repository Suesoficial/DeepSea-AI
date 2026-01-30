const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const HEALTH_CHECK_ENABLED = import.meta.env.VITE_HEALTH_CHECK_ENABLED !== 'false';

export type ConnectionState = 'online' | 'offline' | 'error' | 'checking';

// API Health Check with environment awareness
export async function checkApiHealth(): Promise<boolean> {
  if (!HEALTH_CHECK_ENABLED || DEMO_MODE) {
    return false; // Gracefully offline in demo mode
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      credentials: 'include',
      signal: AbortSignal.timeout(3000), // Reduced timeout
    });
    return response.ok;
  } catch (error) {
    if (DEV_MODE) {
      console.warn('API health check failed (dev mode):', error);
    }
    return false;
  }
}

// Mock data for demo mode
const mockJobs = [
  {
    id: 'demo-1',
    name: 'Demo Analysis',
    status: 'completed',
    progress: 100,
    results: {
      diversityMetrics: {
        speciesRichness: 89,
        shannonIndex: 3.45,
        simpsonIndex: 0.89,
        novelTaxa: 12
      }
    }
  }
];

// Get all jobs with demo mode support
export async function getAllJobs() {
  if (DEMO_MODE) {
    return mockJobs;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      credentials: 'include',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please check if the backend server is running');
    }
    throw error;
  }
}

export interface CreateJobData {
  name: string;
  minSequenceLength: number;
  maxSequenceLength: number;
  clusteringMethod: string;
  qualityFiltering: boolean;
  files: File[];
}

export async function createPipelineJob(data: CreateJobData) {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('minSequenceLength', data.minSequenceLength.toString());
  formData.append('maxSequenceLength', data.maxSequenceLength.toString());
  formData.append('clusteringMethod', data.clusteringMethod);
  formData.append('qualityFiltering', data.qualityFiltering.toString());
  
  data.files.forEach((file) => {
    formData.append('files', file);
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upload failed: ${response.status} ${text}`);
    }

    const result = await response.json();
    console.log('✅ Job created successfully:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Job creation failed:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Upload timeout - please check your connection and try again');
    }
    throw error;
  }
}

// Get job results
export async function getJobResults(jobId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/results/${jobId}`, {
      credentials: 'include',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Results not available yet');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
}

export async function downloadJobResults(jobId: string, type: 'abundance' | 'taxonomy' | 'report') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/download/${type}`, {
      credentials: 'include',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status}: ${text}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    const extension = type === 'report' ? 'txt' : 'csv';
    a.download = `${type}_results.${extension}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Download timeout - please try again');
    }
    throw error;
  }
}
