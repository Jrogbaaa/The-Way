import requests
import json
import base64
from pathlib import Path
import time

# Generate a simple test image (a solid color square)
def generate_test_image(color=(255, 0, 0), size=(512, 512)):
    from PIL import Image
    img = Image.new('RGB', size, color=color)
    buffer = Image.new('RGB', size, color=color)
    import io
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return img_base64

# Test parameters
model_name = f"test-model-{int(time.time())}"
instance_prompt = "photo of sks person"
training_steps = 500  # Keep small for a quick test

# Generate 5 test images with different colors
colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (0, 255, 255)]
image_data_list = []

for i, color in enumerate(colors):
    base64_data = generate_test_image(color)
    image_data_list.append({
        "base64Data": base64_data,
        "name": f"test_image_{i}.jpg",
        "type": "image/jpeg"
    })

print(f"Created {len(image_data_list)} test images")
print(f"Testing with model_name: {model_name}")

# Step 1: Call the validation endpoint
print("\n--- Testing validation endpoint ---")
validation_response = requests.post(
    "http://localhost:3000/api/modal/validate-model",
    json={
        "imageDataList": image_data_list,
        "instancePrompt": instance_prompt,
        "modelName": model_name,
        "trainingSteps": training_steps
    }
)

print(f"Validation status code: {validation_response.status_code}")
validation_data = validation_response.json()
print(f"Validation response: {json.dumps(validation_data, indent=2)}")

if validation_response.status_code != 200 or validation_data.get("status") == "error":
    print("Validation failed, not proceeding with training")
    exit(1)

# Step 2: Call the training endpoint
print("\n--- Testing training endpoint ---")
train_response = requests.post(
    "http://localhost:3000/api/modal/train-model",
    json={
        "imageDataList": image_data_list,
        "instancePrompt": instance_prompt,
        "modelName": model_name,
        "trainingSteps": training_steps
    }
)

print(f"Training status code: {train_response.status_code}")
train_data = train_response.json()
print(f"Training response: {json.dumps(train_data, indent=2)}")

# If training started successfully, we'll get a training ID
if train_response.status_code == 202 and train_data.get("status") == "success":
    training_id = train_data.get("trainingId")
    print(f"\nTraining started with ID: {training_id}")
    print("Check the status with:")
    print(f"curl http://localhost:3000/api/modal/model-status/{training_id}")
else:
    print("Training failed to start") 