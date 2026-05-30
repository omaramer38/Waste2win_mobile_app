# inference.py

import cv2
from pathlib import Path
from ultralytics import YOLO
from config import WEIGHTS_PATH, INPUT_PATH, OUTPUT_PATH, INFERENCE_CONFIG, TRAINING_CONFIG
from weight_estimator import estimate_weight, get_material, is_waste

# ============================================
# LOAD MODEL
# ============================================
MODEL_PATH = WEIGHTS_PATH / TRAINING_CONFIG['name'] / 'weights' / 'best.pt'

if MODEL_PATH.exists():
    model = YOLO(str(MODEL_PATH))
    print(f" Loaded trained model from {MODEL_PATH}")
else:
    print(f" Model not found at {MODEL_PATH}")
    print("Please run 'python train.py' first")
    exit()

# ============================================
# DETECT FUNCTION
# ============================================
def detect_image(image_path, save_result=True, weight_method="size"):
    """
    Detect waste in image and estimate weights
    weight_method:
        - "size"  -> based on object size
        - "fixed" -> fixed average weight
    """

    print(f"\n Processing: {Path(image_path).name}")

    # Run detection
    results = model(
        image_path,
        conf=INFERENCE_CONFIG["conf_threshold"],
        iou=INFERENCE_CONFIG["iou_threshold"],
        max_det=INFERENCE_CONFIG["max_detections"]
    )

    img_h, img_w = results[0].orig_shape[:2]

    detections = []
    total_weight = 0
    material_counts = {}

    if results[0].boxes:

        boxes = results[0].boxes

        for box in boxes:

            class_name = model.names[int(box.cls[0])]
            confidence = float(box.conf[0])
            bbox = box.xyxy[0].tolist()

            # ============================================
            # FIX PLASTIC vs METAL CONFUSION
            # ============================================

            x1, y1, x2, y2 = bbox

            width = x2 - x1
            height = y2 - y1

            aspect_ratio = height / width if width > 0 else 1

            # Many plastic bottles are predicted as metal
            if class_name == "metal":

                # Tall bottle-like object
                if aspect_ratio > 1.7:
                    class_name = "plastic"

                # Large bottle dimensions
                elif width > 80 and height > 150:
                    class_name = "plastic"

            # ============================================
            # SKIP NON-WASTE
            # ============================================

            if not is_waste(class_name):
                print(f"    Skipped: {class_name} (not waste)")
                continue

            # ============================================
            # ESTIMATE WEIGHT
            # ============================================

            weight = estimate_weight(
                bbox,
                class_name,
                img_w,
                img_h,
                method=weight_method
            )

            material = get_material(class_name)

            total_weight += weight
            material_counts[material] = material_counts.get(material, 0) + 1

            detections.append({
                'class': class_name,
                'material': material,
                'confidence': confidence,
                'weight_g': weight,
                'bbox': bbox
            })

            print(
                f"    {class_name} ({material}): "
                f"{weight}g)"
            )

    else:
        print("    No objects detected")

    # ============================================
    # SUMMARY
    # ============================================

    print(f"\n    Summary: {len(detections)} items detected")

    for material, count in material_counts.items():
        print(f"      {material}: {count} item(s)")

    print(
        f"    TOTAL WEIGHT: "
        f"{total_weight:.1f}g ({total_weight/1000:.2f}kg)"
    )

    # ============================================
    # DRAW & SAVE RESULTS
    # ============================================

    if save_result and detections:

        img = cv2.imread(image_path)

        for det in detections:

            x1, y1, x2, y2 = [int(c) for c in det['bbox']]

            # Draw box
            cv2.rectangle(
                img,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            # Draw label
            label = f"{det['class']}: {det['weight_g']}g"

            cv2.putText(
                img,
                label,
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2
            )

        OUTPUT_PATH.mkdir(exist_ok=True)

        output_path = OUTPUT_PATH / f"result_{Path(image_path).name}"

        cv2.imwrite(str(output_path), img)

        print(f"\n    Saved to: {output_path}")

    return {
        'detections': detections,
        'total_weight_g': round(total_weight, 2),
        'total_weight_kg': round(total_weight / 1000, 3),
        'items_count': len(detections),
        'material_counts': material_counts
    }

# ============================================
# PROCESS FOLDER
# ============================================
def detect_folder(folder_path=INPUT_PATH, weight_method="size"):

    folder = Path(folder_path)

    if not folder.exists():

        print(f" Folder not found: {folder_path}")

        print(f"Creating folder: {folder_path}")

        folder.mkdir(parents=True)

        print(f"Please add images to {folder_path} and run again")

        return

    images = (
        list(folder.glob("*.jpg")) +
        list(folder.glob("*.png")) +
        list(folder.glob("*.jpeg"))
    )

    if not images:

        print(f" No images found in {folder_path}")

        print(f"Add .jpg or .png images to {folder_path}")

        return

    print(f"\n Found {len(images)} image(s)")
    print("=" * 60)

    results = []

    for img in images:

        result = detect_image(
            str(img),
            save_result=True,
            weight_method=weight_method
        )

        if result:
            results.append(result)

    # ============================================
    # FINAL SUMMARY
    # ============================================

    if results:

        total_weight = sum(r['total_weight_g'] for r in results)

        total_items = sum(r['items_count'] for r in results)

        print("\n" + "=" * 60)
        print(" FINAL SUMMARY")
        print("=" * 60)

        print(f" Images processed: {len(results)}")

        print(f" Total waste items: {total_items}")

        print(
            f" Total waste weight: "
            f"{total_weight:.1f}g ({total_weight/1000:.2f}kg)"
        )

        print("=" * 60)

# ============================================
# MAIN
# ============================================
if __name__ == "__main__":

    import argparse

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--method",
        type=str,
        default="size",
        choices=["size", "fixed"],
        help="Weight estimation method"
    )

    args = parser.parse_args()

    print("=" * 60)
    print(" WASTE DETECTION & WEIGHT ESTIMATION")
    print("=" * 60)

    print(f" Weight method: {args.method}")

    detect_folder(weight_method=args.method)