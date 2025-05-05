#!/usr/bin/env python3
"""
Test script to verify Modal is working correctly.
Run this before attempting to use the full train_model.py script.

Usage:
  python test_modal.py

This should display information about your Modal setup and verify connection.
"""

import sys
import os
import json
import modal

# Create a simple Modal app for testing
app = modal.App("modal-test")

@app.function()
def hello_world():
    """Simple test function to verify Modal is working."""
    import platform
    return {
        "message": "Modal is working!",
        "python_version": sys.version,
        "platform": platform.platform(),
        "modal_token_path": os.path.exists(os.path.expanduser("~/.modal/token")),
    }

@app.function(gpu="T4")
def test_gpu():
    """Test if GPU access is working."""
    try:
        import torch
        gpu_available = torch.cuda.is_available()
        gpu_name = torch.cuda.get_device_name(0) if gpu_available else "None"
        return {
            "gpu_available": gpu_available,
            "gpu_name": gpu_name,
            "torch_version": torch.__version__,
        }
    except Exception as e:
        return {
            "error": str(e),
            "gpu_available": False,
        }

if __name__ == "__main__":
    print("Testing Modal connection...")
    try:
        with app.run():
            result = hello_world.remote()
            print("\n✅ Modal is configured correctly!")
            print(json.dumps(result, indent=2))
            
            print("\nTesting GPU access...")
            gpu_result = test_gpu.remote()
            
            if gpu_result.get("gpu_available", False):
                print(f"\n✅ GPU access is working! ({gpu_result.get('gpu_name')})")
            else:
                print("\n❌ GPU is not available or there was an error:")
                
            print(json.dumps(gpu_result, indent=2))
    except modal.exception.AuthError:
        print("\n❌ Modal authentication failed. Please run 'python -m modal setup' to configure your Modal token.")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\nTroubleshooting steps:")
        print("1. Ensure you've run 'python -m modal setup'")
        print("2. Check your internet connection")
        print("3. Check if Modal service is up: https://status.modal.com") 