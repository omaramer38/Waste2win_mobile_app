import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import joblib

# اقرأ الداتا UTF-8
df = pd.read_csv("new_csv.txt", encoding="utf-8")
# df = pd.read_csv("new_dataset_4000.csv", encoding="utf-8")

# X = النصوص، y = الليبل
X = df["text"]
y = df["label"]

# vectorizer يدعم العربي
vectorizer = TfidfVectorizer(analyzer="word", ngram_range=(1,2))
X_vec = vectorizer.fit_transform(X)

# split data مع stratify لتوزيع كل label بشكل متساوي
X_train, X_test, y_train, y_test = train_test_split(
    X_vec, y, test_size=0.3, random_state=41, stratify=y
)

# model مع regularization لتقليل overfitting
model = LogisticRegression(max_iter=400, C=2.0, penalty='l2', solver='lbfgs', class_weight='balanced')
model.fit(X_train, y_train)

# test
y_pred = model.predict(X_test)

print("Test Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# cross-validation 5 folds لتقييم الأداء الحقيقي
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(model, X_vec, y, cv=cv, scoring='accuracy')
print("Cross-validation Accuracy:", cv_scores.mean())


# حفظ الموديل والـ vectorizer
joblib.dump(model, "model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")
print("Model and vectorizer saved.")
