#!/usr/bin/env python3
import os
import sys
import csv
import argparse
from collections import defaultdict
from pathlib import Path


try:
    from Bio import SeqIO
    BIOPYTHON_AVAILABLE = True
except ImportError:
    BIOPYTHON_AVAILABLE = False


# -------------------------------
# Lenient "best practice" values
# -------------------------------
DEFAULTS = {
    "min_len": 50,      # More lenient: was 120
    "max_len": 1000,    # More lenient: was 250
    "min_avg_q": 15,    # More lenient: was 20
    "window": 3         # More lenient: was 5
}


# -------------------------------
# Argument parsing
# -------------------------------
def parse_args():
    parser = argparse.ArgumentParser(description="Preprocess FASTQ or FASTA reads")
    parser.add_argument("input", help="Input FASTA or FASTQ file")
    parser.add_argument("output_dir", nargs='?', help="Output directory (optional, will be auto-generated if not provided)")

    parser.add_argument("--min_len", type=int, default=DEFAULTS["min_len"],
                        help=f"Minimum read length (default: {DEFAULTS['min_len']} - lenient)")
    parser.add_argument("--max_len", type=int, default=DEFAULTS["max_len"],
                        help=f"Maximum read length (default: {DEFAULTS['max_len']} - lenient)")
    parser.add_argument("--min_avg_q", type=int, default=DEFAULTS["min_avg_q"],
                        help=f"Minimum average quality (only for FASTQ, default: {DEFAULTS['min_avg_q']} - lenient)")
    parser.add_argument("--window", type=int, default=DEFAULTS["window"],
                        help=f"Sliding window size for trimming (only for FASTQ, default: {DEFAULTS['window']} - lenient)")
    return parser.parse_args()


# -------------------------------
# Helper functions
# -------------------------------
def get_base_filename(filepath):
    """Extract base filename without path and extension"""
    return os.path.splitext(os.path.basename(filepath))[0]


def generate_output_dir(input_path):
    """Generate output directory based on input file location and name"""
    input_dir = os.path.dirname(os.path.abspath(input_path))
    base_name = get_base_filename(input_path)
    
    # If input is in data/raw/, put output in data/processed/
    if "data" in input_dir and "raw" in input_dir:
        processed_dir = input_dir.replace("raw", "processed")
        return os.path.join(processed_dir, f"{base_name}_processed")
    else:
        # Otherwise, create output directory next to input
        return os.path.join(input_dir, f"{base_name}_processed")


def sliding_window_trim(seq, qual, window, min_avg_q):
    """Trim low-quality bases from both ends using sliding window average (FASTQ only)"""
    if not qual or len(qual) < window:
        return seq, qual

    left, right = 0, len(qual)
    # trim from left
    while left <= right - window:
        if sum(qual[left:left+window]) / window >= min_avg_q:
            break
        left += 1
    # trim from right
    while right - window >= left:
        if sum(qual[right-window:right]) / window >= min_avg_q:
            break
        right -= 1

    return seq[left:right], qual[left:right]


def average_quality(qual):
    return sum(qual) / len(qual) if qual else 0


def detect_file_type(file_path):
    """Determine if file is FASTA or FASTQ based on extension or first line"""
    try:
        ext = os.path.splitext(file_path)[1].lower()
        if ext in [".fq", ".fastq"]:
            return "fastq"
        elif ext in [".fa", ".fasta"]:
            return "fasta"
        else:
            # Try to read first line
            with open(file_path) as f:
                first = f.readline()
                if first.startswith(">"):
                    return "fasta"
                elif first.startswith("@"):
                    return "fastq"
        return None
    except (IOError, OSError) as e:
        print(f"Error reading file {file_path}: {e}")
        return None


# -------------------------------
# Main function with debug output
# -------------------------------
def main():
    if not BIOPYTHON_AVAILABLE:
        print("⚠️ Biopython not installed. Install via `pip install biopython`.")
        sys.exit(1)

    args = parse_args()
    inp = os.path.abspath(args.input)
    
    # Generate output directory if not provided
    if args.output_dir:
        outdir = os.path.abspath(args.output_dir)
    else:
        outdir = generate_output_dir(inp)
    
    base_name = get_base_filename(inp)
    
    print(f"🔍 DEBUG: Input file: {inp}")
    print(f"🔍 DEBUG: Base filename: {base_name}")
    print(f"🔍 DEBUG: Output directory: {outdir}")
    
    # Validate input file
    if not os.path.exists(inp):
        print(f"❌ ERROR: Input file {inp} does not exist")
        sys.exit(1)
    
    # Create output directory
    try:
        os.makedirs(outdir, exist_ok=True)
        print(f"✅ DEBUG: Created output directory: {outdir}")
    except OSError as e:
        print(f"❌ ERROR: Creating output directory {outdir}: {e}")
        sys.exit(1)

    min_len, max_len = args.min_len, args.max_len
    min_avg_q, window = args.min_avg_q, args.window
    
    print(f"🔍 DEBUG: LENIENT Filters - min_len:{min_len}, max_len:{max_len}, min_avg_q:{min_avg_q}")

    file_type = detect_file_type(inp)
    print(f"🔍 DEBUG: Detected file type: {file_type}")
    
    if file_type not in ["fastq", "fasta"]:
        print(f"❌ ERROR: Could not detect file type for {inp}. Must be FASTA or FASTQ.")
        sys.exit(1)

    total_reads = 0
    dropped_len, dropped_qual = 0, 0
    seq_counts = defaultdict(lambda: {"count": 0, "avg_q": 0})

    print(f"🔄 Processing sequences...")
    
    try:
        reader = SeqIO.parse(inp, file_type)
        for rec in reader:
            total_reads += 1
            
            # Progress indicator
            if total_reads % 10000 == 0:
                print(f"  Processed {total_reads} sequences...")
            
            seq = str(rec.seq).upper()
            original_len = len(seq)

            if file_type == "fastq":
                qual = rec.letter_annotations.get("phred_quality", [])
                # Trim low-quality ends with lenient parameters
                seq, qual = sliding_window_trim(seq, qual, window, min_avg_q)
                avg_q = average_quality(qual)
                # More lenient quality filter
                if avg_q < min_avg_q:
                    dropped_qual += 1
                    continue
            else:
                qual = []
                avg_q = 0  # Not used for FASTA

            # More lenient length filter
            if len(seq) < min_len or len(seq) > max_len:
                dropped_len += 1
                if total_reads <= 10:  # Show first few dropped sequences for debugging
                    print(f"    🔍 DEBUG: Dropped seq {total_reads} - length {len(seq)} (was {original_len})")
                continue

            # Deduplication with proper averaging
            key = seq
            old_count = seq_counts[key]["count"]
            old_avg = seq_counts[key]["avg_q"]
            seq_counts[key]["count"] += 1
            # Calculate weighted average quality
            if old_count > 0:
                seq_counts[key]["avg_q"] = (old_avg * old_count + avg_q) / (old_count + 1)
            else:
                seq_counts[key]["avg_q"] = avg_q

    except Exception as e:
        print(f"❌ ERROR: Processing sequences: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    print(f"🔍 DEBUG: Processing complete!")
    print(f"  Total reads processed: {total_reads}")
    print(f"  Dropped (length filter): {dropped_len}")
    print(f"  Dropped (quality filter): {dropped_qual}")
    print(f"  Unique sequences kept: {len(seq_counts)}")

    # Check if we have any sequences to write
    if len(seq_counts) == 0:
        print(f"❌ WARNING: No sequences passed filters! No output files will be created.")
        print(f"   Try relaxing your filters further:")
        print(f"   - Current length range: {min_len}-{max_len}")
        print(f"   - Try: --min_len 20 --max_len 2000")
        return

    # -------------------------------
    # Write outputs with dynamic naming
    # -------------------------------
    cleaned_file = os.path.join(outdir, f"{base_name}_cleaned." + ("fastq" if file_type=="fastq" else "fasta"))
    dedup_csv = os.path.join(outdir, f"{base_name}_dedup_counts.csv")
    report_txt = os.path.join(outdir, f"{base_name}_preprocess_report.txt")
    
    print(f"🔍 DEBUG: Writing outputs...")
    print(f"  Cleaned file: {cleaned_file}")
    print(f"  CSV file: {dedup_csv}")
    print(f"  Report file: {report_txt}")

    # Write cleaned sequences
    try:
        sequences_written = 0
        with open(cleaned_file, "w") as out_f, open(dedup_csv, "w", newline="") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(["seq_id", "sequence", "count", "length", "avg_quality"])
            for i, (seq, info) in enumerate(seq_counts.items(), start=1):
                seq_id = f"{base_name}_seq_{i:06d}"
                writer.writerow([seq_id, seq, info["count"], len(seq), round(info["avg_q"], 2)])

                if file_type == "fastq":
                    # Write FASTQ format with placeholder quality 'I'
                    out_f.write(f"@{seq_id} count={info['count']}\n{seq}\n+\n{'I'*len(seq)}\n")
                else:
                    # Write FASTA
                    out_f.write(f">{seq_id} count={info['count']}\n{seq}\n")
                
                sequences_written += 1
                
        print(f"✅ DEBUG: Successfully wrote {sequences_written} sequences to {cleaned_file}")

    except IOError as e:
        print(f"❌ ERROR: Writing output files: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Write simple report
    try:
        with open(report_txt, "w") as rep:
            rep.write(f"Input file: {inp}\n")
            rep.write(f"Base filename: {base_name}\n")
            rep.write(f"File type detected: {file_type}\n")
            rep.write(f"Total reads: {total_reads}\n")
            kept_reads = total_reads - dropped_len - dropped_qual
            rep.write(f"Kept reads: {kept_reads}\n")
            rep.write(f"Dropped (length filter): {dropped_len}\n")
            if file_type == "fastq":
                rep.write(f"Dropped (avg quality filter): {dropped_qual}\n")
            rep.write(f"Unique collapsed sequences: {len(seq_counts)}\n\n")
            rep.write(f"LENIENT FILTER SETTINGS USED:\n")
            rep.write(f"  min_len: {min_len} (lenient)\n")
            rep.write(f"  max_len: {max_len} (lenient)\n")
            rep.write(f"  min_avg_q: {min_avg_q} (lenient)\n")
            rep.write(f"  window: {window} (lenient)\n\n")
            rep.write(f"Note: {os.path.basename(cleaned_file)} contains one record per unique sequence. Header includes count.\n")

        print(f"✅ DEBUG: Report written to {report_txt}")
        print(f"✅ Stage 1 complete. Outputs saved to {outdir}")
        
        # Final file check
        if os.path.exists(cleaned_file):
            file_size = os.path.getsize(cleaned_file)
            print(f"✅ DEBUG: {cleaned_file} exists and is {file_size} bytes")
        else:
            print(f"❌ ERROR: {cleaned_file} was not created!")
            
    except IOError as e:
        print(f"❌ ERROR: Writing report: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


# -------------------------------
if __name__ == "__main__":
    main()
