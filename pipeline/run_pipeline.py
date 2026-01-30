#!/usr/bin/env python3
"""
DeepSea-AI Pipeline Runner - Main Entry Point
"""
import os
import sys

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))

# Import and run the pipeline
from run_pipeline import main

if __name__ == "__main__":
    main()