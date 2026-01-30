# DeepSea-AI Pipeline

A comprehensive pipeline for analyzing environmental DNA (eDNA) sequences using deep learning and phylogenetic methods.

## 🚀 Quick Start (Windows)

### Prerequisites
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://www.python.org/)
- **Git** - [Download here](https://git-scm.com/)

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd DeepSea-AI-main
   ```

2. **Run the installation script**
   ```bash
   install-deps.bat
   ```
   This will:
   - Install all Node.js dependencies
   - Install Python dependencies
   - Create necessary directories
   - Set up environment configuration

3. **Configure environment (optional)**
   - Edit `.env` file for custom settings
   - Add AWS Bedrock credentials for AI features

4. **Start the application**
   ```bash
   start-project.bat
   ```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
./deepsea-ai/
├── frontend/          # React app (Vite + TypeScript)
├── backend/           # Node.js API server
├── pipeline/          # Python ML pipeline
│   ├── scripts/       # Pipeline scripts
│   ├── models/        # Pre-trained models
│   └── data/          # Raw and processed data
├── shared/            # Shared TypeScript schemas
├── docker-compose.yml # Container orchestration
└── README.md          # This file
```

## 🧬 Pipeline Features

### Core Analysis Pipeline
1. **Preprocessing & QC** - Quality filtering, trimming, deduplication
2. **K-mer Tokenization** - Convert sequences to k-mer features  
3. **Embeddings Generation** - Create dense representations using DNABERT or SVD
4. **VAE Clustering** - Unsupervised discovery using Variational Autoencoders
5. **Phylogenetic Visualization** - Build similarity graphs and phylogenetic trees
6. **Taxonomy Assignment** - Hybrid workflow with representative BLAST queries
7. **Report Generation** - Comprehensive analysis reports and visualizations

### Web Interface Features
- 📤 **File Upload**: Drag-and-drop FASTA file upload
- 📊 **Real-time Progress**: Live pipeline execution monitoring
- 🔬 **Results Visualization**: Interactive charts and phylogenetic trees
- 🤖 **AI Assistant**: Query your results with natural language
- 📋 **Report Generation**: Automated scientific reports
- 💾 **Data Export**: Download results in multiple formats

## 🔧 Usage

### Web Interface
1. Open http://localhost:5173
2. Upload your FASTA file
3. Configure analysis parameters
4. Monitor pipeline progress
5. Explore results and visualizations

### Command Line (Advanced)
```bash
# Single command execution
python pipeline/run_pipeline.py --input pipeline/data/raw/sample.fasta

# Advanced usage with options
python pipeline/run_pipeline.py --input sequences.fasta --output-dir processed --method transformer --device cuda --k 6
```

### Pipeline Options
- `--input`: Input FASTA/FASTQ file (required)
- `--output-dir`: Output directory (default: pipeline/data/processed)
- `--method`: Embedding method - transformer or svd (default: transformer)
- `--device`: Device for transformer - cpu or cuda (default: cpu)
- `--k`: K-mer size (default: 6)
- `--skip-stages`: Skip specific stages (e.g., --skip-stages 1 2)
- `--blast-db`: Local BLAST database path for taxonomy assignment
- `--online-blast`: Use online BLAST (slower but no local DB needed)

## 📊 Output Files

- `cleaned_sample.fasta` - Preprocessed sequences
- `dedup_counts.csv` - Sequence counts and metadata
- `embeddings.npy` - Dense sequence embeddings
- `clusters.csv` - Cluster assignments
- `novelty_scores.csv` - Novelty detection results
- `umap_2d.npy` - 2D projections for visualization
- `phylo_graph.json` - Similarity graph
- `phylo_simple.nwk` - Phylogenetic tree
- `phylo_tree_colored.png` - Tree visualization
- `cluster_taxonomy.csv` - Taxonomy assignments for cluster representatives
- `sequence_taxonomy.csv` - Full taxonomy mapping for all sequences
- `analysis_report.md` - Comprehensive analysis summary
- `taxonomy_abundance.png` - Taxonomic composition plots
- `novelty_analysis.png` - Novelty detection visualizations
- `phylogenetic_diversity.png` - Phylogenetic diversity plots

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access at http://localhost:80
```

## 🛠️ Development

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

### Backend (Node.js + TypeScript)
```bash
cd backend
npm install
npm run dev
```

### Python Pipeline
```bash
cd pipeline/scripts
pip install -r requirements.txt
python run_pipeline.py --help
```

## 🔍 Individual Stage Execution

You can run individual pipeline stages:

```bash
# Stage 1: Preprocessing
python pipeline/scripts/preprocess.py input.fasta output_dir

# Stage 2: Tokenization  
python pipeline/scripts/kmer_tokenize.py cleaned.fasta output_dir --k 6

# Stage 3: Embeddings
python pipeline/scripts/get_embeddings.py cleaned.fasta embeddings.npy --method transformer

# Stage 4: Clustering
python pipeline/scripts/vae_cluster.py

# Stage 5: Phylogenetics
python pipeline/scripts/phylo_vis.py

# Stage 6: Taxonomy Assignment
python pipeline/scripts/run_taxonomy.py --blast-db reference/16S_ribosomal_RNA

# Stage 7: Generate Reports
python pipeline/scripts/biodiversity_analysis.py
```

## 🤖 AI Features

The application includes an AI assistant powered by AWS Bedrock:

1. **Natural Language Queries**: Ask questions about your analysis results
2. **Automated Report Generation**: Generate scientific reports from your data
3. **Data Interpretation**: Get insights about biodiversity patterns

To enable AI features:
1. Set up AWS Bedrock access
2. Add your credentials to `.env` file:
   ```
   AWS_REGION=us-west-2
   AWS_BEARER_TOKEN_BEDROCK=your_token_here
   ```

## 🚨 Troubleshooting

### Common Issues

**Dependencies not installing:**
- Ensure Node.js and Python are in your PATH
- Run `install-deps.bat` as administrator
- Check internet connection for package downloads

**Pipeline fails to start:**
- Verify Python dependencies: `pip list`
- Check file permissions in data directories
- Ensure input FASTA files are valid

**Frontend not loading:**
- Check if port 5173 is available
- Clear browser cache
- Check console for JavaScript errors

**Backend API errors:**
- Verify port 5000 is available
- Check `.env` configuration
- Review backend logs for errors

### Getting Help

1. Check the logs in the terminal/command prompt
2. Verify all dependencies are installed correctly
3. Ensure input files are in the correct format
4. Check file permissions and disk space

## ✨ Features

- ✅ Robust error handling and validation
- ✅ Reproducible results with fixed random seeds
- ✅ Memory-efficient processing for large datasets
- ✅ Support for both CPU and GPU acceleration
- ✅ Comprehensive logging and progress tracking
- ✅ Flexible configuration options
- ✅ Web interface for pipeline management
- ✅ Real-time progress monitoring
- ✅ AI-powered analysis assistant
- ✅ Interactive data visualizations
- ✅ Automated report generation

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting pull requests.

---

**Need help?** Check the troubleshooting section above or create an issue in the repository.