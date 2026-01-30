# 🚀 DeepSea-AI Quick Start Guide

## Prerequisites Check ✅

Before starting, ensure you have:

1. **Node.js** (v18+) - Check with: `node --version`
2. **Python** (v3.8+) - Check with: `python --version`
3. **Git** (optional) - Check with: `git --version`

## Installation Steps

### Step 1: Install Dependencies
```bash
# Run the installation script
install-deps.bat
```

This script will:
- ✅ Install all Node.js dependencies (frontend + backend)
- ✅ Install Python dependencies for the ML pipeline
- ✅ Create necessary data directories
- ✅ Set up environment configuration

### Step 2: Configure Environment (Optional)
```bash
# Edit the .env file if needed
notepad .env
```

Default configuration works for local development. Only edit if you need:
- Custom ports
- AWS Bedrock AI features
- Database connections

### Step 3: Start the Application
```bash
# Start both frontend and backend
start-project.bat
```

This will open:
- **Frontend**: http://localhost:5173 (React app)
- **Backend**: http://localhost:5000 (API server)

## Using the Application

### 1. Upload FASTA Files
- Drag and drop your `.fasta`, `.fa`, or `.fas` files
- Supported file size: up to 100MB
- Multiple files can be uploaded

### 2. Configure Analysis
- Set sequence length filters (120-250 bp default)
- Choose clustering method (HDBSCAN recommended)
- Enable/disable quality filtering

### 3. Monitor Progress
- Real-time pipeline execution updates
- 10-stage analysis process
- Estimated completion times

### 4. Explore Results
- Interactive phylogenetic trees
- Biodiversity metrics dashboard
- Taxonomic distribution charts
- Novelty detection results

### 5. AI Assistant (Optional)
- Ask questions about your results
- Generate automated reports
- Get scientific insights

## Troubleshooting

### Common Issues:

**"Command not found" errors:**
- Ensure Node.js and Python are in your system PATH
- Restart command prompt after installation

**Port already in use:**
- Close other applications using ports 5000 or 5173
- Or edit .env to use different ports

**Python dependencies fail:**
- Try: `pip install --upgrade pip`
- Install Visual Studio Build Tools if on Windows
- Use conda instead: `conda install -c conda-forge <package>`

**Frontend won't load:**
- Clear browser cache
- Check browser console for errors
- Ensure no firewall blocking localhost

### Getting Help:

1. Check the terminal output for error messages
2. Verify all dependencies installed correctly
3. Ensure input files are valid FASTA format
4. Try restarting the application

## Next Steps

Once running successfully:

1. **Upload Sample Data**: Use the provided test files in `pipeline/data/raw/`
2. **Explore Features**: Try the AI assistant and visualization tools
3. **Read Documentation**: Check README.md for advanced usage
4. **Customize Pipeline**: Modify parameters for your specific needs

## File Structure

```
DeepSea-AI/
├── 📁 frontend/           # React web interface
├── 📁 backend/            # Node.js API server
├── 📁 pipeline/           # Python ML pipeline
│   ├── 📁 scripts/        # Analysis scripts
│   ├── 📁 data/           # Input/output data
│   └── 📁 models/         # ML models
├── 📄 .env               # Configuration
├── 🚀 install-deps.bat   # Installation script
└── 🚀 start-project.bat  # Startup script
```

## Success Indicators

You'll know everything is working when:
- ✅ Both servers start without errors
- ✅ Frontend loads at http://localhost:5173
- ✅ File upload interface is visible
- ✅ No red error messages in terminal

---

**Ready to analyze your eDNA data!** 🧬

Upload your FASTA files and discover the hidden biodiversity in your samples.