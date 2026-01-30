#!/usr/bin/env python3
"""
Complete Bioinformatics Pipeline Runner
=====================================
Runs the entire pipeline in sequence:
preprocess → get_embeddings → vae_cluster → phylo_vis → cluster_extract

Usage: python run_complete_pipeline.py data/raw/your_file.fasta
"""

import subprocess
import sys
import os
import time
import argparse
from pathlib import Path

# Color codes for better terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_step(step_num, step_name, message):
    """Print formatted step information"""
    print(f"\n{Colors.HEADER}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}STEP {step_num}: {step_name.upper()}{Colors.ENDC}")
    print(f"{Colors.OKCYAN}{message}{Colors.ENDC}")
    print(f"{Colors.HEADER}{'='*60}{Colors.ENDC}")

def run_command(cmd, step_name):
    """Run shell command with error handling and timing"""
    start_time = time.time()
    print(f"{Colors.OKBLUE}Running: {' '.join(cmd)}{Colors.ENDC}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        # Print stdout if available
        if result.stdout.strip():
            print(f"{Colors.OKGREEN}Output:{Colors.ENDC}")
            print(result.stdout)
            
        elapsed = time.time() - start_time
        print(f"{Colors.OKGREEN} {step_name} completed in {elapsed:.2f}s{Colors.ENDC}")
        return True
        
    except subprocess.CalledProcessError as e:
        elapsed = time.time() - start_time
        print(f"{Colors.FAIL} {step_name} failed after {elapsed:.2f}s{Colors.ENDC}")
        print(f"{Colors.FAIL}Error: {e}{Colors.ENDC}")
        
        if e.stdout:
            print(f"{Colors.WARNING}Stdout: {e.stdout}{Colors.ENDC}")
        if e.stderr:
            print(f"{Colors.FAIL}Stderr: {e.stderr}{Colors.ENDC}")
            
        return False

def check_file_exists(filepath, description):
    """Check if a file exists and print status"""
    if os.path.exists(filepath):
        size = os.path.getsize(filepath)
        print(f"{Colors.OKGREEN} {description}: {filepath} ({size:,} bytes){Colors.ENDC}")
        return True
    else:
        print(f"{Colors.FAIL} {description} not found: {filepath}{Colors.ENDC}")
        return False

def get_base_filename(filepath):
    """Extract base filename without extension"""
    return os.path.splitext(os.path.basename(filepath))[0]

def setup_directories(input_fasta):
    """Setup all necessary directories and file paths"""
    base_name = get_base_filename(input_fasta)
    input_dir = os.path.dirname(os.path.abspath(input_fasta))
    
    # Create processed directory structure
    if "raw" in input_dir:
        processed_base = input_dir.replace("raw", "processed")
    else:
        processed_base = os.path.join(os.path.dirname(input_dir), "processed")
    
    output_dir = os.path.join(processed_base, f"{base_name}_processed")
    os.makedirs(output_dir, exist_ok=True)
    
    # Define all file paths
    paths = {
        'input_fasta': input_fasta,
        'output_dir': output_dir,
        'base_name': base_name,
        'cleaned_fasta': os.path.join(output_dir, f"{base_name}_cleaned.fasta"),
        'dedup_csv': os.path.join(output_dir, f"{base_name}_dedup_counts.csv"),
        'embeddings_npy': os.path.join(output_dir, f"{base_name}_embeddings.npy"),
        'clusters_csv': os.path.join(output_dir, f"{base_name}_clusters.csv"),
        'novelty_csv': os.path.join(output_dir, f"{base_name}_novelty_scores.csv"),
        'phylo_output': os.path.join(output_dir, f"{base_name}_phylogeny.png"),
        'cluster_extract_dir': os.path.join(output_dir, "cluster_representatives")
    }
    
    return paths

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Complete bioinformatics pipeline runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_complete_pipeline.py data/raw/sample.fasta
  python run_complete_pipeline.py data/raw/user.fasta --skip-phylo
  python run_complete_pipeline.py data/raw/sequences.fasta --embedding-method svd
        """
    )
    
    parser.add_argument("input_fasta", help="Input FASTA file path")
    parser.add_argument("--skip-phylo", action="store_true", help="Skip phylogeny visualization step")
    parser.add_argument("--skip-extract", action="store_true", help="Skip cluster extraction step")
    parser.add_argument("--embedding-method", choices=["transformer", "svd"], default="transformer",
                       help="Embedding method (default: transformer)")
    parser.add_argument("--max-seqs", type=int, default=1000, help="Max sequences for clustering")
    parser.add_argument("--resume-from", type=int, choices=[1,2,3,4,5], 
                       help="Resume from step number (1=preprocess, 2=embeddings, etc.)")
    
    return parser.parse_args()

def main():
    """Main pipeline orchestrator"""
    args = parse_args()
    
    # Validate input file
    if not os.path.exists(args.input_fasta):
        print(f"{Colors.FAIL} Input file does not exist: {args.input_fasta}{Colors.ENDC}")
        sys.exit(1)
    
    # Setup all paths
    paths = setup_directories(args.input_fasta)
    
    print(f"{Colors.HEADER}{Colors.BOLD}")
    print("🧬 COMPLETE BIOINFORMATICS PIPELINE")
    print("==================================")
    print(f"{Colors.ENDC}")
    print(f"Input: {paths['input_fasta']}")
    print(f"Output Directory: {paths['output_dir']}")
    print(f"Base Name: {paths['base_name']}")
    
    pipeline_start = time.time()
    
    # Step 1: Preprocessing
    if not args.resume_from or args.resume_from <= 1:
        print_step(1, "PREPROCESSING", "Cleaning and filtering sequences")
        
        cmd = [
            sys.executable, os.path.join(os.path.dirname(__file__), "preprocess.py"),
            paths['input_fasta'],
            paths['output_dir']
        ]
        
        if not run_command(cmd, "Preprocessing"):
            sys.exit(1)
        
        # Verify outputs
        if not check_file_exists(paths['cleaned_fasta'], "Cleaned FASTA"):
            sys.exit(1)
        if not check_file_exists(paths['dedup_csv'], "Deduplication CSV"):
            sys.exit(1)
    
    # Step 2: Generate Embeddings
    if not args.resume_from or args.resume_from <= 2:
        print_step(2, "EMBEDDINGS", f"Generating embeddings using {args.embedding_method}")
        
        cmd = [
            sys.executable, os.path.join(os.path.dirname(__file__), "get_embeddings.py"),
            paths['cleaned_fasta'],
            paths['embeddings_npy'],
            "--method", args.embedding_method
        ]
        
        if not run_command(cmd, "Embeddings Generation"):
            sys.exit(1)
        
        if not check_file_exists(paths['embeddings_npy'], "Embeddings file"):
            sys.exit(1)
    
    # Step 3: VAE Clustering
    if not args.resume_from or args.resume_from <= 3:
        print_step(3, "VAE CLUSTERING", "Clustering sequences using Variational Autoencoder")
        
        cmd = [
            sys.executable, os.path.join(os.path.dirname(__file__), "vae_cluster.py"),
            "--embeddings_path", paths['embeddings_npy'],
            "--dedup_csv_path", paths['dedup_csv'],
            "--output_dir", paths['output_dir']
        ]
        
        if not run_command(cmd, "VAE Clustering"):
            sys.exit(1)
        
        if not check_file_exists(paths['clusters_csv'], "Clusters CSV"):
            sys.exit(1)
        if not check_file_exists(paths['novelty_csv'], "Novelty scores CSV"):
            sys.exit(1)
    
    # Step 4: Phylogeny Visualization (optional)
    if not args.skip_phylo and (not args.resume_from or args.resume_from <= 4):
        print_step(4, "PHYLOGENY", "Creating phylogenetic visualizations")
        
        cmd = [
            sys.executable, os.path.join(os.path.dirname(__file__), "phylo_vis.py"),
            paths['clusters_csv']
        ]
        
        if not run_command(cmd, "Phylogeny Visualization"):
            print(f"{Colors.WARNING} Phylogeny step failed but continuing pipeline...{Colors.ENDC}")
    
    # Step 5: Cluster Extraction (optional)
    if not args.skip_extract and (not args.resume_from or args.resume_from <= 5):
        print_step(5, "CLUSTER EXTRACTION", "Extracting representative sequences from clusters")
        
        cmd = [
            sys.executable, os.path.join(os.path.dirname(__file__), "cluster_extract.py"),
            paths['input_fasta'],
            paths['clusters_csv']
        ]
        
        if not run_command(cmd, "Cluster Extraction"):
            print(f"{Colors.WARNING} Cluster extraction failed but pipeline completed core steps{Colors.ENDC}")
    
    # Pipeline Summary
    total_time = time.time() - pipeline_start
    
    print(f"\n{Colors.HEADER}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.OKGREEN}🎉 PIPELINE COMPLETED SUCCESSFULLY! 🎉{Colors.ENDC}")
    print(f"{Colors.HEADER}{'='*60}{Colors.ENDC}")
    print(f"Total Runtime: {total_time/60:.2f} minutes")
    print(f"\n{Colors.BOLD} OUTPUT FILES:{Colors.ENDC}")
    
    output_files = [
        (paths['cleaned_fasta'], "Cleaned sequences"),
        (paths['dedup_csv'], "Deduplication data"),
        (paths['embeddings_npy'], "Sequence embeddings"),
        (paths['clusters_csv'], "Cluster assignments"),
        (paths['novelty_csv'], "Novelty scores"),
    ]
    
    for filepath, description in output_files:
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            print(f"   {description}: {filepath} ({size:,} bytes)")
    
    print(f"\n{Colors.OKCYAN}Next steps:{Colors.ENDC}")
    print(f"  • Analyze clusters: {paths['clusters_csv']}")
    print(f"  • Check novelty scores: {paths['novelty_csv']}")
    print(f"  • Review output directory: {paths['output_dir']}")

if __name__ == "__main__":
    main()
