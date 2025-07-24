/*
Purpose: Main Express server for Veo3 Short-Form Story Generator
Handles web interface, API endpoints, and coordinates video generation workflow
*/

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const { generateSceneScripts } = require('./src/scriptGenerator');
const { generateVideo } = require('./src/videoGenerator');
const { concatenateVideos } = require('./src/videoProcessor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/output', express.static(path.join(__dirname, 'output')));

// Ensure directories exist
async function ensureDirectories() {
    const dirs = ['temp', 'output', 'public'];
    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (err) {
            console.error(`Error creating directory ${dir}:`, err);
        }
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to generate scene scripts
app.post('/api/generate-scripts', async (req, res) => {
    try {
        const { character, prompt, promptsOnly } = req.body;
        
        if (!character || !prompt) {
            return res.status(400).json({
                error: 'Character and prompt are required'
            });
        }

        console.log(`Generating scripts for character: ${character}, prompt: ${prompt}, promptsOnly: ${promptsOnly}`);
        
        const scripts = await generateSceneScripts(character, prompt);
        
        res.json({
            success: true,
            scripts,
            promptsOnly: promptsOnly || false,
            estimatedCost: promptsOnly ? 0 : scripts.length * 4 // No cost if prompts only
        });
    } catch (error) {
        console.error('Error generating scripts:', error);
        res.status(500).json({ 
            error: 'Failed to generate scripts', 
            details: error.message 
        });
    }
});

// API endpoint to generate videos
app.post('/api/generate-videos', async (req, res) => {
    try {
        const { scripts, character } = req.body;
        
        if (!scripts || !Array.isArray(scripts) || scripts.length === 0) {
            return res.status(400).json({ 
                error: 'Valid scripts array is required' 
            });
        }

        console.log(`Generating ${scripts.length} videos for character: ${character}`);
        
        // Generate videos for each script
        const videoPromises = scripts.map((script, index) => 
            generateVideo(script, character, index)
        );
        
        const videoResults = await Promise.all(videoPromises);
        
        // Concatenate videos
        const finalVideoPath = await concatenateVideos(videoResults, character);
        
        res.json({
            success: true,
            videoPath: finalVideoPath,
            message: 'Video generation completed successfully'
        });
    } catch (error) {
        console.error('Error generating videos:', error);
        res.status(500).json({ 
            error: 'Failed to generate videos', 
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error', 
        details: err.message 
    });
});

// Start server
async function startServer() {
    try {
        await ensureDirectories();
        app.listen(PORT, () => {
            console.log(`🚀 Veo3 Story Generator server running on http://localhost:${PORT}`);
            console.log(`💰 Veo3 pricing: $0.50 per second (8-second videos ≈ $4 each)`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 