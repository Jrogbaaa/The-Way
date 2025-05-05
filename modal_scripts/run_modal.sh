#!/bin/bash

# This script handles running Modal commands with proper path handling
# Usage: ./run_modal.sh [command] [input_file]
# Example: ./run_modal.sh run modal_scripts/train_model.py --input /path/to/input.json

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"
MODAL_ENV="$PROJECT_DIR/modal-env"

# Activate the Modal environment
source "$MODAL_ENV/bin/activate"

# Execute the Modal command
cd "$PROJECT_DIR"
python -m modal "$@"

# Return the exit code
exit $? 