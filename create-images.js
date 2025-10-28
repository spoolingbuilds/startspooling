const fs = require('fs');
const { createCanvas } = require('canvas');

// Create OG Image (1200x630)
const ogCanvas = createCanvas(1200, 630);
const ogCtx = ogCanvas.getContext('2d');

// Black background
ogCtx.fillStyle = '#000000';
ogCtx.fillRect(0, 0, 1200, 630);

// White text
ogCtx.fillStyle = '#FFFFFF';
ogCtx.font = 'bold 72px Arial';
ogCtx.textAlign = 'center';
ogCtx.fillText('photobucket deleted it.', 600, 200);

ogCtx.font = '48px Arial';
ogCtx.fillText('we remember everything', 600, 300);

ogCtx.fillStyle = '#888888';
ogCtx.font = '24px Arial';
ogCtx.fillText('startspooling.com', 600, 400);

// Save OG image
const ogBuffer = ogCanvas.toBuffer('image/png');
fs.writeFileSync('og-image.png', ogBuffer);

// Create Apple Touch Icon (180x180)
const iconCanvas = createCanvas(180, 180);
const iconCtx = iconCanvas.getContext('2d');

// Black background
iconCtx.fillStyle = '#000000';
iconCtx.fillRect(0, 0, 180, 180);

// Cyan "S"
iconCtx.fillStyle = '#00FFFF';
iconCtx.font = 'bold 100px Arial';
iconCtx.textAlign = 'center';
iconCtx.textBaseline = 'middle';
iconCtx.fillText('S', 90, 90);

// Save icon
const iconBuffer = iconCanvas.toBuffer('image/png');
fs.writeFileSync('apple-touch-icon.png', iconBuffer);

console.log('Images created successfully!');
