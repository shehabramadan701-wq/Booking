// تخزين الحجوزات في ملف JSON — حل مؤقت للتجربة لحين ربط PostgreSQL (db/schema.sql).
// الواجهة (get/set/all) صغيرة عمداً حتى تُستبدل بقاعدة البيانات دون تغيير الـ routes.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = resolve(dirname(fileURLToPath(import.meta.url)), '../data/bookings.json');
let cache;
function load() {
  if (!cache) {
    try { cache = new Map(Object.entries(JSON.parse(readFileSync(file, 'utf8')))); } catch { cache = new Map(); }
  }
  return cache;
}
function persist() {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, JSON.stringify(Object.fromEntries(cache)));
  renameSync(`${file}.tmp`, file); // كتابة ذرّية: لا يتلف الملف لو انقطع التشغيل
}

export const bookingStore = {
  get: (ref) => load().get(ref),
  set(ref, booking) { load().set(ref, booking); persist(); return booking; },
  all: () => [...load().values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
};
