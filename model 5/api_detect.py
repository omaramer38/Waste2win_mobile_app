import argparse
import base64
import contextlib
import io
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("image_path")
    parser.add_argument("--method", default="size", choices=["size", "fixed"])
    args = parser.parse_args()

    logs = io.StringIO()
    with contextlib.redirect_stdout(logs):
        from inference import detect_image

        result = detect_image(
            args.image_path,
            save_result=True,
            weight_method=args.method,
        )

    output_path = Path(__file__).parent / "output_results" / f"result_{Path(args.image_path).name}"
    if output_path.exists():
        result["annotated_image"] = (
            "data:image/jpeg;base64,"
            + base64.b64encode(output_path.read_bytes()).decode("ascii")
        )

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
