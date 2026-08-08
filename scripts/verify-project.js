const fs = require('fs');
const path = require('path');

let ejs = null;
try { ejs = require('ejs'); } catch (error) { ejs = null; }

const root = process.cwd();
const failures = [];
function fail(message) { failures.push(message); }
function absolute(relativePath) { return path.join(root, relativePath); }
function assertFile(relativePath) {
  const file = absolute(relativePath);
  if (!fs.existsSync(file)) fail(`Thiếu file bắt buộc: ${relativePath}`);
  return file;
}
function walk(directory, extension) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath, extension);
    return entry.name.endsWith(extension) ? [fullPath] : [];
  });
}
function compileEjsFallback(source) {
  const openings = (source.match(/<%/g) || []).length;
  const closings = (source.match(/%>/g) || []).length;
  if (openings !== closings) throw new Error(`delimiter EJS không cân bằng (${openings}/${closings})`);
}

const requiredFiles = [
  'VERSION', 'CHANGELOG.md', 'UPDATE_MANIFEST.md', 'README.md',
  'src/app.js', 'src/server.js',
  'src/middlewares/authMiddleware.js', 'src/middlewares/csrfMiddleware.js',
  'src/middlewares/securityMiddleware.js', 'src/middlewares/uploadMiddleware.js',
  'src/routes/authWebRoutes.js', 'src/routes/bookingWebRoutes.js', 'src/routes/ownerWebRoutes.js',
  'src/routes/paymentWebRoutes.js', 'src/routes/adminWebRoutes.js',
  'src/controllers/authController.js', 'src/controllers/bookingController.js', 'src/controllers/ownerController.js',
  'src/controllers/paymentController.js', 'src/controllers/adminController.js',
  'src/services/authService.js', 'src/services/bookingService.js', 'src/services/ownerService.js',
  'src/services/paymentService.js', 'src/services/adminService.js',
  'src/repositories/authRepository.js', 'src/repositories/bookingRepository.js', 'src/repositories/ownerRepository.js',
  'src/repositories/paymentRepository.js', 'src/repositories/adminRepository.js',
  'scripts/audit-project.js', 'scripts/check-database.js',
  'docs/API.md', 'docs/Database.md', 'docs/UserGuide.md', 'docs/Deployment.md', 'docs/TestPlan.md', 'docs/Security.md',
  'diagrams/ERD.png', 'diagrams/UseCase.png', 'diagrams/Architecture.png', 'diagrams/SequenceBooking.png',
];
requiredFiles.forEach(assertFile);

const packageJson = JSON.parse(fs.readFileSync(assertFile('package.json'), 'utf8'));
const version = fs.readFileSync(assertFile('VERSION'), 'utf8').trim();
if (packageJson.version !== version) fail(`VERSION (${version}) không khớp package.json (${packageJson.version})`);
if (version !== '0.9.0') fail(`Phần 9 yêu cầu VERSION 0.9.0, hiện tại ${version}`);

const jsFiles = walk(absolute('src'), '.js').concat(walk(absolute('scripts'), '.js'));
for (const jsFile of jsFiles) {
  const source = fs.readFileSync(jsFile, 'utf8');
  const requirePattern = /require\(['"](\.{1,2}\/[^'"]+)['"]\)/g;
  let match;
  while ((match = requirePattern.exec(source))) {
    const base = path.resolve(path.dirname(jsFile), match[1]);
    const candidates = [base, `${base}.js`, path.join(base, 'index.js')];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      fail(`Import không tồn tại trong ${path.relative(root, jsFile)}: ${match[1]}`);
    }
  }
}

const viewFiles = walk(absolute('views'), '.ejs');
for (const viewFile of viewFiles) {
  const source = fs.readFileSync(viewFile, 'utf8');
  try {
    if (ejs) ejs.compile(source, { filename: viewFile });
    else compileEjsFallback(source);
  } catch (error) {
    fail(`EJS lỗi tại ${path.relative(root, viewFile)}: ${error.message}`);
  }
}

const runtimeDependencies = Object.keys(packageJson.dependencies || {});
const canLoadRuntime = runtimeDependencies.every((dependency) => {
  try { require.resolve(dependency); return true; } catch (error) { return false; }
});

if (canLoadRuntime) {
  const runtimeModules = [
    'src/app.js',
    'src/routes/index.js', 'src/routes/webRoutes.js',
    'src/controllers/authController.js', 'src/controllers/pitchController.js', 'src/controllers/bookingController.js',
    'src/controllers/ownerController.js', 'src/controllers/paymentController.js', 'src/controllers/adminController.js',
    'src/services/authService.js', 'src/services/pitchService.js', 'src/services/bookingService.js',
    'src/services/ownerService.js', 'src/services/paymentService.js', 'src/services/adminService.js',
  ];
  for (const relativePath of runtimeModules) {
    try { require(absolute(relativePath)); } catch (error) { fail(`Không thể nạp runtime ${relativePath}: ${error.message}`); }
  }
}

const noSkeletonFiles = [
  'src/services/customerService.js', 'src/repositories/customerRepository.js',
  'src/controllers/ownerController.js', 'src/services/ownerService.js', 'src/repositories/ownerRepository.js',
  'src/controllers/paymentController.js', 'src/services/paymentService.js', 'src/repositories/paymentRepository.js',
  'src/controllers/adminController.js', 'src/services/adminService.js', 'src/repositories/adminRepository.js',
];
for (const relativePath of noSkeletonFiles) {
  const source = fs.readFileSync(absolute(relativePath), 'utf8');
  if (/TODO:\s*(Xu ly|Dat tat ca)/i.test(source)) fail(`Module còn TODO khung: ${relativePath}`);
}

if (failures.length) {
  console.error('[VERIFY] Thất bại:');
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`[VERIFY] FootballBookingSystem v${version}`);
console.log(`[VERIFY] ${jsFiles.length} file JavaScript có liên kết nội bộ hợp lệ.`);
console.log(`[VERIFY] ${viewFiles.length} file EJS ${ejs ? 'compile bằng EJS' : 'kiểm tra delimiter fallback'} thành công.`);
console.log(`[VERIFY] Runtime load: ${canLoadRuntime ? 'đã kiểm tra dependency thật' : 'bỏ qua vì chưa npm install'}.`);
console.log('[VERIFY] Cấu trúc Phần 1-9 đầy đủ.');
