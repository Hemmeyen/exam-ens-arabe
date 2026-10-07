# مسابقة معلم رئيسي عربي — حزمة اختبارات JSON

هذا المستودع مبني ليكون قابلا للتوسعة: كل اختبار يوجد في ملف JSON مستقل داخل `exams/`، ويكفي تسجيله في `exams/manifest.json` حتى يتمكن الموقع من عرضه.

## البنية

```text
exams/
  manifest.json
  enseignant-principal-arabe-A.json
tools/
  valider.mjs
.github/workflows/
  validate-exams.yml
```

## إضافة موضوع جديد

1. انسخ ملف اختبار موجود واجعله مثلا `enseignant-principal-arabe-B.json`.
2. غيّر `exam_id` والعنوان والأسئلة.
3. أضف مدخلا جديدا إلى `exams/manifest.json`.
4. شغّل:

```bash
node tools/valider.mjs
```

## ملاحظة المصدر

الاختبار A محاكاة تدريبية، وليس موضوعا رسميا للـCNC. صيغت الأسئلة بالاستفادة من المواضيع القديمة المرفقة بالمشروع ومن منطق QCM الحديث. عند إضافة موضوع رسمي حقيقي يفضّل إبقاؤه في ملف مستقل وعدم خلطه بأسئلة المحاكاة.
# exam-ens-arabe
