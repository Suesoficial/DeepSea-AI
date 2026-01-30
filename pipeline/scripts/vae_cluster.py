#!/usr/bin/env python3
"""
VAE + Clustering pipeline tuned for high-similarity embeddings.

Changes vs. original:
- Auto-detects embeddings and dedup_counts files from previous pipeline steps
- Dynamic file naming based on input file base names
- stronger KL weight (beta_final=5.0) with linear warmup
- small Gaussian input noise during training to avoid trivial memorization
- try UMAP (fall back to PCA) for projection before clustering
- defensive checks and improved logging
"""

import numpy as np
import pandas as pd
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset
import hdbscan
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import pairwise_distances
import os
import sys
import glob
import argparse
from pathlib import Path
from tqdm import tqdm

# Try UMAP; fall back later if missing
try:
    import umap
    _HAS_UMAP = True
except Exception:
    _HAS_UMAP = False

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
    """Auto-detect embeddings and dedup_counts files"""
    # Look for embeddings file
    embeddings_file = find_latest_file_with_pattern(base_dir, "*_embeddings.npy")
    
    # Look for dedup_counts file
    dedup_csv_file = find_latest_file_with_pattern(base_dir, "*_dedup_counts.csv")
    
    return embeddings_file, dedup_csv_file

def generate_output_paths(embeddings_path, dedup_csv_path):
    """Generate output file paths based on input files"""
    if embeddings_path:
        # Get base name from embeddings file
        base_name = get_base_filename(embeddings_path)
        if base_name.endswith('_embeddings'):
            base_name = base_name[:-11]  # Remove '_embeddings'
        output_dir = os.path.dirname(embeddings_path)
    elif dedup_csv_path:
        # Get base name from dedup CSV file
        base_name = get_base_filename(dedup_csv_path)
        if base_name.endswith('_dedup_counts'):
            base_name = base_name[:-13]  # Remove '_dedup_counts'
        output_dir = os.path.dirname(dedup_csv_path)
    else:
        # Default fallback
        base_name = "default"
        output_dir = "data/processed"
    
    clusters_csv = os.path.join(output_dir, f"{base_name}_clusters.csv")
    novelty_csv = os.path.join(output_dir, f"{base_name}_novelty_scores.csv")
    
    return clusters_csv, novelty_csv

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="VAE clustering pipeline with auto-detection")
    parser.add_argument("--embeddings_path", type=str, help="Path to embeddings.npy file (optional - will auto-detect)")
    parser.add_argument("--dedup_csv_path", type=str, help="Path to dedup_counts.csv file (optional - will auto-detect)")
    parser.add_argument("--output_dir", type=str, help="Output directory (optional - will use input file directory)")
    parser.add_argument("--base_dir", type=str, default="data/processed", help="Base directory to search for files")
    return parser.parse_args()

# ------------------------------
# Config / Params (tweakable)
# ------------------------------
latent_dim = 16            # kept as requested
hidden_dim = 256
batch_size = 128
epochs = 50
learning_rate = 1e-3
beta_final = 10.0           # stronger KLD weight to encourage spread
beta_warmup_epochs = 10    # linear beta warmup
pca_components = 5
umap_components = 10       # number of UMAP output dims (will be clipped)
input_noise_std = 0.01     # gaussian noise added to inputs during training
hdbscan_min_cluster_size = 30
hdbscan_min_samples = 10

# ------------------------------
# Device & seeds
# ------------------------------
np.random.seed(42)
torch.manual_seed(42)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(42)

# ------------------------------
# Auto-detect or use provided file paths
# ------------------------------
def main():
    args = parse_args()
    
    # Auto-detect files if not provided
    if not args.embeddings_path or not args.dedup_csv_path:
        print("🔍 Auto-detecting input files...")
        auto_embeddings, auto_dedup = auto_detect_input_files(args.base_dir)
        
        embeddings_path = args.embeddings_path or auto_embeddings
        dedup_csv_path = args.dedup_csv_path or auto_dedup
        
        if embeddings_path:
            print(f"✅ Found embeddings: {embeddings_path}")
        if dedup_csv_path:
            print(f"✅ Found dedup CSV: {dedup_csv_path}")
    else:
        embeddings_path = args.embeddings_path
        dedup_csv_path = args.dedup_csv_path
    
    # Generate output paths
    out_clusters_csv, out_novelty_csv = generate_output_paths(embeddings_path, dedup_csv_path)
    
    if args.output_dir:
        # Override with custom output directory
        base_name = get_base_filename(embeddings_path or dedup_csv_path or "default")
        if base_name.endswith('_embeddings'):
            base_name = base_name[:-11]
        elif base_name.endswith('_dedup_counts'):
            base_name = base_name[:-13]
        
        out_clusters_csv = os.path.join(args.output_dir, f"{base_name}_clusters.csv")
        out_novelty_csv = os.path.join(args.output_dir, f"{base_name}_novelty_scores.csv")
        os.makedirs(args.output_dir, exist_ok=True)
    
    print(f"📁 Output files will be:")
    print(f"   Clusters: {out_clusters_csv}")
    print(f"   Novelty: {out_novelty_csv}")
    
    # ------------------------------
    # Load Data
    # ------------------------------
    if not embeddings_path or not os.path.exists(embeddings_path):
        print(f"❌ ERROR: embeddings file not found: {embeddings_path}")
        print("   Make sure to run the embeddings script first!")
        sys.exit(1)
    
    print(f"📊 Loading embeddings from: {embeddings_path}")
    embeddings = np.load(embeddings_path)
    
    if not dedup_csv_path or not os.path.exists(dedup_csv_path):
        print(f"⚠️ WARNING: dedup_counts.csv not found: {dedup_csv_path}")
        print("   Generating read_ids as indices...")
        read_ids = np.arange(len(embeddings)).astype(str)
    else:
        print(f"📋 Loading sequence IDs from: {dedup_csv_path}")
        read_ids = pd.read_csv(dedup_csv_path).iloc[:, 0].astype(str).values
    
    if len(read_ids) != len(embeddings):
        print(f"⚠️ WARNING: len(read_ids) ({len(read_ids)}) != len(embeddings) ({len(embeddings)}). Truncating to match.")
        minlen = min(len(read_ids), len(embeddings))
        read_ids = read_ids[:minlen]
        embeddings = embeddings[:minlen]
    
    print(f"📊 Loaded {len(embeddings)} embeddings with {embeddings.shape[1]} dimensions")
    print(f"📊 Data stats: min={embeddings.min():.3f}, max={embeddings.max():.3f}, mean={embeddings.mean():.3f}, std={embeddings.std():.3f}")
    
    # convert to tensor
    X_all = torch.tensor(embeddings, dtype=torch.float32)
    dataset = TensorDataset(X_all)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True, drop_last=False)
    
    # ------------------------------
    # VAE Definition (same as original)
    # ------------------------------
    class VAE(nn.Module):
        def __init__(self, input_dim, hidden_dim, latent_dim):
            super().__init__()
            self.fc1 = nn.Linear(input_dim, hidden_dim)
            self.fc_mu = nn.Linear(hidden_dim, latent_dim)
            self.fc_logvar = nn.Linear(hidden_dim, latent_dim)
            self.fc2 = nn.Linear(latent_dim, hidden_dim)
            self.fc3 = nn.Linear(hidden_dim, input_dim)
    
            # weight init
            for m in self.modules():
                if isinstance(m, nn.Linear):
                    nn.init.xavier_uniform_(m.weight)
                    if m.bias is not None:
                        nn.init.zeros_(m.bias)
    
        def encode(self, x):
            h = torch.relu(self.fc1(x))
            return self.fc_mu(h), self.fc_logvar(h)
    
        def reparameterize(self, mu, logvar):
            logvar = torch.clamp(logvar, min=-20.0, max=20.0)
            std = torch.exp(0.5 * logvar)
            eps = torch.randn_like(std)
            return mu + eps * std
    
        def decode(self, z):
            h = torch.relu(self.fc2(z))
            return self.fc3(h)
    
        def forward(self, x):
            mu, logvar = self.encode(x)
            z = self.reparameterize(mu, logvar)
            x_recon = self.decode(z)
            return x_recon, mu, logvar
    
    def vae_losses(x, x_recon, mu, logvar):
        # per-sample MSE then mean across batch
        recon_per_sample = torch.mean((x_recon - x) ** 2, dim=1)
        recon_loss = recon_per_sample.mean()
        # KLD per sample then mean
        kld_per_sample = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp(), dim=1)
        kld = kld_per_sample.mean()
        return recon_loss, kld, recon_per_sample.detach().cpu().numpy()
    
    # ------------------------------
    # Train VAE
    # ------------------------------
    print("🤖 Training VAE...")
    vae = VAE(input_dim=X_all.shape[1], hidden_dim=hidden_dim, latent_dim=latent_dim).to(device)
    optimizer = torch.optim.AdamW(vae.parameters(), lr=learning_rate, weight_decay=1e-6)
    
    for epoch in range(1, epochs + 1):
        vae.train()
        total_recon = 0.0
        total_kld = 0.0
        total_loss = 0.0
        n_batches = 0
    
        # linear beta schedule
        if epoch <= beta_warmup_epochs and beta_warmup_epochs > 0:
            beta = float(epoch) / float(beta_warmup_epochs) * beta_final
        else:
            beta = beta_final
    
        for batch in loader:
            x_batch = batch[0].to(device)
    
            # add small gaussian input noise (regularization)
            if input_noise_std > 0.0:
                noise = torch.randn_like(x_batch) * input_noise_std
                x_noisy = x_batch + noise
            else:
                x_noisy = x_batch
    
            optimizer.zero_grad()
            x_recon, mu, logvar = vae(x_noisy)
            # compute losses against the clean x_batch (denoising behaviour)
            recon_loss, kld, _ = vae_losses(x_batch, x_recon, mu, logvar)
            loss = recon_loss + beta * kld
            loss.backward()
            torch.nn.utils.clip_grad_norm_(vae.parameters(), max_norm=5.0)
            optimizer.step()
    
            total_recon += recon_loss.item()
            total_kld += kld.item()
            total_loss += loss.item()
            n_batches += 1
    
        avg_recon = total_recon / max(1, n_batches)
        avg_kld = total_kld / max(1, n_batches)
        avg_loss = total_loss / max(1, n_batches)
    
        if epoch % max(1, epochs // 10) == 0 or epoch == 1 or epoch == epochs:
            print(f"Epoch {epoch}/{epochs} - Loss: {avg_loss:.6e} Recon: {avg_recon:.6e} KLD: {avg_kld:.6e} beta={beta:.3f}")
    
    # ------------------------------
    # Get Latent Representations & Recon errors
    # ------------------------------
    print("🔄 Generating latent representations...")
    vae.eval()
    with torch.no_grad():
        X_device = X_all.to(device)
        mu_all, logvar_all = vae.encode(X_device)
        mu_all = mu_all.cpu()
        logvar_all = logvar_all.cpu()
        latent = mu_all.numpy()  # deterministic mean for clustering
    
        # For recon error compute actual recon from sampled z to reflect decoder behaviour
        z_sample = vae.reparameterize(mu_all.to(device), logvar_all.to(device))
        recon = vae.decode(z_sample).cpu()
        recon_errors = torch.mean((recon - X_all) ** 2, dim=1).numpy()
    
    print(f"📊 Latent stats: min={latent.min():.6e}, max={latent.max():.6e}, std={latent.std():.6e}")
    print(f"📊 Recon error stats: min={recon_errors.min():.6e}, max={recon_errors.max():.6e}, mean={recon_errors.mean():.6e}")
    
    # warn if collapse
    if latent.std() < 1e-5:
        print("⚠️ WARNING: latent space has extremely low std (possible collapse). Consider lowering beta_final, increasing input_noise_std, or using a richer encoder/decoder.")
    
    # ------------------------------
    # Scale latent
    # ------------------------------
    latent_scaler = StandardScaler()
    latent_scaled = latent_scaler.fit_transform(latent)
    
    # ------------------------------
    # FIXED: Dimensionality reduction before clustering (UMAP preferred)
    # ------------------------------
    latent_proj = None
    use_umap = _HAS_UMAP  # Create local copy to avoid reference issues
    n_target = min(umap_components, latent_scaled.shape[1]) if use_umap else min(pca_components, latent_scaled.shape[1])
    
    if use_umap:
        try:
            print("🗺️ Projecting latent space with UMAP...")
            reducer = umap.UMAP(n_components=n_target, random_state=42, n_neighbors=15, min_dist=0.1)
            latent_proj = reducer.fit_transform(latent_scaled)
            print(f"✅ UMAP output shape: {latent_proj.shape}")
        except Exception as e:
            print(f"⚠️ WARNING: UMAP failed ({e}). Falling back to PCA.")
            use_umap = False
    
    # Fallback to PCA if UMAP is not available or failed
    if not use_umap or latent_proj is None:
        n_components = min(pca_components, latent_scaled.shape[1])
        try:
            print("📊 Projecting latent space with PCA...")
            pca = PCA(n_components=n_components, random_state=42)
            latent_proj = pca.fit_transform(latent_scaled)
            explained = np.sum(pca.explained_variance_ratio_)
            if np.isnan(explained):
                raise ValueError("PCA explained variance is NaN")
            print(f"✅ PCA explained variance (sum {n_components} comp): {explained:.6f}")
        except Exception as e:
            print(f"⚠️ WARNING: PCA failed ({e}). Falling back to scaled latent without PCA.")
            latent_proj = latent_scaled
    
    # ------------------------------
    # Clustering
    # ------------------------------
    print("🎯 Clustering with HDBSCAN...")
    clusterer = hdbscan.HDBSCAN(min_cluster_size=hdbscan_min_cluster_size, min_samples=hdbscan_min_samples)
    cluster_labels = clusterer.fit_predict(latent_proj)
    
    # Compute cluster distances (to nearest centroid)
    unique_clusters = [c for c in set(cluster_labels) if c != -1]
    if len(unique_clusters) > 0:
        centroids = np.array([latent_proj[cluster_labels == c].mean(axis=0) for c in unique_clusters])
        distances = pairwise_distances(latent_proj, centroids)
        cluster_distance = distances.min(axis=1)
    else:
        cluster_distance = np.full(len(latent_proj), np.inf)
    
    # Show results
    unique_labels, counts = np.unique(cluster_labels, return_counts=True)
    print("📊 Clustering results:")
    for label, count in zip(unique_labels, counts):
        if label == -1:
            print(f"   Noise: {count} points")
        else:
            print(f"   Cluster {label}: {count} points")
    
    # ------------------------------
    # Save Outputs
    # ------------------------------
    print("💾 Saving outputs...")
    
    # Ensure output directories exist
    os.makedirs(os.path.dirname(out_clusters_csv), exist_ok=True)
    os.makedirs(os.path.dirname(out_novelty_csv), exist_ok=True)
    
    clusters_df = pd.DataFrame({
        "read_id": read_ids,
        "cluster_id": cluster_labels
    })
    clusters_df.to_csv(out_clusters_csv, index=False)
    
    novelty_df = pd.DataFrame({
        "read_id": read_ids,
        "recon_error": recon_errors,
        "cluster_distance": cluster_distance
    })
    novelty_df.to_csv(out_novelty_csv, index=False)
    
    print("✅ Complete! Files saved successfully:")
    print(f"   📊 Clusters: {out_clusters_csv}")
    print(f"   📈 Novelty: {out_novelty_csv}")
    print(f"🎯 Final clusters: {set(cluster_labels)}")

if __name__ == "__main__":
    main()
