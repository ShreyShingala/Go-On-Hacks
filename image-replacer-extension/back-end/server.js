import express from 'express';
import multer from 'multer'; // Used to handle file uploads for express.js servers
import { GoogleGenerativeAI } from '@google/generative-ai'; // Used to generate content
import dotenv from 'dotenv';
import cors from 'cors'; // Used to handle cross-origin requests, back-end to front-end
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors()); // Enable front-end access
app.use(express.json()); // Parse JSON prompts

// Ensure that folders and files are created
const ensureDir = (p) => { if (!existsSync(p)) mkdirSync(p, { recursive: true }); };
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const GENERATED_DIR = path.join(__dirname, 'generated');
ensureDir(UPLOADS_DIR);
ensureDir(GENERATED_DIR);

app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/generated', express.static(GENERATED_DIR));

// Create a storage engine that defines how/where to store files
const storage = multer.diskStorage({
  // When multer uploads a file, req is Express request object, used
  // to check user info, cb is the callback where to save the file
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  // This tells multer how to name the file, it will create a unique id
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `image-${unique}${path.extname(file.originalname).toLowerCase()}`);
  }
});
const upload = multer({ storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Gemini requires MIME and Base64 to encode the image

// Allows image to be embedded into front-end
function imageToBase64(filePath) {
  const buf = fs.readFileSync(filePath);
  return buf.toString('base64');
}

// MIME is the format of the image, consists of the name and type
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.gif':  'image/gif',
    '.webp': 'image/webp'
  };
  return map[ext] || 'image/png'; // default to PNG
}

// upload.single() is a middleware that saves imag efrom frontend and attach it to req.file
app.post('/api/generate-image', upload.single('image'), async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image'
    });

    const prompt = req.body.prompt || 'Keep this image as it is.';
    const imagePath = req.file.path;

    // Convert to base64, get MIME type, set up Gemini request
    const imageBase64 = fs.readFileSync(imagePath, 'base64');
    const mimeType = getMimeType(imagePath);
    const contents = [{
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { data: imageBase64, mimeType } }
      ]
    }];

    // Send request to Gemini and get response back
    const result = await model.generateContent({ contents });
    const response = await result.response;
    const parts = response?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData?.data);

    if (!imagePart) {
      return res.status(200).json({
        success: false,
        message: 'No image returned from model',
        original: `/uploads/${path.basename(imagePath)}`
      });
    }

    // Save the generated image locally
    const outputBase64 = imagePart.inlineData.data;
    const buffer = Buffer.from(outputBase64, 'base64');
    const outputName = `generated-${Date.now()}.png`;
    const outputPath = path.join(__dirname, 'generated', outputName);
    fs.writeFileSync(outputPath, buffer);

    // Send response to frontend
    res.json({
      success: true,
      original: `/uploads/${path.basename(imagePath)}`,
      generated: `/generated/${outputName}`,
      model: 'gemini-2.5-flash-image'
    });

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

app.post('/api/process-existing', async (req, res) => {
  try {
    const { filename, prompt } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'filename is required' });
    }

    const imagePath = path.join(__dirname, 'uploaded', filename);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'File not found in uploaded folder' });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image'
    });

    const imageBase64 = fs.readFileSync(imagePath, 'base64');
    const mimeType = getMimeType(imagePath);
    const contents = [{
      role: 'user',
      parts: [
        { text: prompt || 'Transform this image creatively.' },
        { inlineData: { data: imageBase64, mimeType } }
      ]
    }];

    const result = await model.generateContent({ contents });
    const response = await result.response;
    const parts = response?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData?.data);

    if (!imagePart) {
      return res.status(200).json({
        success: false,
        message: 'No image returned from model',
        original: `/uploaded/${filename}`
      });
    }

    const outputBase64 = imagePart.inlineData.data;
    const buffer = Buffer.from(outputBase64, 'base64');
    const outputName = `generated-${Date.now()}.png`;
    const outputPath = path.join(__dirname, 'generated', outputName);
    fs.writeFileSync(outputPath, buffer);

    res.json({
      success: true,
      original: `/uploaded/${filename}`,
      generated: `/generated/${outputName}`,
      model: 'gemini-2.5-flash-image'
    });

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ 
      error: 'Failed to process existing image', 
      details: error.message,
      stack: error.stack
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('💡 Try POST /api/generate-image with a file named "image"');
});