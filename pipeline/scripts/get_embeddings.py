#!/usr/bin/env python3
import os
import argparse
import numpy as np
import scipy.sparse
import glob
from pathlib import Path

# Set random seeds for reproducibility
np.random.seed(42)

# Fallback SVD
from sklearn.decomposition import TruncatedSVD

# Transformers (optional)
try:
    from transformers import AutoTokenizer, AutoModel
    import torch
    torch.manual_seed(42)
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False

from Bio import SeqIO

# -------------------------------
def get_base_filename(filepath):
    """Extract base filename without path and extension"""
    return os.path.splitext(os.path.basename(filepath))[0]

def find_cleaned_fasta(input_path=None, base_dir="data/processed"):
    """
    Find the cleaned FASTA file from preprocessing output.
    If input_path is provided, use it directly.
    Otherwise, search for *_cleaned.fasta files in the processed directory.
    """
    if input_path and os.path.exists(input_path):
        return input_path
    
    # Search for cleaned FASTA files
    search_patterns = [
        os.path.join(base_dir, "*", "*_cleaned.fasta"),
        os.path.join(base_dir, "*_cleaned.fasta"),
        "data/processed/*/*_cleaned.fasta",
        "*_cleaned.fasta"
    ]
    
    found_files = []
    for pattern in search_patterns:
        found_files.extend(glob.glob(pattern))
    
    if not found_files:
        print(f"❌ No cleaned FASTA files found. Looking for patterns like '*_cleaned.fasta'")
        print(f"   Searched in: {search_patterns}")
        return None
    
    if len(found_files) == 1:
        print(f"✅ Auto-detected cleaned file: {found_files[0]}")
        return found_files[0]
    
    # Multiple files found, show options
    print(f"📁 Multiple cleaned FASTA files found:")
    for i, file in enumerate(found_files, 1):
        print(f"   {i}. {file}")
    
    try:
        choice = int(input("Enter number to select (or 0 to exit): "))
        if choice == 0:
            return None
        if 1 <= choice <= len(found_files):
            return found_files[choice - 1]
        else:
            print("Invalid choice")
            return None
    except (ValueError, KeyboardInterrupt):
        return None

def generate_output_path(input_fasta):
    """Generate output embeddings file path based on input"""
    base_name = get_base_filename(input_fasta)
    input_dir = os.path.dirname(input_fasta)
    
    # Remove '_cleaned' suffix if present
    if base_name.endswith('_cleaned'):
        base_name = base_name[:-8]  # Remove '_cleaned'
    
    output_file = os.path.join(input_dir, f"{base_name}_embeddings.npy")
    return output_file

def parse_args():
    parser = argparse.ArgumentParser(description="Generate dense embeddings for sequences")
    parser.add_argument("input_fasta", nargs='?', help="Input cleaned FASTA file (optional - will auto-detect if not provided)")
    parser.add_argument("output_file", nargs='?', help="Output embeddings file (.npy) (optional - will auto-generate if not provided)")
    parser.add_argument("--method", choices=["transformer", "svd"], default="transformer",
                        help="Method for embedding: transformer or svd fallback")
    parser.add_argument("--embedding_dim", type=int, default=256,
                        help="Embedding dimensionality for fallback SVD")
    parser.add_argument("--batch_size", type=int, default=64, help="Batch size for transformer")
    parser.add_argument("--device", type=str, default="cpu", choices=["cpu", "cuda"], help="Device for transformer: cpu or cuda")
    parser.add_argument("--local_model", type=str, default=os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "DNA_bert_6"),
                        help="Path to local DNABERT model folder")
    return parser.parse_args()

# -------------------------------
def read_sequences(fasta_file):
    try:
        sequences = [str(rec.seq).upper() for rec in SeqIO.parse(fasta_file, "fasta")]
        print(f"📊 Total sequences loaded: {len(sequences)}")
        return sequences
    except (IOError, OSError) as e:
        print(f"❌ Error reading file {fasta_file}: {e}")
        raise
    except Exception as e:
        print(f"❌ Error parsing sequences: {e}")
        raise

# -------------------------------
def embeddings_svd(kmer_matrix, dim=256):
    print(f"🔄 Running TruncatedSVD fallback to {dim}-D embeddings...")
    svd = TruncatedSVD(n_components=dim, random_state=42)
    embeddings = svd.fit_transform(kmer_matrix)
    print(f"✅ SVD embeddings generated: {embeddings.shape}")
    return embeddings

# -------------------------------
def embeddings_transformer(sequences, local_model=None, batch_size=64, device="cpu"):
    if local_model is None:
        local_model = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "DNA_bert_6")
    if not HF_AVAILABLE:
        raise ImportError("Transformers not installed. Install via `pip install transformers torch`")

    print(f"🤖 Using local DNABERT model for embeddings: {local_model}")
    try:
        tokenizer = AutoTokenizer.from_pretrained(local_model, trust_remote_code=True)
        model = AutoModel.from_pretrained(local_model, trust_remote_code=True).to(device)
        model.eval()
    except (FileNotFoundError, OSError) as e:
        print(f"❌ Error loading model from {local_model}: {e}")
        raise
    except Exception as e:
        print(f"❌ Error initializing model: {e}")
        raise

    all_embeddings = []
    total_batches = (len(sequences) + batch_size - 1) // batch_size

    with torch.inference_mode():
        for i in range(0, len(sequences), batch_size):
            batch_num = i // batch_size + 1
            print(f"  Processing batch {batch_num}/{total_batches}...")
            
            batch_seqs = sequences[i:i+batch_size]
            tokenized = tokenizer(batch_seqs, return_tensors="pt", padding=True, truncation=True).to(device)
            outputs = model(**tokenized)
            batch_emb = outputs.last_hidden_state.mean(dim=1).cpu().numpy()
            all_embeddings.append(batch_emb)

    embeddings = np.vstack(all_embeddings)
    print(f"✅ Transformer embeddings generated: {embeddings.shape}")
    return embeddings

# -------------------------------
def process_kmers_fallback(sequences, dim=256):
    """Helper function for k-mer processing to avoid code duplication"""
    print("🔄 Processing k-mers for SVD fallback...")
    
    try:
        from scripts.kmer_tokenize import sequence_to_kmers
    except ImportError:
        print("⚠️ kmer_tokenize module not found, using simple k-mer generation")
        def sequence_to_kmers(seq, k=6):
            return [seq[i:i+k] for i in range(len(seq)-k+1)]
    
    from sklearn.feature_extraction.text import CountVectorizer
    
    kmer_seqs = [" ".join(sequence_to_kmers(seq, 6)) for seq in sequences]
    vectorizer = CountVectorizer()
    kmer_matrix = vectorizer.fit_transform(kmer_seqs)
    print(f"📊 K-mer matrix shape: {kmer_matrix.shape}")
    
    return embeddings_svd(kmer_matrix, dim=dim)

def main():
    args = parse_args()
    
    # Auto-detect input file if not provided
    if not args.input_fasta:
        print("🔍 No input file specified, auto-detecting cleaned FASTA files...")
        input_fasta = find_cleaned_fasta()
        if not input_fasta:
            print("❌ No cleaned FASTA file found. Please run preprocessing first or specify input file.")
            return
    else:
        input_fasta = args.input_fasta
    
    # Validate input file
    if not os.path.exists(input_fasta):
        print(f"❌ Error: Input file {input_fasta} does not exist")
        return
    
    # Auto-generate output file if not provided
    if not args.output_file:
        output_file = generate_output_path(input_fasta)
        print(f"📝 Auto-generated output file: {output_file}")
    else:
        output_file = args.output_file
    
    # Ensure output directory exists
    output_dir = os.path.dirname(output_file)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
    
    print(f"🔍 Input file: {input_fasta}")
    print(f"📁 Output file: {output_file}")
    print(f"⚙️ Method: {args.method}")
    
    try:
        sequences = read_sequences(input_fasta)
    except Exception as e:
        print(f"❌ Error reading sequences: {e}")
        return

    if args.method == "transformer":
        try:
            embeddings = embeddings_transformer(
                sequences,
                local_model=args.local_model,
                batch_size=args.batch_size,
                device=args.device
            )
        except Exception as e:
            print(f"⚠️ Transformer failed: {e}")
            print("🔄 Falling back to k-mer + SVD (CPU)")
            embeddings = process_kmers_fallback(sequences, dim=args.embedding_dim)
    else:
        # Method = svd fallback
        embeddings = process_kmers_fallback(sequences, dim=args.embedding_dim)

    try:
        np.save(output_file, embeddings)
        print(f"✅ Stage 3 complete. Embeddings saved to {output_file}")
        print(f"📊 Shape: {embeddings.shape}")
        print(f"💾 File size: {os.path.getsize(output_file) / 1024 / 1024:.2f} MB")
    except Exception as e:
        print(f"❌ Error saving embeddings: {e}")

# -------------------------------
if __name__ == "__main__":
    main()
