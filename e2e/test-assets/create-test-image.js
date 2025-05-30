// Simple script to create a test image for Playwright tests
const fs = require('fs');
const path = require('path');

// Create a simple 1x1 pixel PNG image (base64 encoded)
const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';

// Convert base64 to buffer and save as test image
const imageBuffer = Buffer.from(base64Image, 'base64');
const imagePath = path.join(__dirname, 'test-character.jpg');

fs.writeFileSync(imagePath, imageBuffer);
console.log('Test image created at:', imagePath); 