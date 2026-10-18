const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const htmlFull = `<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    background: #000000;
    overflow: hidden;
  }
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#000000"/>
  <g transform="translate(512, 512) scale(0.68) translate(-512, -512)">
    <g fill="none" stroke="#FFFFFF" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 730 294 H 256 C 235 294 218 311 218 332 V 592 C 218 613 235 630 256 630 H 782 C 803 630 820 613 820 592 V 357"/>
      <path d="M 512 630 V 730"/>
      <path d="M 392 730 H 632"/>
    </g>
    <circle cx="788" cy="299" r="34" fill="#FF1F32"/>
  </g>
</svg>
</body>
</html>`;

const htmlRound = `<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    background: transparent;
    overflow: hidden;
  }
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <circle cx="512" cy="512" r="506" fill="#000000"/>
  <g transform="translate(512, 512) scale(0.68) translate(-512, -512)">
    <g fill="none" stroke="#FFFFFF" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 730 294 H 256 C 235 294 218 311 218 332 V 592 C 218 613 235 630 256 630 H 782 C 803 630 820 613 820 592 V 357"/>
      <path d="M 512 630 V 730"/>
      <path d="M 392 730 H 632"/>
    </g>
    <circle cx="788" cy="299" r="34" fill="#FF1F32"/>
  </g>
</svg>
</body>
</html>`;

const htmlForeground = `<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    background: transparent;
    overflow: hidden;
  }
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(512, 512) scale(0.68) translate(-512, -512)">
    <g fill="none" stroke="#FFFFFF" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 730 294 H 256 C 235 294 218 311 218 332 V 592 C 218 613 235 630 256 630 H 782 C 803 630 820 613 820 592 V 357"/>
      <path d="M 512 630 V 730"/>
      <path d="M 392 730 H 632"/>
    </g>
    <circle cx="788" cy="299" r="34" fill="#FF1F32"/>
  </g>
</svg>
</body>
</html>`;

const tempFullHtml = path.resolve(__dirname, 'temp_full.html');
const tempRoundHtml = path.resolve(__dirname, 'temp_round.html');
const tempFgHtml = path.resolve(__dirname, 'temp_fg.html');
fs.writeFileSync(tempFullHtml, htmlFull);
fs.writeFileSync(tempRoundHtml, htmlRound);
fs.writeFileSync(tempFgHtml, htmlForeground);

const densities = [
  { dir: 'mipmap-mdpi', launcherSize: 48, fgSize: 108 },
  { dir: 'mipmap-hdpi', launcherSize: 72, fgSize: 162 },
  { dir: 'mipmap-xhdpi', launcherSize: 96, fgSize: 216 },
  { dir: 'mipmap-xxhdpi', launcherSize: 144, fgSize: 324 },
  { dir: 'mipmap-xxxhdpi', launcherSize: 192, fgSize: 432 },
];

const resDir = path.resolve(__dirname, '../android/app/src/main/res');

function runScreenshot(url, outPath, size) {
  const fileUrl = 'file:///' + url.replace(/\\/g, '/');
  const cmd = `"${CHROME_PATH}" --headless --screenshot="${outPath}" --window-size=${size},${size} --default-background-color=00000000 --hide-scrollbars "${fileUrl}"`;
  execSync(cmd, { stdio: 'inherit' });
}

for (const d of densities) {
  const targetFolder = path.join(resDir, d.dir);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  // 1. ic_launcher.png
  const launcherPath = path.join(targetFolder, 'ic_launcher.png');
  runScreenshot(tempFullHtml, launcherPath, d.launcherSize);

  // 2. ic_launcher_round.png
  const roundPath = path.join(targetFolder, 'ic_launcher_round.png');
  runScreenshot(tempRoundHtml, roundPath, d.launcherSize);

  // 3. ic_launcher_foreground.png
  const fgPath = path.join(targetFolder, 'ic_launcher_foreground.png');
  runScreenshot(tempFgHtml, fgPath, d.fgSize);
  console.log(`Rendered ${d.dir} assets successfully.`);
}

// Clean up temp files
fs.unlinkSync(tempFullHtml);
fs.unlinkSync(tempRoundHtml);
fs.unlinkSync(tempFgHtml);
console.log('All Android launcher icons generated successfully with 0.68 adaptive scale!');
