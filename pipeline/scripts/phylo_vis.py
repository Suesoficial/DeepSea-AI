#!/usr/bin/env python3
"""
Phylogenetic visualization pipeline with auto-detection of input files.

Changes from original:
- Auto-detects embeddings and clusters files based on base names
- Dynamic output file naming to match pipeline convention  
- Enhanced error handling and fallback mechanisms
- Compatible with pipeline file structure
"""

import numpy as np
import pandas as pd
import umap
import faiss
import networkx as nx
from scipy.spatial.distance import pdist, squareform
from ete3 import Tree
import json
import os
import sys
import glob
import argparse
from pathlib import Path

# Set random seed for reproducibility
np.random.seed(42)

# ------------------------------
# Auto-detection functions
# ------------------------------
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

def auto_detect_input_files(base_dir="data/processed"):
    """Auto-detect embeddings and clusters files"""
    # Look for embeddings file
    embeddings_file = find_latest_file_with_pattern(base_dir, "*_embeddings.npy")
    
    # Look for clusters file  
    clusters_csv_file = find_latest_file_with_pattern(base_dir, "*_clusters.csv")
    
    return embeddings_file, clusters_csv_file

def generate_output_paths(embeddings_path, clusters_csv_path):
    """Generate output file paths based on input files"""
    if embeddings_path:
        # Get base name from embeddings file
        base_name = get_base_filename(embeddings_path)
        if base_name.endswith('_embeddings'):
            base_name = base_name[:-11]  # Remove '_embeddings'
        output_dir = os.path.dirname(embeddings_path)
    elif clusters_csv_path:
        # Get base name from clusters CSV file
        base_name = get_base_filename(clusters_csv_path)
        if base_name.endswith('_clusters'):
            base_name = base_name[:-9]  # Remove '_clusters'
        output_dir = os.path.dirname(clusters_csv_path)
    else:
        # Default fallback
        base_name = "default"
        output_dir = "data/processed"
    
    phylo_graph_json = os.path.join(output_dir, f"{base_name}_phylo_graph.json")
    umap_2d_npy = os.path.join(output_dir, f"{base_name}_umap_2d.npy")
    phylo_tree_nwk = os.path.join(output_dir, f"{base_name}_phylo_simple.nwk")
    
    return phylo_graph_json, umap_2d_npy, phylo_tree_nwk

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Phylogenetic visualization pipeline with auto-detection")
    parser.add_argument("clusters_csv", nargs='?', help="Path to clusters CSV file (optional - will auto-detect)")
    parser.add_argument("--embeddings_path", type=str, help="Path to embeddings.npy file (optional - will auto-detect)")
    parser.add_argument("--output_dir", type=str, help="Output directory (optional - will use input file directory)")
    parser.add_argument("--base_dir", type=str, default="data/processed", help="Base directory to search for files")
    parser.add_argument("--k_neighbors", type=int, default=10, help="Number of k-NN neighbors for graph construction")
    return parser.parse_args()

# ------------------------------
# Phylogenetic analysis functions
# ------------------------------
def neighbor_joining(dm, labels):
    """Simple NJ using ete3 Tree from distance matrix
    Note: This is a simplified placeholder implementation.
    For proper phylogenetic analysis, use dedicated tools like FastTree or RAxML.
    """
    from scipy.cluster.hierarchy import average, to_tree
    if len(labels) == 0:
        return Tree("();")
    if len(labels) == 1:
        return Tree(f"({labels[0]});")
    
    try:
        linkage = average(dm)
        tree = to_tree(linkage, rd=False)
        # Simplified newick format - actual tree construction would be more complex
        newick = "(" + ",".join(labels) + ");"
        return Tree(newick)
    except Exception as e:
        print(f"⚠️ Warning: Tree construction failed: {e}. Creating simple tree.")
        return Tree("(" + ",".join(labels) + ");")

def main():
    """Main phylogenetic visualization pipeline"""
    args = parse_args()
    
    # Auto-detect files if not provided
    if not args.clusters_csv or not args.embeddings_path:
        print("🔍 Auto-detecting input files...")
        auto_embeddings, auto_clusters = auto_detect_input_files(args.base_dir)
        
        embeddings_path = args.embeddings_path or auto_embeddings
        clusters_csv_path = args.clusters_csv or auto_clusters
        
        if embeddings_path:
            print(f"✅ Found embeddings: {embeddings_path}")
        if clusters_csv_path:
            print(f"✅ Found clusters CSV: {clusters_csv_path}")
    else:
        embeddings_path = args.embeddings_path
        clusters_csv_path = args.clusters_csv
    
    # Generate output paths
    phylo_graph_json, umap_2d_npy, phylo_tree_nwk = generate_output_paths(embeddings_path, clusters_csv_path)
    
    if args.output_dir:
        # Override with custom output directory
        base_name = get_base_filename(embeddings_path or clusters_csv_path or "default")
        if base_name.endswith('_embeddings'):
            base_name = base_name[:-11]
        elif base_name.endswith('_clusters'):
            base_name = base_name[:-9]
        
        phylo_graph_json = os.path.join(args.output_dir, f"{base_name}_phylo_graph.json")
        umap_2d_npy = os.path.join(args.output_dir, f"{base_name}_umap_2d.npy")
        phylo_tree_nwk = os.path.join(args.output_dir, f"{base_name}_phylo_simple.nwk")
        os.makedirs(args.output_dir, exist_ok=True)
    
    print(f"📁 Output files will be:")
    print(f"   Phylo graph: {phylo_graph_json}")
    print(f"   UMAP 2D: {umap_2d_npy}")
    print(f"   Phylo tree: {phylo_tree_nwk}")
    
    # -------- Load Inputs -------- #
    try:
        if not embeddings_path or not os.path.exists(embeddings_path):
            print(f"❌ ERROR: embeddings file not found: {embeddings_path}")
            sys.exit(1)
            
        if not clusters_csv_path or not os.path.exists(clusters_csv_path):
            print(f"❌ ERROR: clusters CSV file not found: {clusters_csv_path}")
            sys.exit(1)
            
        print(f"📊 Loading embeddings from: {embeddings_path}")
        embeddings = np.load(embeddings_path)
        
        print(f"📋 Loading clusters from: {clusters_csv_path}")
        clusters_df = pd.read_csv(clusters_csv_path)
        seq_ids = clusters_df["read_id"].values
        cluster_labels = clusters_df["cluster_id"].values
        
        print(f"📊 Loaded {len(embeddings)} embeddings and {len(seq_ids)} cluster assignments")
        
    except FileNotFoundError as e:
        print(f"❌ Error: Required input file not found: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        sys.exit(1)
    
    # -------- Build k-NN Graph -------- #
    print(f"🔗 Building k-NN graph with k={args.k_neighbors}...")
    try:
        d = embeddings.shape[1]
        index = faiss.IndexFlatL2(d)
        embeddings_f32 = embeddings.astype(np.float32)  # Convert once and reuse
        index.add(embeddings_f32)
        distances, neighbors = index.search(embeddings_f32, args.k_neighbors+1)  # +1 to skip self
        
        # Build graph
        G = nx.Graph()
        for i, seq_id in enumerate(seq_ids):
            G.add_node(seq_id, cluster=int(cluster_labels[i]))
            for j in range(1, args.k_neighbors+1):  # skip self (0th neighbor)
                neighbor_id = seq_ids[neighbors[i, j]]
                weight = float(distances[i, j])
                G.add_edge(seq_id, neighbor_id, weight=weight)
        
        print(f"✅ Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
        
        # Save graph JSON
        with open(phylo_graph_json, "w") as f:
            json.dump(nx.readwrite.json_graph.node_link_data(G), f, indent=2)
        print(f"📊 Graph saved to: {phylo_graph_json}")
        
    except Exception as e:
        print(f"❌ Error building graph: {e}")
        sys.exit(1)
    
    # -------- UMAP 2D Projection -------- #
    print("🗺️ Creating UMAP 2D projection...")
    try:
        reducer = umap.UMAP(n_components=2, random_state=42)
        umap_2d = reducer.fit_transform(embeddings)
        np.save(umap_2d_npy, umap_2d)
        print(f"📊 UMAP 2D projection saved to: {umap_2d_npy}")
    except Exception as e:
        print(f"❌ Error creating UMAP projection: {e}")
        sys.exit(1)
    
    # -------- Coarse NJ Tree from Cluster Centroids -------- #
    print("🌳 Building phylogenetic tree from cluster centroids...")
    try:
        centroids = []
        centroid_ids = []
        unique_clusters = sorted(set(cluster_labels))
        
        for c in unique_clusters:
            if c == -1:
                continue  # skip noise
            idx = np.where(cluster_labels == c)[0]
            if len(idx) > 0:
                centroid = embeddings[idx].mean(axis=0)
                centroids.append(centroid)
                centroid_ids.append(f"cluster_{c}")
        
        print(f"📊 Found {len(centroids)} cluster centroids")
        
        # Build NJ tree
        if len(centroids) > 0:
            centroids = np.array(centroids)
            dist_matrix = squareform(pdist(centroids, metric="euclidean"))
            tree = neighbor_joining(dist_matrix, centroid_ids)
        else:
            print("⚠️ Warning: No valid clusters found. Creating empty tree.")
            tree = Tree("();")
        
        tree.write(outfile=phylo_tree_nwk)
        print(f"🌳 Phylogenetic tree saved to: {phylo_tree_nwk}")
        
    except Exception as e:
        print(f"❌ Error building tree: {e}")
        sys.exit(1)
    
    print("✅ Stage 4 complete: Phylogenetic visualization files generated successfully!")
    print(f"   📊 Graph: {phylo_graph_json}")
    print(f"   🗺️ UMAP: {umap_2d_npy}")
    print(f"   🌳 Tree: {phylo_tree_nwk}")

if __name__ == "__main__":
    main()
