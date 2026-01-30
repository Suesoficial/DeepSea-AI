#!/usr/bin/env python3
"""
Cluster representative extraction with dynamic file detection.

Changes from original:
- Auto-detects input files based on base names  
- Dynamic output naming to match pipeline convention
- Command line arguments for flexibility
- Enhanced error handling
- FIXED: Biodiversity analysis uses taxonomy files instead of cluster files
"""

import pandas as pd
import random
import os
import sys
import glob
import argparse
from pathlib import Path
from Bio import SeqIO


def get_base_filename(filepath):
    """Extract base filename without path and extension"""
    return os.path.splitext(os.path.basename(filepath))[0]


def find_latest_file_with_pattern(base_dir, pattern):
    """Find the latest modified file matching pattern in base_dir and subdirs"""
    search_paths = [
        os.path.join(base_dir, "**", pattern),
        os.path.join(base_dir, pattern),
        pattern  # fallback for current directory
    ]
    
    found_files = []
    for search_path in search_paths:
        found_files.extend(glob.glob(search_path, recursive=True))
    
    if not found_files:
        return None
    
    # Sort by modification time, newest first
    found_files.sort(key=os.path.getmtime, reverse=True)
    return found_files[0]


def auto_detect_input_files():
    """Auto-detect original FASTA and clusters CSV files"""
    # Look for original FASTA in raw directory
    original_fasta = find_latest_file_with_pattern("data/raw", "*.fasta")
    if not original_fasta:
        original_fasta = find_latest_file_with_pattern("data/raw", "*.fa")
    
    # Look for clusters CSV
    clusters_csv = find_latest_file_with_pattern("data/processed", "*_clusters.csv")
    
    return original_fasta, clusters_csv


def debug_id_mismatch(original_fasta, clusters_csv, max_check=10):
    """Debug function to check ID matching between cluster CSV and FASTA"""
    clusters_df = pd.read_csv(clusters_csv)
    clustered_sequences = clusters_df[clusters_df['cluster_id'] != -1]
    
    if len(clustered_sequences) == 0:
        print("⚠️ No clustered sequences found (all noise)")
        return
        
    cluster_reps = clustered_sequences.groupby('cluster_id')['read_id'].first()
    cluster_ids = cluster_reps.values[:max_check]  # Check first 10
    
    # Load FASTA IDs (first few for comparison)
    fasta_ids = []
    count = 0
    for record in SeqIO.parse(original_fasta, "fasta"):
        fasta_ids.append(record.id)
        count += 1
        if count >= max_check:
            break
    
    print("=== ID MISMATCH DEBUG ===")
    print(f"Sample Cluster IDs: {list(cluster_ids)}")
    print(f"Sample FASTA IDs: {fasta_ids}")
    
    # Check exact matches
    matches = [cid for cid in cluster_ids if cid in fasta_ids]
    print(f"Exact matches found: {len(matches)}")
    
    if len(matches) == 0:
        print("\n❌ NO MATCHES - This confirms ID format mismatch")
        print("Check if:")
        print("- FASTA IDs have extra prefixes/suffixes")
        print("- Different naming conventions")
        print("- Encoding or whitespace issues")
    else:
        print(f"✅ Found {len(matches)} matches")


def extract_first_n_sequences(original_fasta, output_fasta, n=446):
    """Extract first n sequences as representatives for demo"""
    representatives = []
    count = 0
    for record in SeqIO.parse(original_fasta, "fasta"):
        representatives.append(record)
        count += 1
        if count >= n:
            break
    
    SeqIO.write(representatives, output_fasta, "fasta")
    print(f"📊 Extracted first {len(representatives)} sequences as representatives")
    return len(representatives)


def extract_cluster_representatives(original_fasta, clusters_csv, output_fasta, max_seqs=1000):
    """
    Extract cluster representative sequences from clustering results, with random sampling if needed
    """
    # Load cluster assignments
    clusters_df = pd.read_csv(clusters_csv)
    
    # Filter out noise/unclustered sequences (cluster_id == -1)
    clustered_sequences = clusters_df[clusters_df['cluster_id'] != -1]
    
    if len(clustered_sequences) == 0:
        print("⚠️ No clustered sequences found (all sequences are noise)")
        return 0
    
    # Get one representative per cluster (first sequence in each cluster)
    cluster_reps = clustered_sequences.groupby('cluster_id')['read_id'].first()
    rep_ids = list(cluster_reps.values)
    
    print(f"📊 Found {len(cluster_reps)} clusters")
    
    # Debug ID mismatch
    debug_id_mismatch(original_fasta, clusters_csv)
    
    # If more representatives than max_seqs, randomly sample
    if len(rep_ids) > max_seqs:
        rep_ids = random.sample(rep_ids, max_seqs)
        print(f"📊 Sampling {max_seqs} representatives randomly to limit runtime")
    else:
        print(f"📊 Extracting all {len(rep_ids)} representatives")
    
    # Convert to set for O(1) lookup
    rep_id_set = set(str(rid).strip() for rid in rep_ids)  # Strip whitespace
    
    # Extract representative sequences from original FASTA
    representatives = []
    for record in SeqIO.parse(original_fasta, "fasta"):
        # Try exact match first
        if record.id in rep_id_set:
            representatives.append(record)
        # Try without common prefixes if needed
        elif record.id.split('|')[-1] in rep_id_set:  # Handle "gi|123|ref|seq_001"
            representatives.append(record)
        elif record.id.split('_', 1)[-1] in rep_id_set:  # Handle prefix_seq_001
            representatives.append(record)
    
    # Write representatives to new FASTA file
    SeqIO.write(representatives, output_fasta, "fasta")
    print(f"✅ Saved {len(representatives)} cluster representatives to: {output_fasta}")
    
    return len(representatives)


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Extract cluster representative sequences")
    parser.add_argument("original_fasta", nargs='?', help="Path to original FASTA file (optional - will auto-detect)")
    parser.add_argument("clusters_csv", nargs='?', help="Path to clusters CSV file (optional - will auto-detect)")
    parser.add_argument("--output_dir", type=str, help="Output directory (optional - will use clusters CSV directory)")
    parser.add_argument("--max_seqs", type=int, default=1000, help="Max representatives to extract (default: 1000)")
    parser.add_argument("--fallback_seqs", type=int, default=446, help="Number of sequences to extract as fallback (default: 446)")
    return parser.parse_args()


def run_biodiversity_analysis(output_dir, base_name):
    """
    Run biodiversity analysis using taxonomy output CSV files (FIXED VERSION)
    """
    try:
        # Import biodiversity analysis functions
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from biodiversity_analysis import process_biodiversity_data, save_results_to_json
        
        # FIXED: Look for taxonomy output files generated by BLAST step
        assignments_csv = f"data/processed/{base_name}_representatives_blast_taxonomy_assignments.csv"
        summary_csv = f"data/processed/{base_name}_representatives_blast_taxonomy_summary.csv"
        
        print(f"\n🧬 Running biodiversity analysis on taxonomy outputs...")
        print(f"   Looking for assignments: {assignments_csv}")
        print(f"   Looking for summary: {summary_csv}")
        
        # Check if taxonomy files exist
        if os.path.exists(assignments_csv) and os.path.exists(summary_csv):
            print(f"✅ Found taxonomy files, processing biodiversity data...")
            
            # FIXED: Use proper taxonomy files (NOT cluster files)
            result = process_biodiversity_data(assignments_csv, summary_csv)
            
            if result is not None:
                output_json = os.path.join(output_dir, f"{base_name}_biodiversity.json")
                success = save_results_to_json(result, output_json)
                
                if success:
                    print(f"\n🎉 Biodiversity analysis completed!")
                    print(f"📊 Species richness: {result['diversityMetrics']['speciesRichness']}")
                    print(f"📈 Shannon index: {result['diversityMetrics']['shannonIndex']:.4f}")
                    print(f"📉 Simpson index: {result['diversityMetrics']['simpsonIndex']:.4f}")
                    print(f"🧬 Novel taxa: {result['diversityMetrics']['novelTaxa']}")
                    print(f"💾 Results saved to: {output_json}")
                    return result
                else:
                    print("❌ Failed to save biodiversity JSON file")
                    return None
            else:
                print("❌ Biodiversity analysis failed: No result generated")
                return None
        else:
            print("⚠️ Taxonomy files not found. Biodiversity analysis requires:")
            print(f"   - {assignments_csv}")
            print(f"   - {summary_csv}")
            print("   Run taxonomy classification step first!")
            return None
            
    except ImportError as e:
        print(f"⚠️ Biodiversity analysis script not found: {e}")
        print("   Make sure biodiversity_analysis.py is in the same directory")
        return None
    except Exception as e:
        print(f"❌ Error running biodiversity analysis: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """
    Complete pipeline: Extract representatives → Run BLAST → Generate taxonomy CSVs → Run biodiversity analysis
    """
    args = parse_args()
    
    # Auto-detect files if not provided
    if not args.original_fasta or not args.clusters_csv:
        print("🔍 Auto-detecting input files...")
        auto_original, auto_clusters = auto_detect_input_files()
        
        original_fasta = args.original_fasta or auto_original
        clusters_csv = args.clusters_csv or auto_clusters
        
        if original_fasta:
            print(f"✅ Found original FASTA: {original_fasta}")
        if clusters_csv:
            print(f"✅ Found clusters CSV: {clusters_csv}")
    else:
        original_fasta = args.original_fasta
        clusters_csv = args.clusters_csv
    
    # Validate input files
    if not original_fasta or not os.path.exists(original_fasta):
        print(f"❌ ERROR: Original FASTA file not found: {original_fasta}")
        sys.exit(1)
        
    if not clusters_csv or not os.path.exists(clusters_csv):
        print(f"❌ ERROR: Clusters CSV file not found: {clusters_csv}")
        sys.exit(1)
    
    # Determine output directory and file paths
    if args.output_dir:
        output_dir = args.output_dir
        os.makedirs(output_dir, exist_ok=True)
    else:
        output_dir = os.path.dirname(clusters_csv)
    
    # Get base filename from original FASTA for consistent naming
    base_name = get_base_filename(original_fasta)
    representatives_fasta = os.path.join(output_dir, f"{base_name}_representatives.fasta")
    
    print(f"📁 Input files:")
    print(f"   Original FASTA: {original_fasta}")
    print(f"   Clusters CSV: {clusters_csv}")
    print(f"📁 Output:")
    print(f"   Representatives FASTA: {representatives_fasta}")
    
    # Step 1: Extract cluster representatives
    print(f"\n📊 Extracting cluster representatives (max {args.max_seqs})...")
    num_reps = extract_cluster_representatives(
        original_fasta, 
        clusters_csv, 
        representatives_fasta,
        max_seqs=args.max_seqs
    )
    
    # If no matches found, use first N sequences as backup
    if num_reps == 0:
        print(f"\n🔄 ID mismatch detected. Using first {args.fallback_seqs} sequences as representatives for demo...")
        num_reps = extract_first_n_sequences(original_fasta, representatives_fasta, args.fallback_seqs)
    
    if num_reps == 0:
        print("❌ No sequences found!")
        return
    
    # Step 2: Run taxonomy classification on representatives (if available)
    print(f"\n🧬 Running taxonomy classification on {num_reps} representatives...")
    try:
        # Try to import and run taxonomy script
        from run_taxonomy import main as taxonomy_main
        taxonomy_main(representatives_fasta)
        
        print(f"\n✅ Taxonomy classification completed! Check {output_dir}/ for:")
        print(f"- {base_name}_representatives_blast_taxonomy_assignments.csv")
        print(f"- {base_name}_representatives_blast_taxonomy_summary.csv")
        print(f"- {base_name}_representatives_blast_taxonomy_plot.png")
        
        # FIXED Step 3: Run biodiversity analysis on taxonomy outputs (NOT cluster outputs)
        biodiversity_result = run_biodiversity_analysis(output_dir, base_name)
        
        if biodiversity_result:
            print(f"\n🎊 Complete pipeline finished successfully!")
            print(f"📁 All outputs saved to: {output_dir}/")
        
    except ImportError:
        print("⚠️ Taxonomy script not found. Skipping taxonomy classification.")
        print(f"✅ Representative sequences saved to: {representatives_fasta}")
        
        # Still try biodiversity analysis (though it will likely fail without taxonomy files)
        biodiversity_result = run_biodiversity_analysis(output_dir, base_name)
        
    except Exception as e:
        print(f"❌ Error running taxonomy classification: {e}")
        print(f"✅ Representative sequences saved to: {representatives_fasta}")
        
        # Still try biodiversity analysis (though it will likely fail without taxonomy files)
        biodiversity_result = run_biodiversity_analysis(output_dir, base_name)


if __name__ == "__main__":
    main()
