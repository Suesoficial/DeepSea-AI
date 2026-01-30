#!/usr/bin/env python3
"""
BLAST taxonomy classification with proper CSV output formatting
Fixed to generate correct CSV structure for biodiversity analysis
"""

import subprocess
import pandas as pd
import matplotlib.pyplot as plt
import sys
import os


def run_blast(query_fasta, blast_db, blast_out):
    """Run BLASTN against reference database"""
    cmd = [
        'blastn',
        '-query', query_fasta,
        '-db', blast_db,
        '-out', blast_out,
        '-outfmt', '6 qseqid sseqid pident length qlen slen evalue bitscore stitle',
        '-max_target_seqs', '5',
        '-perc_identity', '80',
        '-word_size', '16',
        '-num_threads', '4',
        '-dust', 'no'
    ]
    
    print(f"🔬 Running BLAST search...")
    print(f"   Query: {query_fasta}")
    print(f"   Database: {blast_db}")
    print(f"   Output: {blast_out}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"✅ BLAST completed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ BLAST failed: {e}")
        print(f"Error output: {e.stderr}")
        raise


def determine_sequence_status(row):
    """Determine if sequence is complete or partial based on BLAST metrics"""
    pident = row['pident']
    coverage = (row['length'] / row['qlen']) * 100
    
    # High identity and coverage = complete sequence
    if pident >= 97 and coverage >= 90:
        return 'complete sequence'
    else:
        return 'partial sequence'


def parse_blast_output(blast_out):
    """Parse BLAST output and create properly formatted CSV files"""
    
    print(f"📊 Parsing BLAST results...")
    
    columns = ['qseqid', 'sseqid', 'pident', 'length', 'qlen', 'slen', 'evalue', 'bitscore', 'stitle']
    df = pd.read_csv(blast_out, sep='\t', names=columns)
    
    print(f"   Total BLAST hits: {len(df)}")
    
    # Get top hit for each query sequence
    top_hits = df.sort_values(['qseqid', 'bitscore'], ascending=[True, False]).drop_duplicates('qseqid')
    print(f"   Unique sequences with hits: {len(top_hits)}")

    assignment_file = blast_out.replace('.tsv', '_taxonomy_assignments.csv')
    summary_file = blast_out.replace('.tsv', '_taxonomy_summary.csv')

    # FIXED: Add sequence_status column for novel taxa detection
    print(f"📋 Determining sequence completeness...")
    top_hits['sequence_status'] = top_hits.apply(determine_sequence_status, axis=1)
    
    # Count complete vs partial sequences
    status_counts = top_hits['sequence_status'].value_counts()
    print(f"   Complete sequences: {status_counts.get('complete sequence', 0)}")
    print(f"   Partial sequences: {status_counts.get('partial sequence', 0)}")
    
    # Create assignments file with required columns: qseqid, stitle, sequence_status
    assignments_df = top_hits[['qseqid', 'stitle', 'sequence_status']].copy()
    assignments_df.to_csv(assignment_file, index=False)
    print(f"✅ Assignments saved: {assignment_file}")
    
    # FIXED: Create proper summary file with stitle,count columns
    counts = top_hits['stitle'].value_counts().reset_index()
    counts.columns = ['stitle', 'count']  # Ensure proper column names
    counts.to_csv(summary_file, index=False)
    print(f"✅ Summary saved: {summary_file}")
    
    # Verify file structure
    print(f"\n🔍 Verifying CSV structure:")
    print(f"   Assignments columns: {list(assignments_df.columns)}")
    print(f"   Summary columns: {list(counts.columns)}")
    print(f"   Top 3 species by count:")
    for _, row in counts.head(3).iterrows():
        print(f"     {row['stitle'][:50]}... : {row['count']}")

    return assignment_file, summary_file, counts


def plot_taxonomy(counts, output_prefix):
    """Create taxonomy visualization"""
    print(f"📈 Creating taxonomy plot...")
    
    top_n = 10
    df_sorted = counts.head(top_n)
    
    # Extract genus names for better visualization
    def extract_genus(stitle):
        try:
            return stitle.replace('"', '').split()[0]
        except:
            return "Unknown"
    
    df_sorted['genus'] = df_sorted['stitle'].apply(extract_genus)
    
    plt.figure(figsize=(12, 8))
    bars = plt.bar(range(len(df_sorted)), df_sorted['count'])
    
    plt.xlabel('Species (Genus)')
    plt.ylabel('Sequence Count')
    plt.title(f'Top {top_n} Taxonomic Assignments')
    plt.xticks(range(len(df_sorted)), df_sorted['genus'], rotation=45, ha='right')
    
    # Add count labels on bars
    for i, (bar, count) in enumerate(zip(bars, df_sorted['count'])):
        plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, 
                str(count), ha='center', va='bottom', fontsize=9)
    
    plt.tight_layout()
    plot_file = f"{output_prefix}_taxonomy_plot.png"
    plt.savefig(plot_file, dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"✅ Plot saved: {plot_file}")
    return plot_file


def main(query_fasta):
    """Main function to run complete taxonomy pipeline"""
    
    blast_db = "data/reference/16S_ribosomal_RNA"

    # Validate input file
    if not os.path.exists(query_fasta):
        print(f"❌ Input FASTA file not found: {query_fasta}")
        sys.exit(1)
    
    # Create output directory if needed
    os.makedirs("data/processed", exist_ok=True)

    # Build output basename based on input fasta name without directories and extension
    base_name = os.path.splitext(os.path.basename(query_fasta))[0]
    blast_out = f"data/processed/{base_name}_blast.tsv"

    print(f"🧬 TAXONOMY CLASSIFICATION PIPELINE")
    print(f"📁 Input: {query_fasta}")
    print(f"📁 Output prefix: data/processed/{base_name}")
    print()

    try:
        # Step 1: Run BLAST
        run_blast(query_fasta, blast_db, blast_out)
        
        # Step 2: Parse results and create CSV files
        assignment_file, summary_file, counts = parse_blast_output(blast_out)
        
        # Step 3: Create visualization
        plot_file = plot_taxonomy(counts, f"data/processed/{base_name}")

        print(f"\n🎉 TAXONOMY PIPELINE COMPLETED!")
        print(f"📄 Files generated:")
        print(f"   Assignments: {assignment_file}")
        print(f"   Summary: {summary_file}")
        print(f"   Plot: {plot_file}")
        print(f"   Raw BLAST: {blast_out}")
        
        print(f"\n📊 Summary Statistics:")
        print(f"   Total species identified: {len(counts)}")
        print(f"   Total sequences processed: {counts['count'].sum()}")
        print(f"   Most abundant species: {counts.iloc[0]['stitle'][:60]}... ({counts.iloc[0]['count']} sequences)")
        
        return assignment_file, summary_file, plot_file
        
    except Exception as e:
        print(f"❌ Pipeline failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    input_fasta = sys.argv[1] if len(sys.argv) > 1 else "data/raw/chunked-sample-1.fasta"
    main(input_fasta)
