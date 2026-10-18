const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const previewHtml = `<!DOCTYPE html>
<html>
<head>
<style>
  body {
    background: #111116;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: white;
    display: flex;
    gap: 32px;
    padding: 26px 30px;
    align-items: center;
    justify-content: center;
  }
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .icon-circle {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background: #000;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .icon-squircle {
    width: 130px;
    height: 130px;
    border-radius: 34px;
    background: #000;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .icon-mono {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background: #222228;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .icon-nothingness {
    width: 130px;
    height: 130px;
    border-radius: 34px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.15);
  }
  svg {
    width: 100%;
    height: 100%;
  }
  .label {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: #888;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="icon-circle">
      <svg viewBox="0 0 1024 1024">
        <g transform="translate(512, 512) scale(0.68) translate(-512, -512)">
          <g fill="none" stroke="#FFFFFF" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
            <path d="M 730 294 H 256 C 235 294 218 311 218 332 V 592 C 218 613 235 630 256 630 H 782 C 803 630 820 613 820 592 V 357"/>
            <path d="M 512 630 V 730"/>
            <path d="M 392 730 H 632"/>
          </g>
          <circle cx="788" cy="299" r="34" fill="#FF1F32"/>
        </g>
      </svg>
    </div>
    <span class="label">Nothing OS Circle</span>
  </div>

  <div class="card">
    <div class="icon-squircle">
      <svg viewBox="0 0 1024 1024">
        <g transform="translate(512, 512) scale(0.68) translate(-512, -512)">
          <g fill="none" stroke="#FFFFFF" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
            <path d="M 730 294 H 256 C 235 294 218 311 218 332 V 592 C 218 613 235 630 256 630 H 782 C 803 630 820 613 820 592 V 357"/>
            <path d="M 512 630 V 730"/>
            <path d="M 392 730 H 632"/>
          </g>
          <circle cx="788" cy="299" r="34" fill="#FF1F32"/>
        </g>
      </svg>
    </div>
    <span class="label">Squircle Mask</span>
  </div>

  <div class="card">
    <div class="icon-mono">
      <svg viewBox="0 0 1024 1024">
        <g transform="translate(512, 512) scale(0.68) translate(-512, -512)">
          <g fill="none" stroke="#FFFFFF" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
            <path d="M 730 294 H 256 C 235 294 218 311 218 332 V 592 C 218 613 235 630 256 630 H 782 C 803 630 820 613 820 592 V 357"/>
            <path d="M 512 630 V 730"/>
            <path d="M 392 730 H 632"/>
          </g>
          <circle cx="788" cy="299" r="34" fill="#FFFFFF"/>
        </g>
      </svg>
    </div>
    <span class="label">Nothing Monochrome</span>
  </div>

  <div class="card">
    <div class="icon-nothingness">
      <svg viewBox="0 0 1024 1024">
        <defs>
          <linearGradient id="glass-squircle-bg" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stop-color="#565660"/>
            <stop offset="28%" stop-color="#3c3c44"/>
            <stop offset="65%" stop-color="#212126"/>
            <stop offset="100%" stop-color="#121215"/>
          </linearGradient>
          <radialGradient id="glass-specular" cx="20%" cy="15%" r="70%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
            <stop offset="25%" stop-color="#ffffff" stop-opacity="0.16"/>
            <stop offset="60%" stop-color="#ffffff" stop-opacity="0.02"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="glass-rim-stroke" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.7"/>
            <stop offset="35%" stop-color="#ffffff" stop-opacity="0.32"/>
            <stop offset="70%" stop-color="#ffffff" stop-opacity="0.08"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.18"/>
          </linearGradient>
          <linearGradient id="glyph-frosted" x1="0" y1="200" x2="0" y2="800" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#d4d4dc"/>
          </linearGradient>
          <linearGradient id="dot-frosted" x1="760" y1="270" x2="816" y2="330" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#e0e0e8"/>
          </linearGradient>
          <filter id="clean-glyph-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.55"/>
          </filter>
        </defs>
        <rect width="1024" height="1024" fill="url(#glass-squircle-bg)"/>
        <rect width="1024" height="1024" fill="url(#glass-specular)"/>
        <rect width="1024" height="1024" fill="none" stroke="url(#glass-rim-stroke)" stroke-width="12"/>
        <g transform="translate(512, 512) scale(0.68) translate(-512, -512)" filter="url(#clean-glyph-shadow)">
          <g fill="none" stroke="url(#glyph-frosted)" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
            <path d="M 730 294 H 256 C 235 294 218 311 218 332 V 592 C 218 613 235 630 256 630 H 782 C 803 630 820 613 820 592 V 357"/>
            <path d="M 512 630 V 730"/>
            <path d="M 392 730 H 632"/>
          </g>
          <circle cx="788" cy="299" r="34" fill="url(#dot-frosted)"/>
        </g>
      </svg>
    </div>
    <span class="label">Nothingness Glass</span>
  </div>
</body>
</html>`;

const tempHtml = path.resolve(__dirname, 'temp_preview.html');
const outPng = path.resolve(__dirname, '../icon_preview_shapes.png');
fs.writeFileSync(tempHtml, previewHtml);

const cmd = `"${CHROME}" --headless --screenshot="${outPng}" --window-size=780,240 --hide-scrollbars "file:///${tempHtml.replace(/\\/g, '/')}"`;
execSync(cmd);
fs.unlinkSync(tempHtml);
console.log('Saved:', outPng);
