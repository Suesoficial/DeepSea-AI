#!/usr/bin/env node

/**
 * Data Seeding Script for DeepSea-AI
 * Seeds the database with existing processed data for visualization
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock database storage (in-memory for demo)
const mockJobs = [];
let jobIdCounter = 1;

function createMockJob(name, biodiversityData) {
  const job = {
    id: `job_${jobIdCounter++}`,
    name: name,
    status: 'completed',
    progress: 100,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    uploadedFiles: [`${name.toLowerCase().replace(/\s+/g, '-')}.fasta`],
    parameters: {
      minSequenceLength: 120,
      maxSequenceLength: 250,
      clusteringMethod: 'HDBSCAN',
      qualityFiltering: true
    },
    results: {
      abundanceCsvPath: 'data/processed/dedup_counts.csv',
      taxonomyCsvPath: 'data/processed/sequence_taxonomy.csv',
      diversityMetrics: biodiversityData.diversityMetrics,
      taxonomicDistribution: convertTaxonomicData(biodiversityData.taxonomicDistribution)
    }
  };
  
  mockJobs.push(job);
  return job;
}

function convertTaxonomicData(taxonomicData) {
  // Convert from {name, value} format to full taxonomic format
  const families = ['Sulfurimonadaceae', 'Campylobacteraceae', 'Psychromonadaceae', 'Arcobacteraceae', 'Puteibacteraceae'];
  
  return taxonomicData.map((item, index) => ({
    kingdom: 'Bacteria',
    phylum: 'Proteobacteria',
    class: 'Epsilonproteobacteria',
    family: families[index % families.length] || `${item.name}aceae`,
    genus: item.name,
    species: `${item.name} sp.`,
    abundance: item.value,
    confidence: 0.8 + Math.random() * 0.2
  }));
}

function seedData() {
  console.log('🌱 Seeding DeepSea-AI with processed data...');
  
  // Read existing biodiversity data
  const processedDir = path.join(__dirname, 'pipeline', 'data', 'processed');
  console.log('Looking for data in:', processedDir);
  
  try {
    // Seed data from analysis-test1
    const test1Path = path.join(processedDir, 'analysis-test1_processed', 'analysis-test1_biodiversity.json');
    console.log('Checking test1 path:', test1Path);
    if (fs.existsSync(test1Path)) {
      const test1Data = JSON.parse(fs.readFileSync(test1Path, 'utf-8'));
      createMockJob('Deep Sea Hydrothermal Vent Analysis', test1Data);
      console.log('✅ Seeded: Deep Sea Hydrothermal Vent Analysis');
    } else {
      console.log('❌ Test1 file not found');
    }
    
    // Seed data from analysis-test3
    const test3Path = path.join(processedDir, 'analysis-test3_processed', 'analysis-test3_biodiversity.json');
    console.log('Checking test3 path:', test3Path);
    if (fs.existsSync(test3Path)) {
      const test3Data = JSON.parse(fs.readFileSync(test3Path, 'utf-8'));
      createMockJob('Abyssal Plain Microbial Survey', test3Data);
      console.log('✅ Seeded: Abyssal Plain Microbial Survey');
    } else {
      console.log('❌ Test3 file not found');
    }
    
    // Create additional mock data for demonstration
    const mockData = {
      diversityMetrics: {
        speciesRichness: 45,
        novelTaxa: 8,
        shannonIndex: 2.34,
        simpsonIndex: 0.18
      },
      taxonomicDistribution: [
        { name: 'Alteromonas', value: 234 },
        { name: 'Pseudoalteromonas', value: 156 },
        { name: 'Vibrio', value: 89 },
        { name: 'Colwellia', value: 67 },
        { name: 'Shewanella', value: 45 },
        { name: 'Psychrobacter', value: 34 },
        { name: 'Others', value: 78 }
      ]
    };
    
    createMockJob('Antarctic Deep Water Sample', mockData);
    console.log('✅ Seeded: Antarctic Deep Water Sample');
    
    // Write seeded data to a JSON file for the backend to read
    const backendDir = path.join(__dirname, 'backend');
    if (!fs.existsSync(backendDir)) {
      fs.mkdirSync(backendDir, { recursive: true });
    }
    
    const seedFile = path.join(backendDir, 'seeded-data.json');
    fs.writeFileSync(seedFile, JSON.stringify(mockJobs, null, 2));
    
    console.log(`🎉 Successfully seeded ${mockJobs.length} analyses!`);
    console.log(`📁 Data written to: ${seedFile}`);
    
    return mockJobs;
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    return [];
  }
}

// Run if called directly
console.log('Script loaded, checking execution context...');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);

// Always run for now
seedData();

export { seedData };