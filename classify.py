import sys
import json
import tensorflow as tf
import numpy as np
import cv2
import os

# Disable TensorFlow logs and oneDNN optimizations
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

# Load the trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "skin_classifier.h5")

if not os.path.exists(MODEL_PATH):
    print(json.dumps({"error": f"Model file not found: {MODEL_PATH}"}))
    sys.exit(1)

try:
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)  # Fix: Disable compilation
except Exception as e:
    print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
    sys.exit(1)

# Define skin type labels
SKIN_TYPES = ["Acne", "DarkCircles", "Dry", "Normal", "Oily", "Wrinkled"]

# Ensure an image path is provided
if len(sys.argv) < 2:
    print(json.dumps({"error": "Invalid arguments. Usage: python classify.py <image_path>"}))
    sys.exit(1)


image_path = sys.argv[1]  

# Ensure full absolute path for the uploaded image
image_path = os.path.join(os.path.dirname(__file__), "uploads", os.path.basename(image_path))


if not os.path.exists(image_path):
    print(json.dumps({"error": f"Image file not found: {image_path}"}))
    sys.exit(1)

# Load and preprocess the image
try:
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image from path: {image_path}")

    img = cv2.resize(img, (224, 224))
    img = img.astype("float32") / 255.0
    img = np.expand_dims(img, axis=0)
except Exception as e:
    print(json.dumps({"error": f"Image processing error: {str(e)}"}))
    sys.exit(1)

# Predict skin type
try:
    predictions = model.predict(img)
    if predictions is None or len(predictions) == 0:
        raise ValueError("Model did not return any predictions.")

    predicted_index = np.argmax(predictions[0])
    predicted_skin_type = SKIN_TYPES[predicted_index]
except Exception as e:
    print(json.dumps({"error": f"Prediction error: {str(e)}"}))
    sys.exit(1)

# Return JSON result
print(json.dumps({"skin_type": predicted_skin_type}))
