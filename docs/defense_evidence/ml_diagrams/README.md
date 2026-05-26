# ML хамгаалалтын зурагнууд

Энэ хавтас дахь зургуудыг `scripts/audit/generate_ml_defense_diagrams.py` автоматаар үүсгэсэн.

Эх сурвалж: `docs/defense_evidence/defense_evidence.json`

- Өгөгдөл: `data/sessions.csv` synthetic/simulated dataset
- Нийт session: 1200
- Split: 720 train / 240 validation / 240 test
- Model: XGBoost (xgboost-synthetic-mvp)
- Threshold: 0.39
- Accuracy: 0.825
- Precision: 0.815
- Recall: 0.842
- F1: 0.828
- ROC AUC: 0.841

## Файлууд

1. `01_ml_pipeline_diagram.png` - Машин сургалтын дамжлага
2. `02_train_validation_test_split.png` - Сургалт/validation/test хуваалт
3. `03_confusion_matrix.png` - Төөрөгдлийн матриц
4. `04_precision_recall_f1_bar.png` - Ангиллын metric bar chart
5. `05_shap_feature_impact.png` - SHAP feature impact chart
6. `06_roc_curve.png` - ROC муруй ба AUC
7. `06_roc_curve_points.json` - ROC curve-ийн raw FPR/TPR утгууд

Тайлбар: Энэ нь дипломын хамгаалалтын demo readiness-д зориулсан синтетик/симуляц үнэлгээ. Бодит хэрэглэгчийн production performance гэж тайлбарлаж болохгүй.
