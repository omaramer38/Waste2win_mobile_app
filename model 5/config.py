# config.py
from pathlib import Path

# ============================================
# PATHS
# ============================================
BASE_DIR = Path(__file__).parent
WEIGHTS_PATH = BASE_DIR / "weights"
OUTPUT_PATH = BASE_DIR / "output_results"

# Create folders
for p in [WEIGHTS_PATH, OUTPUT_PATH]:
    p.mkdir(exist_ok=True)

# ============================================
# TRAINING CONFIGURATION (for reference only)
# ============================================
TRAINING_CONFIG = {
    "name": "waste_model",
}

# ============================================
# WEIGHT ESTIMATION
# ============================================
# Average weight per material type (grams)
MATERIAL_WEIGHTS = {
    "plastic": 25,      # average plastic bottle
    "glass": 250,       # average glass bottle
    "metal": 18,        # average soda can
    "paper": 10,        # average paper item
    "default": 20
}

# Weight ranges for size-based estimation
# config.py
WEIGHT_RANGES = {
    "plastic": (3, 25),    
    "glass": (80, 500),
    "metal": (10, 100),
    "paper": (2, 30),
}


PIXEL_TO_CM_RATIO = 0.03

# ============================================
# INFERENCE CONFIGURATION
# ============================================
INFERENCE_CONFIG = {
    "conf_threshold": 0.25,
    "iou_threshold": 0.45,
    "max_detections": 100
}