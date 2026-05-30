import math
from config import MATERIAL_WEIGHTS, WEIGHT_RANGES, PIXEL_TO_CM_RATIO

def get_material(class_name):
    """Get material type from class name"""
    name = class_name.lower()
    if "glass" in name:
        return "glass"
    elif "metal" in name or "can" in name:
        return "metal"
    elif "paper" in name or "cardboard" in name:
        return "paper"
    elif "plastic" in name or "bottle" in name or "cup" in name:
        return "plastic"
    return "plastic"

def is_waste(class_name):
    """Check if object is waste"""
    name = class_name.lower()
    waste_keywords = ['plastic', 'glass', 'metal', 'paper', 'bottle', 'can', 'cup', 'bag']
    return any(k in name for k in waste_keywords)

def get_weight(class_name, bbox, img_w, img_h):
    """Calculate weight based on size (same as GUI)"""
    x1, y1, x2, y2 = bbox
    area = (x2 - x1) * (y2 - y1)
    img_area = img_w * img_h
    size = area / img_area
    
    if "glass" in class_name.lower():
        return round(80 + size * 420, 1)
    elif "metal" in class_name.lower():
        return round(10 + size * 30, 1)
    elif "paper" in class_name.lower():
        return round(5 + size * 25, 1)
    else:
        # Plastic: lighter weight
        return round(5 + size * 15, 1)

def calculate_weight_fixed(class_name):
    """Use fixed average weight per material"""
    material = get_material(class_name)
    return MATERIAL_WEIGHTS.get(material, MATERIAL_WEIGHTS["default"])

def estimate_weight(bbox, class_name, img_w, img_h, method="size"):
    """Main weight estimation function"""
    if not is_waste(class_name):
        return 0.0
    
    if method == "fixed":
        return calculate_weight_fixed(class_name)
    else:
        # Use the same formula as GUI
        return get_weight(class_name, bbox, img_w, img_h)