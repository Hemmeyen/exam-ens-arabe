/**
 * مدقق ملفات الاختبارات.
 * الاستعمال من جذر المشروع: node tools/valider.mjs
 * يعيد code 1 عند وجود خطأ مانع، ويمكن تشغيله في GitHub Actions.
 */
import { readFileSync, existsSync } from "node:fs";

const AUCUNE = ["aucune des réponses proposées", "لا شيء من الإجابات المقترحة", "لا شيء مما سبق"];
let erreurs = 0, avertissements = 0;
const err = (m) => { console.error("  خطأ      " + m); erreurs++; };
const avt = (m) => { console.warn ("  تنبيه     " + m); avertissements++; };
function lire(chemin){
  if(!existsSync(chemin)){ err(`الملف غير موجود: ${chemin}`); return null; }
  try { return JSON.parse(readFileSync(chemin, "utf8")); }
  catch(e){ err(`JSON غير صالح في ${chemin} — ${e.message}`); return null; }
}
const manifeste = lire("exams/manifest.json");
if(!manifeste) process.exit(1);
if(!Array.isArray(manifeste.epreuves)) { err("manifest.json: الحقل epreuves مفقود أو ليس مصفوفة"); process.exit(1); }
const slugs = new Set();
for(const ep of manifeste.epreuves){
  console.log(`\n> ${ep.slug}  (${ep.fichier})`);
  if(slugs.has(ep.slug)) err(`slug مكرر: ${ep.slug}`);
  slugs.add(ep.slug);
  if(!ep.titre) err("العنوان مفقود في manifest");
  const ex = lire(ep.fichier);
  if(!ex) continue;
  if(!Array.isArray(ex.questions) || !ex.questions.length){ err("لا توجد أسئلة"); continue; }
  const ids = new Set();
  const domaines = {};
  let nbMultiple = 0;
  ex.questions.forEach((q, i) => {
    const p = `Q#${i+1} (${q.id || "بدون id"})`;
    if(!q.id) err(`${p}: id مفقود`);
    else if(ids.has(q.id)) err(`${p}: id مكرر`);
    ids.add(q.id);
    if(!q.domaine) err(`${p}: domaine مفقود`);
    else domaines[q.domaine] = (domaines[q.domaine] || 0) + 1;
    if(!["unique","multiple"].includes(q.type)) err(`${p}: type يجب أن يكون unique أو multiple`);
    if(!q.enonce) err(`${p}: نص السؤال فارغ`);
    if(!Array.isArray(q.options) || q.options.length < 3) err(`${p}: يلزم 3 خيارات على الأقل`);
    if(!q.options) return;
    const oids = new Set();
    q.options.forEach(o => {
      if(!o.id) err(`${p}: خيار بدون id`);
      else if(oids.has(o.id)) err(`${p}: id خيار مكرر ${o.id}`);
      oids.add(o.id);
      if(!o.texte) err(`${p}: الخيار ${o.id} بدون نص`);
      if(typeof o.correcte !== "boolean") err(`${p}: correcte يجب أن يكون true/false`);
      if(!o.feedback) avt(`${p}: الخيار ${o.id} بدون feedback`);
    });
    const bonnes = q.options.filter(o => o.correcte);
    if(bonnes.length === 0) err(`${p}: لا توجد إجابة صحيحة`);
    if(q.type === "unique" && bonnes.length !== 1) err(`${p}: unique لكن عدد الإجابات الصحيحة ${bonnes.length}`);
    if(q.type === "multiple"){
      nbMultiple++;
      if(bonnes.length === 1) avt(`${p}: multiple بإجابة صحيحة واحدة فقط`);
    }
    const opt = q.options.find(o => AUCUNE.some(x => (o.texte || "").toLowerCase().includes(x)));
    if(opt && opt.correcte && bonnes.length > 1) err(`${p}: خيار «لا شيء» صحيح مع خيار صحيح آخر`);
    if(!q.feedback_general) avt(`${p}: feedback_general مفقود`);
    if(!q.source) avt(`${p}: source مفقود`);
    if(![1,2,3].includes(q.difficulte)) avt(`${p}: difficulte خارج 1-3`);
    if(ex.format === "comite" && typeof q.points !== "number") err(`${p}: points مفقود في صيغة comite`);
  });
  const n = ex.questions.length;
  const total = ex.questions.reduce((s,q)=>s+(q.points||0),0);
  console.log(`  ${n} سؤال · ${nbMultiple} سؤال متعدد الإجابات`);
  if(ex.format === "comite") console.log(`  المجموع: ${total.toFixed(2)} نقطة`);
  console.log("  التوزيع: " + Object.entries(domaines).map(([d,c]) => `${d} ${c}`).join(" | "));
  if(ep.questions && ep.questions !== n) avt(`manifest يعلن ${ep.questions} سؤالا، والملف يحتوي ${n}`);
  if(typeof ep.total_points === "number" && Math.abs(ep.total_points-total) > 1e-9) err(`مجموع النقاط ${total} لا يطابق manifest ${ep.total_points}`);
  if(typeof ex.total_points === "number" && Math.abs(ex.total_points-total) > 1e-9) err(`مجموع النقاط ${total} لا يطابق total_points ${ex.total_points}`);
}
console.log(`\n${erreurs} خطأ، ${avertissements} تنبيه.`);
process.exit(erreurs ? 1 : 0);
