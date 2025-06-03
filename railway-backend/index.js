import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';
import { nanoid } from 'nanoid';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize services with error handling
let supabase = null;
let replicate = null;

try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('✅ Supabase client initialized');
  } else {
    console.log('⚠️ Supabase environment variables missing');
  }
} catch (error) {
  console.log('❌ Supabase initialization failed:', error.message);
}

try {
  if (process.env.REPLICATE_API_TOKEN) {
    replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    console.log('✅ Replicate client initialized');
  } else {
    console.log('⚠️ Replicate API token missing');
  }
} catch (error) {
  console.log('❌ Replicate initialization failed:', error.message);
}

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  storage: multer.memoryStorage(),
});

// Security middleware
app.use(helmet());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-domain.vercel.app',
    /\.vercel\.app$/,
    /\.run\.app$/,  // Allow Cloud Run domains
    process.env.FRONTEND_URL, // Allow configured frontend URL
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'theway-ai-backend',
    version: '1.0.0',
    services: {
      supabase: supabase ? 'connected' : 'not configured',
      replicate: replicate ? 'connected' : 'not configured',
    }
  };
  
  console.log('Health check requested:', healthStatus);
  res.json(healthStatus);
});

// Model training endpoint
app.post('/api/models/train-flux', upload.single('trainingData'), async (req, res) => {
  try {
    console.log('Starting Flux model training...');
    
    // Check if services are available
    if (!supabase) {
      return res.status(500).json({
        error: 'Supabase not configured',
        details: 'Database connection is not available'
      });
    }
    
    if (!replicate) {
      return res.status(500).json({
        error: 'Replicate not configured',
        details: 'AI training service is not available'
      });
    }
    
    const { name, keyword, userId } = req.body;
    const trainingFile = req.file;

    // Validate inputs
    if (!name || !keyword || !userId || !trainingFile) {
      return res.status(400).json({
        error: 'Missing required fields: name, keyword, userId, or training file',
      });
    }

    // Generate training ID
    const trainingId = nanoid();
    
    console.log(`Training request: ${name} with keyword: ${keyword} for user: ${userId}`);

    // Convert file to base64 for Replicate
    const base64Data = trainingFile.buffer.toString('base64');
    
    // Insert initial record into database
    const { error: insertError } = await supabase
      .from('trained_models')
      .insert({
        id: trainingId,
        user_id: userId,
        model_name: name,
        status: 'starting',
        created_at: new Date().toISOString(),
        input_data: {
          keyword,
          fileName: trainingFile.originalname,
          fileSize: trainingFile.size,
        },
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ error: 'Database error' });
    }

    // Start Replicate training
    const prediction = await replicate.predictions.create({
      version: "2b52459229a3e2d4574ece373a1fe04c51a4779661c553dfa0d33b579b50ea41",
      input: {
        prompt: keyword,
        instance_prompt: keyword,
        instance_data: {
          data: base64Data,
          format: "zip"
        },
        base_model: "FLUX-r",
        training_steps: 3000,
        learning_rate: 1e-4,
        train_batch_size: 4,
        use_8bit_adam: true,
        gradient_accumulation_steps: 4,
        lora_rank: 32,
        resolution: 1024,
        text_encoder_lr: 1e-5,
      },
    });

    // Update database with Replicate ID
    await supabase
      .from('trained_models')
      .update({
        replicate_id: prediction.id,
        status: prediction.status || 'starting',
      })
      .eq('id', trainingId);

    console.log(`Training started successfully: ${prediction.id}`);

    res.json({
      success: true,
      trainingId,
      replicateId: prediction.id,
      status: prediction.status,
      message: 'Training started successfully',
    });

  } catch (error) {
    console.error('Training error:', error);
    res.status(500).json({
      error: 'Failed to start training',
      details: error.message,
    });
  }
});

// Training status endpoint
app.get('/api/models/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get prediction status from Replicate
    const prediction = await replicate.predictions.get(id);
    
    // Update database with latest status
    if (prediction.status === 'succeeded' && prediction.output) {
      await supabase
        .from('trained_models')
        .update({
          status: 'completed',
          model_url: prediction.output?.model || null,
          version: prediction.output?.version || null,
          progress: 100,
          updated_at: new Date().toISOString(),
        })
        .eq('replicate_id', id);
    } else if (prediction.status === 'failed') {
      await supabase
        .from('trained_models')
        .update({
          status: 'failed',
          error_message: prediction.error || 'Training failed',
          updated_at: new Date().toISOString(),
        })
        .eq('replicate_id', id);
    }

    res.json({
      id: prediction.id,
      status: prediction.status,
      progress: prediction.status === 'succeeded' ? 100 : 
                prediction.status === 'processing' ? 50 : 
                prediction.status === 'starting' ? 10 : 0,
      output: prediction.output,
      error: prediction.error,
      logs: prediction.logs,
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to check training status',
      details: error.message,
    });
  }
});

// File upload endpoint
app.post('/api/upload/training-images', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`File uploaded: ${file.originalname} (${file.size} bytes)`);

    // For now, we'll store the file in memory and return a reference
    // In production, you might want to upload to cloud storage
    const fileId = nanoid();
    
    // Store file reference (in production, upload to S3/GCS/etc.)
    res.json({
      success: true,
      fileId,
      fileName: file.originalname,
      fileSize: file.size,
      message: 'File uploaded successfully',
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      details: error.message,
    });
  }
});

// Webhook endpoint for Replicate
app.post('/api/webhooks/replicate', async (req, res) => {
  try {
    const { id, status, output, error } = req.body;
    
    console.log(`Webhook received for ${id}: ${status}`);

    // Update database based on webhook
    const updateData = {
      status: status === 'succeeded' ? 'completed' : status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'succeeded' && output) {
      updateData.model_url = output.model || null;
      updateData.version = output.version || null;
      updateData.progress = 100;
    } else if (status === 'failed') {
      updateData.error_message = error || 'Training failed';
      updateData.progress = 0;
    }

    await supabase
      .from('trained_models')
      .update(updateData)
      .eq('replicate_id', id);

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Backend server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 