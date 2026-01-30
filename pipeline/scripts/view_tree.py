import pandas as pd
from Bio import Phylo
import matplotlib.pyplot as plt
import matplotlib.cm as cm
import matplotlib.colors as mcolors
import numpy as np
import seaborn as sns
from matplotlib.patches import Rectangle
import sys

# Set style for beautiful plots
plt.style.use('default')
sns.set_palette("husl")

def create_beautiful_phylo_tree():
    # ------------------------------
    # Load data with error handling
    # ------------------------------
    try:
        print("🌳 Loading phylogenetic tree and cluster data...")
        tree = Phylo.read("data/processed/phylo_simple.nwk", "newick")
        clusters_df = pd.read_csv("data/processed/clusters.csv")
        print(f"✅ Loaded tree with {len(list(tree.get_terminals()))} leaves")
        print(f"✅ Loaded cluster data for {len(clusters_df)} sequences")
    except FileNotFoundError as e:
        print(f"❌ Error: Required input file not found: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error loading data: {e}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------
    # Handle ID column flexibly
    # ------------------------------
    id_col = "seq_id" if "seq_id" in clusters_df.columns else "read_id"
    cluster_dict = dict(zip(clusters_df[id_col], clusters_df["cluster_id"]))
    
    print(f"🎨 Found {len(set(clusters_df['cluster_id']))} unique clusters")
    
    # Check if clustering worked properly
    cluster_counts_preview = clusters_df['cluster_id'].value_counts().head(10)
    print("Top 10 cluster sizes:")
    for cluster_id, count in cluster_counts_preview.items():
        print(f"  Cluster {cluster_id}: {count} sequences")
    
    # Warning if mostly noise
    if clusters_df['cluster_id'].value_counts().get(-1, 0) / len(clusters_df) > 0.8:
        print("⚠️  WARNING: >80% sequences are noise (-1). Your clustering might be too strict!")
        print("   Consider adjusting clustering parameters (eps, min_samples, etc.)")

    # ------------------------------
    # Enhanced color palette setup
    # ------------------------------
    unique_clusters = sorted(set(cluster_dict.values()))
    n_clusters = len([c for c in unique_clusters if c != -1])  # Exclude noise
    
    # Use a beautiful color palette
    if n_clusters <= 10:
        colors = plt.cm.Set3(np.linspace(0, 1, max(10, n_clusters)))
    elif n_clusters <= 20:
        colors = plt.cm.tab20(np.linspace(0, 1, n_clusters))
    else:
        colors = plt.cm.hsv(np.linspace(0, 1, n_clusters))
    
    # Create color mapping
    color_map = {}
    noise_color = "#2c2c2c"  # Dark gray for noise
    
    cluster_idx = 0
    for cid in unique_clusters:
        if cid == -1:
            color_map[cid] = noise_color
        else:
            color_map[cid] = colors[cluster_idx % len(colors)]
            cluster_idx += 1

    # ------------------------------
    # Process tree leaves and assign colors
    # ------------------------------
    leaf_colors = {}
    cluster_counts = {}
    
    for leaf in tree.get_terminals():
        original_name = leaf.name
        cid = cluster_dict.get(leaf.name, -1)
        
        # Count sequences per cluster
        cluster_counts[cid] = cluster_counts.get(cid, 0) + 1
        
        # Update leaf name to include cluster info
        if cid != -1:
            leaf.name = f"{original_name} (C{cid})"
        else:
            leaf.name = f"{original_name} (Noise)"
            
        leaf_colors[leaf.name] = color_map[cid]

    print(f"📊 Cluster distribution: {dict(sorted(cluster_counts.items()))}")

    # ------------------------------
    # Create the beautiful visualization
    # ------------------------------
    try:
        # Create figure with optimal size
        n_leaves = len(list(tree.get_terminals()))
        fig_height = max(12, min(24, n_leaves * 0.3))  # Dynamic height
        fig_width = max(14, min(20, n_leaves * 0.2))   # Dynamic width
        
        fig = plt.figure(figsize=(fig_width, fig_height))
        fig.patch.set_facecolor('white')
        
        # Create main axis with padding
        axes = fig.add_subplot(1, 1, 1)
        
        print("🎨 Drawing phylogenetic tree...")
        
        # Draw the tree with custom styling
        # Draw the tree with custom styling
        Phylo.draw(tree, axes=axes, do_show=False)

        
        # ------------------------------
        # Enhance visual appeal
        # ------------------------------
        
        # Style the branches
        for line in axes.get_lines():
            line.set_linewidth(2.0)
            line.set_color("#404040")  # Dark gray branches
            line.set_alpha(0.8)
        
        # Style leaf labels with colors and better formatting
        for label in axes.get_ymajorticklabels():
            text = label.get_text()
            if text in leaf_colors:
                label.set_color(leaf_colors[text])
                label.set_fontweight("bold")
                label.set_fontsize(8)  # Readable size
                
                # Add slight outline for better visibility
                label.set_path_effects([
                    plt.matplotlib.patheffects.withStroke(linewidth=3, foreground='white')
                ])
        
        # Beautiful background
        axes.set_facecolor("#fafafa")
        
        # Remove ugly spines
        for spine in axes.spines.values():
            spine.set_visible(False)
        
        # Clean up ticks
        axes.tick_params(axis='x', colors='#666666', labelsize=10)
        axes.tick_params(axis='y', which='both', left=False, right=False)
        
        # Add grid for better readability
        axes.grid(True, axis='x', alpha=0.3, linestyle='--', linewidth=0.5)
        
        # ------------------------------
        # Create beautiful legend
        # ------------------------------
        legend_elements = []
        legend_labels = []
        
        # Sort clusters for consistent legend order
        for cid in sorted(unique_clusters):
            if cid != -1:
                count = cluster_counts.get(cid, 0)
                legend_elements.append(
                    plt.Line2D([0], [0], color=color_map[cid], 
                              linewidth=6, solid_capstyle='round')
                )
                legend_labels.append(f"Cluster {cid} ({count} seqs)")
        
        # Add noise category if present
        if -1 in unique_clusters:
            noise_count = cluster_counts.get(-1, 0)
            legend_elements.append(
                plt.Line2D([0], [0], color=noise_color, 
                          linewidth=4, linestyle='--', alpha=0.8)
            )
            legend_labels.append(f"Noise/Unassigned ({noise_count} seqs)")
        
        # Position legend nicely
        legend = axes.legend(legend_elements, legend_labels, 
                           title="Sequence Clusters", 
                           loc="upper left",
                           bbox_to_anchor=(1.02, 1),
                           frameon=True,
                           fancybox=True,
                           shadow=True,
                           fontsize=10,
                           title_fontsize=12)
        
        # Style the legend
        legend.get_frame().set_facecolor('white')
        legend.get_frame().set_alpha(0.9)
        legend.get_frame().set_edgecolor('#cccccc')
        legend.get_title().set_fontweight('bold')
        
        # ------------------------------
        # Add title and labels
        # ------------------------------
        plt.suptitle("Phylogenetic Tree with Cluster Annotations", 
                    fontsize=16, fontweight='bold', y=0.98)
        
        axes.set_xlabel("Evolutionary Distance", fontsize=12, fontweight='bold')
        axes.set_title(f"Showing {n_leaves} sequences across {len([c for c in unique_clusters if c != -1])} clusters", 
                      fontsize=11, pad=20, style='italic')
        
        # ------------------------------
        # Save with high quality
        # ------------------------------
        output_files = [
            "data/processed/phylo_tree_colorful.png",
            "data/processed/phylo_tree_colorful.pdf"  # Vector format for publications
        ]
        
        for out_file in output_files:
            plt.savefig(out_file, 
                       bbox_inches="tight", 
                       dpi=300,
                       facecolor='white',
                       edgecolor='none',
                       pad_inches=0.2)
            print(f"✅ Saved: {out_file}")
        
        # Display summary
        print("\n🌟 VISUALIZATION SUMMARY:")
        print(f"   • Tree leaves: {n_leaves}")
        print(f"   • Clusters: {len([c for c in unique_clusters if c != -1])}")
        print(f"   • Noise sequences: {cluster_counts.get(-1, 0)}")
        print(f"   • Largest cluster: {max(cluster_counts.values()) if cluster_counts else 0} sequences")
        
        # Show the plot
        plt.tight_layout()
        plt.show()
        
    except Exception as e:
        print(f"❌ Error creating tree visualization: {e}")
        import traceback
        traceback.print_exc()

# ------------------------------
# Alternative: Circular/Radial tree
# ------------------------------
def create_circular_phylo_tree():
    """Create a beautiful circular phylogenetic tree"""
    try:
        print("🌸 Creating circular phylogenetic tree...")
        
        tree = Phylo.read("data/processed/phylo_simple.nwk", "newick")
        clusters_df = pd.read_csv("data/processed/clusters.csv")
        
        id_col = "seq_id" if "seq_id" in clusters_df.columns else "read_id"
        cluster_dict = dict(zip(clusters_df[id_col], clusters_df["cluster_id"]))
        
        # Set up colors
        unique_clusters = sorted(set(cluster_dict.values()))
        colors = plt.cm.Set3(np.linspace(0, 1, len(unique_clusters)))
        color_map = {cid: colors[i] for i, cid in enumerate(unique_clusters)}
        color_map[-1] = "#2c2c2c"  # Noise color
        
        # Create circular plot
        fig = plt.figure(figsize=(12, 12))
        fig.patch.set_facecolor('white')
        
        axes = fig.add_subplot(1, 1, 1, projection='polar')  # Polar coordinates
        
        # This is a simplified approach - for full circular trees, 
        # you'd need additional libraries like ete3 or toytree
        print("ℹ️  For full circular tree functionality, consider using:")
        print("   • ete3: pip install ete3")
        print("   • toytree: pip install toytree") 
        print("   • ggtree (R): Bioconductor package")
        
    except Exception as e:
        print(f"❌ Error creating circular tree: {e}")

# ------------------------------
# Main execution
# ------------------------------
if __name__ == "__main__":
    create_beautiful_phylo_tree()
    
    # Uncomment for circular tree attempt
    # create_circular_phylo_tree()