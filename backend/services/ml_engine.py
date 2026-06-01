import numpy as np
import base64
from PIL import Image
import io
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout, BatchNormalization
from tensorflow.keras import Model
import os

# ─────────────────────────────────────
# HAM10000 CLASSES → APP CONDITIONS
# ─────────────────────────────────────
CLASS_NAMES = ['MEL', 'NV', 'BCC', 'AKIEC', 'BKL', 'DF', 'VASC']

CLASS_MAP = {
    'MEL'  : 'Melanoma',
    'NV'   : 'Melanocytic Nevi',
    'BCC'  : 'Basal Cell Carcinoma',
    'AKIEC': 'Actinic Keratosis',
    'BKL'  : 'Benign Keratosis',
    'DF'   : 'Dermatofibroma',
    'VASC' : 'Vascular Lesion',
}

# ─────────────────────────────────────
# MODEL PATH
# ─────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'ml_model', 'skin_model.h5')

model = None

# ─────────────────────────────────────
# BUILD BASE MODEL (fallback)
# ─────────────────────────────────────
def build_base_model():
    base = EfficientNetB0(
        weights='imagenet',
        include_top=False,
        input_shape=(224, 224, 3)
    )
    base.trainable = False
    x = GlobalAveragePooling2D()(base.output)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.2)(x)
    output = Dense(len(CLASS_NAMES), activation='softmax')(x)
    return Model(inputs=base.input, outputs=output)

# ─────────────────────────────────────
# LOAD MODEL
# ─────────────────────────────────────
def load_model():
    global model
    if model is None:
        if os.path.exists(MODEL_PATH):
            print(f"✅ Loading trained model from {MODEL_PATH}")
            model = tf.keras.models.load_model(MODEL_PATH)
            print("✅ Trained skin model loaded!")
        else:
            print("⚠️ Trained model not found — using ImageNet weights")
            model = build_base_model()
            print("✅ Base model loaded!")
    return model

# ─────────────────────────────────────
# PREPROCESS IMAGE
# ─────────────────────────────────────
def preprocess_image(image_base64):
    try:
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]

        image_base64 = image_base64.strip().replace('\n', '').replace('\r', '').replace(' ', '')

        missing_padding = len(image_base64) % 4
        if missing_padding:
            image_base64 += '=' * (4 - missing_padding)

        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        image = image.resize((224, 224))
        img_array = np.array(image, dtype=np.float32)
        img_array = preprocess_input(img_array)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array

    except Exception as e:
        print(f"❌ Preprocess Error: {e}")
        raise

# ─────────────────────────────────────
# PREDICT
# ─────────────────────────────────────
def predict_skin_condition(image_base64):
    try:
        m           = load_model()
        img         = preprocess_image(image_base64)
        predictions = m.predict(img, verbose=0)

        predicted_index = int(np.argmax(predictions[0]))
        confidence      = float(np.max(predictions[0])) * 100
        ham_class       = CLASS_NAMES[predicted_index]
        condition       = CLASS_MAP.get(ham_class, 'Normal Skin')

        all_scores = {
            CLASS_MAP.get(CLASS_NAMES[i], CLASS_NAMES[i]):
            round(float(predictions[0][i]) * 100, 2)
            for i in range(len(CLASS_NAMES))
        }

        print(f"🔬 ML Prediction: {ham_class} → {condition} ({confidence:.1f}%)")

        return {
            'condition' : condition,
            'confidence': round(confidence, 1),
            'all_scores': all_scores,
            'ml_used'   : True
        }

    except Exception as e:
        print(f"❌ ML Engine Error: {e}")
        return None