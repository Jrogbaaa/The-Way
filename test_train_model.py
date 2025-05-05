import modal
import os
import time
import json

# Define the Modal app
app = modal.App("test-image-model-trainer")

# Define persistent volume to store temporary data and models
volume = modal.Volume.from_name("model-training-data", create_if_missing=True)
VOLUME_MOUNT_PATH = "/model-data"

@app.function(volumes={VOLUME_MOUNT_PATH: volume})
def test_volume_function():
    # Create a test directory
    os.makedirs(f"{VOLUME_MOUNT_PATH}/test", exist_ok=True)
    
    # Create a test file
    test_file_path = f"{VOLUME_MOUNT_PATH}/test/test_file.txt"
    with open(test_file_path, "w") as f:
        f.write(f"Test file created at {time.ctime()}")
    
    # Read the test file
    with open(test_file_path, "r") as f:
        content = f.read()
    
    return {
        "status": "success",
        "file_path": test_file_path,
        "content": content
    }

if __name__ == "__main__":
    print("Testing Modal setup for model training...")
    with app.run():
        result = test_volume_function.remote()
        print(f"Result: {json.dumps(result, indent=2)}")
    print("Test completed!") 