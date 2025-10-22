#!/usr/bin/env node

// Startup script for the AI Medical Triage System

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting AI Medical Triage System...\n');

// Build the frontend first
console.log('🔨 Building frontend...');
const build = spawn('npm', ['run', 'build'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

build.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Frontend build successful!');
    console.log('🔧 Starting backend server...\n');
    
    // Start the server
    const server = spawn('node', ['server/server.js'], {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    server.on('spawn', () => {
      console.log('\n🏥 AI Medical Triage System is now running!');
      console.log('🔗 Visit http://localhost:3001 to access the application');
      console.log('🚪 Press Ctrl+C to stop the server\n');
    });
    
    server.on('error', (error) => {
      console.error('❌ Failed to start server:', error.message);
    });
  } else {
    console.error('❌ Frontend build failed with exit code:', code);
  }
});

build.on('error', (error) => {
  console.error('❌ Failed to start build process:', error.message);
});