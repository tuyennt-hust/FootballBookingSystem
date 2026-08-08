const fs = require('fs');
const path = require('path');

const root = process.cwd();
const failures = [];
const warnings = [];

function rel(file) { return path.relative(root, file).replaceAll(path.sep, '/'); }
function fail(message) { failures.push(message); }
function warn(message) { warnings.push(message); }
function read(relativePath) { return fs.readFileSync(path.join(root, relativePath), 'utf8'); }
function exists(relativePath) { return fs.existsSync(path.join(root, relativePath)); }

function walk(directory, extensions = null) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath, extensions);
    if (!extensions) return [fullPath];
    return extensions.some((extension) => entry.name.endsWith(extension)) ? [fullPath] : [];
  });
}

const requiredFinalFiles = [
  'VERSION',
  'CHANGELOG.md',
  'README.md',
  'docs/API.md',
  'docs/Database.md',
  'docs/UserGuide.md',
  'docs/Deployment.md',
  'docs/TestPlan.md',
  'docs/Security.md',
  'docs/Part09-Finalization.md',
  'diagrams/ERD.png',
  'diagrams/UseCase.png',
  'diagrams/Architecture.png',
  'diagrams/SequenceBooking.png',
  'diagrams/source/ERD.dot',
  'diagrams/source/UseCase.dot',
  'diagrams/source/Architecture.dot',
  'diagrams/source/SequenceBooking.dot',
  'scripts/check-database.js',
  'src/middlewares/securityMiddleware.js',
  'tests/database/final_smoke_test.sql',
  'tests/unit/security.test.js',
  'tests/unit/auth.test.js',
  'tests/unit/pitch.test.js',
];
requiredFinalFiles.forEach((file) => { if (!exists(file)) fail(`Thiếu file final: ${file}`); });

const packageJson = JSON.parse(read('package.json'));
const version = read('VERSION').trim();
if (version !== '0.9.0') fail(`VERSION final phải là 0.9.0, hiện tại ${version}`);
if (packageJson.version !== version) fail('package.json version không khớp VERSION.');
for (const scriptName of ['verify', 'audit', 'test', 'check', 'db:check']) {
  if (!packageJson.scripts?.[scriptName]) fail(`package.json thiếu script ${scriptName}`);
}

const appSource = read('src/app.js');
for (const expected of [
  "app.disable('x-powered-by')",
  'app.use(securityHeaders)',
  "express.json({ limit: '100kb' })",
  "express.urlencoded({ extended: true, limit: '100kb' })",
]) {
  if (!appSource.includes(expected)) fail(`app.js thiếu hardening: ${expected}`);
}

const securitySource = read('src/middlewares/securityMiddleware.js');
for (const header of [
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
]) {
  if (!securitySource.includes(header)) fail(`securityMiddleware thiếu header ${header}`);
}

const views = walk(path.join(root, 'views'), ['.ejs']);
for (const file of views) {
  const source = fs.readFileSync(file, 'utf8');
  if (/\son[a-z]+\s*=/i.test(source)) {
    fail(`Inline event handler còn tồn tại trong ${rel(file)}; CSP sẽ chặn.`);
  }

  const forms = source.match(/<form\b[\s\S]*?<\/form>/gi) || [];
  for (const form of forms) {
    const openTag = form.match(/<form\b[^>]*>/i)?.[0] || '';
    const method = openTag.match(/\bmethod\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() || 'get';
    if (method !== 'get' && !/name\s*=\s*["']_csrf["']/i.test(form)) {
      fail(`Form ${method.toUpperCase()} thiếu _csrf trong ${rel(file)}: ${openTag.slice(0, 120)}`);
    }
  }
}

const repositoryFiles = walk(path.join(root, 'src/repositories'), ['.js']);
for (const file of repositoryFiles) {
  const source = fs.readFileSync(file, 'utf8');
  if (/req\.(body|query|params)/.test(source)) {
    fail(`Repository truy cập request trực tiếp: ${rel(file)}`);
  }
  if (/\b(TODO|FIXME)\b/i.test(source)) warn(`Còn TODO/FIXME trong ${rel(file)}`);
}

const allSource = walk(path.join(root, 'src'), ['.js']);
for (const file of allSource) {
  const source = fs.readFileSync(file, 'utf8');
  if (/console\.log\([^\n]*(password|mat_khau|session\.user)/i.test(source)) {
    fail(`Có nguy cơ log dữ liệu nhạy cảm trong ${rel(file)}`);
  }
}

const gitignore = read('.gitignore');
if (!gitignore.includes('.env')) fail('.gitignore chưa loại .env.');
if (!gitignore.includes('public/uploads/*')) fail('.gitignore chưa loại ảnh upload runtime.');

const envExample = read('.env.example');
if (!envExample.includes('SESSION_SECRET=')) fail('.env.example thiếu SESSION_SECRET.');

const schema = read('database/01_schema.sql');
for (const table of ['tai_khoan', 'khach_hang', 'chu_san', 'khu_vuc', 'khung_gio', 'dich_vu', 'san_bong', 'dat_san', 'thanh_toan', 'chi_tiet_dich_vu']) {
  if (!new RegExp(`CREATE TABLE\\s+${table}\\b`, 'i').test(schema)) fail(`Schema thiếu bảng ${table}`);
}

const functions = read('database/03_functions.sql');
for (const fn of ['fn_dang_ky_khach_hang', 'fn_dat_san_bong', 'fn_huy_don_dat_san', 'fn_xac_nhan_don_dat_san', 'fn_them_dich_vu_cho_don', 'fn_thanh_toan_hoa_don']) {
  if (!functions.includes(`FUNCTION ${fn}`)) fail(`Functions thiếu ${fn}`);
}

const triggers = read('database/04_triggers.sql');
for (const trigger of ['tg_kiem_tra_trung_lich', 'tg_tinh_tien_san', 'tg_tao_hoa_don', 'tg_tinh_tien_chi_tiet_dich_vu', 'tg_cap_nhat_tien_dich_vu']) {
  if (!triggers.includes(`TRIGGER ${trigger}`)) fail(`Triggers thiếu ${trigger}`);
}

if (warnings.length) {
  console.warn('[AUDIT] Cảnh báo:');
  warnings.forEach((message) => console.warn(`- ${message}`));
}

if (failures.length) {
  console.error('[AUDIT] Thất bại:');
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`[AUDIT] FootballBookingSystem v${version}`);
console.log(`[AUDIT] Đã kiểm tra ${views.length} view EJS, ${repositoryFiles.length} repository và ${allSource.length} file nguồn.`);
console.log('[AUDIT] CSRF form, security headers, secret hygiene, kiến trúc tầng và artifact cuối: đạt.');
