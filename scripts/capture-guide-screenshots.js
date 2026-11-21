const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://si-warga-peach.vercel.app';
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureAll() {
  console.log('--- Memulai Pengambilan Screenshot siWarga ---');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 850 },
    deviceScaleFactor: 2, // Retina quality
  });

  const page = await context.newPage();

  // 1. Login Page
  console.log('1. Mengambil screenshot Login Page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login.png') });

  // Do Login
  console.log('Melakukan login sebagai Admin...');
  await page.fill('input[name="username"], input[type="text"]', 'admin');
  await page.fill('input[name="password"], input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 });
  await page.waitForTimeout(1500);

  // 2. Dashboard
  console.log('2. Mengambil screenshot Dashboard...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard.png') });

  // 3. Data Warga
  console.log('3. Mengambil screenshot Data Warga...');
  await page.goto(`${BASE_URL}/warga`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_warga.png') });

  // 4. Tagihan Iuran
  console.log('4. Mengambil screenshot Tagihan Iuran...');
  await page.goto(`${BASE_URL}/tagihan`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_tagihan.png') });

  // 5. Buku Kas
  console.log('5. Mengambil screenshot Buku Kas...');
  await page.goto(`${BASE_URL}/kas`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_kas.png') });

  // 6. Dialog Ekspor Kas
  console.log('6. Mengambil screenshot Dialog Ekspor Kas...');
  try {
    const exportBtn = await page.$('button:has-text("Export Laporan"), button:has-text("Ekspor")');
    if (exportBtn) {
      await exportBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_ekspor_modal.png') });
      // Close modal
      const closeBtn = await page.$('button[aria-label="Close"], button:has-text("Batal")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {
    console.log('Notice: Could not trigger export modal:', e.message);
  }

  // 7. Penagihan WA
  console.log('7. Mengambil screenshot Penagihan WA & Rekap Tunggakan...');
  await page.goto(`${BASE_URL}/penagihan-wa`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_penagihan_wa.png') });

  // 8. Pengaturan
  console.log('8. Mengambil screenshot Pengaturan...');
  await page.goto(`${BASE_URL}/pengaturan`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_pengaturan.png') });

  // 9. Audit Log
  console.log('9. Mengambil screenshot Audit Trail...');
  await page.goto(`${BASE_URL}/audit-log`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_audit_log.png') });

  // 10. Mobile View
  console.log('10. Mengambil screenshot Mobile View...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  
  // Login on mobile
  await mobilePage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await mobilePage.fill('input[name="username"], input[type="text"]', 'admin');
  await mobilePage.fill('input[name="password"], input[type="password"]', 'Admin123!');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL(`${BASE_URL}/`, { timeout: 15000 });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '10_mobile_dashboard.png') });

  // Mobile Kas
  await mobilePage.goto(`${BASE_URL}/kas`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '11_mobile_kas.png') });

  await browser.close();
  console.log('✅ Seluruh screenshot berhasil disimpan di docs/screenshots!');
}

captureAll().catch(console.error);
