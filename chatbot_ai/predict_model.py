import json
import os
import sys

import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = joblib.load(os.path.join(BASE_DIR, "model.pkl"))
vectorizer = joblib.load(os.path.join(BASE_DIR, "vectorizer.pkl"))


def predict(question: str) -> dict:
    predicted_label = model.predict(vectorizer.transform([question]))[0]
    return {
        "text": question,
        "label": predicted_label,
        "response": predicted_label,
    }


def read_payload() -> dict:
    raw_stdin = sys.stdin.read().strip()
    if raw_stdin:
        return json.loads(raw_stdin)

    with open(os.path.join(BASE_DIR, "question.json"), "r", encoding="utf-8") as f:
        return json.load(f)


payload = read_payload()
output = predict(str(payload.get("text", "")))

if not sys.stdin.isatty():
    print(json.dumps(output, ensure_ascii=False))
else:
    with open(os.path.join(BASE_DIR, "output_answer.json"), "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=4)
    print("Reply saved in output_answer.json")
