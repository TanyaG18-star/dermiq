import numpy as np
import base64
from PIL import Image
import io
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras import Model

# ─────────────────────────────────────
# SKIN CONDITIONS THE MODEL DETECTS
# ─────────────────────────────────────
SKIN_CONDITIONS = [
    'Acne',
    'Eczema',
    'Melanoma',
    'Psoriasis',
    'Rosacea',
    'Normal Skin',
    'Hyperpigmentation',
    'Fungal Infection'
]

model = None

def build_model():
    base = EfficientNetB0(
        weights='imagenet',
        include_top=False,
        input_shape=(224, 224, 3)
    )
    base.trainable = False
    x = GlobalAveragePooling2D()(base.output)
    x = Dropout(0.3)(x)
    output = Dense(len(SKIN_CONDITIONS), activation='softmax')(x)
    return Model(inputs=base.input, outputs=output)

def load_model():
    global model
    if model is None:
        print("🔄 Loading EfficientNet model...")
        model = build_model()
        print("✅ Model loaded successfully!")
    return model

def preprocess_image(image_base64):
    try:
        # Step 1: Remove data URL prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]

        # Step 2: Clean whitespace and newlines
        image_base64 = image_base64.strip().replace('\n', '').replace('\r', '').replace(' ', '')

        # Step 3: Fix base64 padding
        missing_padding = len(image_base64) % 4
        if missing_padding:
            image_base64 += '=' * (4 - missing_padding)

        # Step 4: Decode base64 to bytes
        image_data = base64.b64decode(image_base64)

        # Step 5: Open image
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        image = image.resize((224, 224))

        # Step 6: Convert to numpy array
        img_array = np.array(image, dtype=np.float32)
        img_array = preprocess_input(img_array)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array

    except Exception as e:
        print(f"❌ Preprocess Error: {e}")
        print(f"❌ Base64 length: {len(image_base64)}")
        print(f"❌ First 100 chars: {image_base64[:100]}")
        raise

def predict_skin_condition(image_base64):
    try:
        m = load_model()
        img = preprocess_image(image_base64)
        predictions = m.predict(img, verbose=0)
        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0])) * 100
        condition = SKIN_CONDITIONS[predicted_index]

        all_scores = {
            SKIN_CONDITIONS[i]: round(float(predictions[0][i]) * 100, 2)
            for i in range(len(SKIN_CONDITIONS))
        }

        print(f"🔬 ML Prediction: {condition} ({confidence:.1f}%)")

        return {
            'condition': condition,
            'confidence': round(confidence, 1),
            'all_scores': all_scores,
            'ml_used': True
        }

    except Exception as e:
        print(f"❌ ML Engine Error: {e}")
        return None