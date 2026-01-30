# DeepSea-AI Data Visualization Setup

## 🚀 Quick Start with Data Visualization

This setup enables the DeepSea-AI application to fetch processed data and display interactive visualizations.

### 1. Start the Application with Data

```bash
# Run the complete setup script
start-with-data.bat
```

This script will:
- ✅ Seed the database with processed eDNA analysis data
- 🔧 Start the backend server (port 5000)
- 🎨 Start the frontend development server (port 5173)

### 2. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

### 3. What You'll See

The application now includes:

#### Dashboard (/)
- **Live Data Visualization Demo**: Real-time charts showing:
  - Species diversity comparison across analyses
  - Taxonomic distribution pie charts
  - Summary statistics cards
  - Detailed results table
- **System Status**: Active pipelines, species discovered, system health
- **Recent Results**: Latest completed analyses

#### Results Page (/results)
- **Analysis Cards**: Each completed analysis with:
  - Diversity metrics (Shannon Index, Simpson Index)
  - Species richness and novel taxa counts
  - Download options for CSV files and reports
- **Real-time Updates**: WebSocket connection for live progress

#### Analysis Page (/analysis)
- **Advanced Visualizations**:
  - Interactive taxonomic distribution charts
  - Biodiversity metrics comparisons
  - Phylogenetic tree visualizations
  - AI-powered conversational interface

### 4. Sample Data Included

The seeded data includes 3 completed analyses:
1. **Deep Sea Hydrothermal Vent Analysis** - 31 species, 3 novel taxa
2. **Abyssal Plain Microbial Survey** - 24 species, 22 novel taxa  
3. **Antarctic Deep Water Sample** - 45 species, 8 novel taxa

### 5. Data Flow Architecture

```
Frontend (React + TypeScript)
    ↓ HTTP/WebSocket
Backend (Node.js + Express)
    ↓ File System
Processed Data (JSON/CSV files)
    ↓ Python Pipeline
Raw FASTA Files
```

### 6. Key Features Demonstrated

- ✅ **Real-time Data Fetching**: React Query for API calls
- ✅ **Interactive Charts**: Recharts for visualizations
- ✅ **Live Updates**: WebSocket for real-time progress
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Data Export**: CSV and report downloads
- ✅ **AI Integration**: Conversational analysis interface

### 7. API Endpoints

- `GET /api/jobs` - Fetch all pipeline jobs
- `GET /api/jobs/:id` - Get specific job details
- `GET /api/jobs/:id/phylogeny` - Get phylogenetic tree data
- `GET /api/jobs/:id/download/:type` - Download results
- `POST /api/jobs` - Create new analysis job

### 8. File Structure

```
frontend/src/
├── components/
│   ├── demo/
│   │   └── data-visualization-demo.tsx  # Main demo component
│   ├── visualizations/
│   │   ├── taxonomy-chart.tsx           # Pie charts
│   │   ├── biodiversity-metrics.tsx     # Metrics display
│   │   └── phylogenetic-tree.tsx        # Tree visualization
│   └── ui/                              # UI components
├── pages/
│   ├── dashboard.tsx                    # Main dashboard
│   ├── results.tsx                      # Results page
│   └── analysis.tsx                     # Advanced analysis
└── hooks/
    └── use-websocket.ts                 # WebSocket hook

backend/
├── routes.ts                            # API routes
├── storage.ts                           # Data storage
├── seeded-data.json                     # Demo data
└── index.ts                             # Server entry

pipeline/data/processed/                 # Processed analysis data
```

### 9. Troubleshooting

**No data showing?**
- Run `node seed-data.js` to populate demo data
- Check backend console for loading messages
- Verify `backend/seeded-data.json` exists

**Charts not rendering?**
- Ensure both frontend and backend are running
- Check browser console for errors
- Verify API endpoints are accessible

**WebSocket connection issues?**
- Check proxy configuration in `vite.config.ts`
- Ensure backend WebSocket server is running on `/ws`

### 10. Next Steps

To add your own data:
1. Place FASTA files in `pipeline/data/raw/`
2. Run the Python pipeline: `python pipeline/scripts/run_pipeline.py your_file.fasta`
3. The processed data will appear in the visualizations automatically

The application is now ready to fetch, process, and visualize your eDNA sequence data!