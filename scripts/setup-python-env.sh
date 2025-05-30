#!/bin/bash
# Setup script for Python environment with correct dependencies

# Ensure script exits on error
set -e

# Check if Python virtualenv exists
if [ ! -d "modal-env" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv modal-env
else
    echo "Using existing Python virtual environment..."
fi

# Activate virtual environment
source modal-env/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies from requirements.txt
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

# Fix the huggingface_hub and diffusers version compatibility
echo "Ensuring huggingface_hub and diffusers compatibility..."
pip uninstall -y huggingface_hub diffusers
pip install huggingface_hub==0.16.4
pip install diffusers==0.19.3

# Verify installations
echo "Verifying installations..."
pip list | grep "diffusers\|huggingface_hub\|modal"

echo "Python environment setup complete!"
echo "To activate the environment, run: source modal-env/bin/activate" 