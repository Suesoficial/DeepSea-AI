import { type PipelineJob, type InsertPipelineJob, type UploadedFile, type InsertUploadedFile, type PipelineStage, type InsertPipelineStage } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  // Pipeline Jobs
  createPipelineJob(job: InsertPipelineJob): Promise<PipelineJob>;
  getPipelineJob(id: string): Promise<PipelineJob | undefined>;
  getAllPipelineJobs(): Promise<PipelineJob[]>;
  updatePipelineJob(id: string, updates: Partial<PipelineJob>): Promise<PipelineJob | undefined>;
  
  // Uploaded Files
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  getUploadedFile(id: string): Promise<UploadedFile | undefined>;
  getFilesByJobId(jobId: string): Promise<UploadedFile[]>;
  
  // Pipeline Stages
  createPipelineStage(stage: InsertPipelineStage): Promise<PipelineStage>;
  getPipelineStagesByJobId(jobId: string): Promise<PipelineStage[]>;
  updatePipelineStage(id: string, updates: Partial<PipelineStage>): Promise<PipelineStage | undefined>;
}

export class MemStorage implements IStorage {
  private pipelineJobs: Map<string, PipelineJob> = new Map();
  private uploadedFiles: Map<string, UploadedFile> = new Map();
  private pipelineStages: Map<string, PipelineStage> = new Map();

  constructor() {
    this.loadSeededData();
  }

  private loadSeededData() {
    try {
      const seedFile = path.join(process.cwd(), 'backend', 'seeded-data.json');
      if (fs.existsSync(seedFile)) {
        const seededJobs = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
        seededJobs.forEach((job: PipelineJob) => {
          // Convert date strings back to Date objects
          job.createdAt = new Date(job.createdAt);
          job.startedAt = job.startedAt ? new Date(job.startedAt) : null;
          job.completedAt = job.completedAt ? new Date(job.completedAt) : null;
          this.pipelineJobs.set(job.id, job);
        });
        console.log(`📊 Loaded ${seededJobs.length} seeded analyses`);
      } else {
        console.log('📊 No seeded data found, starting with empty database');
      }
    } catch (error) {
      console.error('❌ Error loading seeded data:', error);
    }
  }

  // Pipeline Jobs
  async createPipelineJob(insertJob: InsertPipelineJob): Promise<PipelineJob> {
    const id = randomUUID();
    const job: PipelineJob = { 
      ...insertJob, 
      id, 
      status: insertJob.status || 'pending',
      progress: insertJob.progress || 0,
      currentStage: insertJob.currentStage || null,
      uploadedFiles: insertJob.uploadedFiles || [] as string[],
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      errorMessage: null,
      results: null
    };
    this.pipelineJobs.set(id, job);
    return job;
  }

  async getPipelineJob(id: string): Promise<PipelineJob | undefined> {
    return this.pipelineJobs.get(id);
  }

  async getAllPipelineJobs(): Promise<PipelineJob[]> {
    return Array.from(this.pipelineJobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updatePipelineJob(id: string, updates: Partial<PipelineJob>): Promise<PipelineJob | undefined> {
    const job = this.pipelineJobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, ...updates };
    this.pipelineJobs.set(id, updatedJob);
    return updatedJob;
  }

  // Uploaded Files
  async createUploadedFile(insertFile: InsertUploadedFile): Promise<UploadedFile> {
    const id = randomUUID();
    const file: UploadedFile = { 
      ...insertFile, 
      id,
      jobId: insertFile.jobId || null,
      uploadedAt: new Date() 
    };
    this.uploadedFiles.set(id, file);
    return file;
  }

  async getUploadedFile(id: string): Promise<UploadedFile | undefined> {
    return this.uploadedFiles.get(id);
  }

  async getFilesByJobId(jobId: string): Promise<UploadedFile[]> {
    return Array.from(this.uploadedFiles.values()).filter(file => file.jobId === jobId);
  }

  // Pipeline Stages
  async createPipelineStage(insertStage: InsertPipelineStage): Promise<PipelineStage> {
    const id = randomUUID();
    const stage: PipelineStage = { 
      ...insertStage, 
      id,
      progress: insertStage.progress || 0,
      status: insertStage.status || 'pending',
      startedAt: null,
      completedAt: null,
      duration: null,
      metadata: null
    };
    this.pipelineStages.set(id, stage);
    return stage;
  }

  async getPipelineStagesByJobId(jobId: string): Promise<PipelineStage[]> {
    return Array.from(this.pipelineStages.values())
      .filter(stage => stage.jobId === jobId)
      .sort((a, b) => a.stageNumber - b.stageNumber);
  }

  async updatePipelineStage(id: string, updates: Partial<PipelineStage>): Promise<PipelineStage | undefined> {
    const stage = this.pipelineStages.get(id);
    if (!stage) return undefined;
    
    const updatedStage = { ...stage, ...updates };
    this.pipelineStages.set(id, updatedStage);
    return updatedStage;
  }
}

export const storage = new MemStorage();

// Function to manually seed data
export function seedDatabase() {
  try {
    // Use dynamic import for ES modules
    import('../seed-data.js').then(({ seedData }) => {
      const jobs = seedData();
      console.log(`🌱 Seeded ${jobs.length} jobs into database`);
      return jobs;
    }).catch(error => {
      console.error('❌ Error seeding database:', error);
    });
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    return [];
  }
}
