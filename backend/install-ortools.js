#!/usr/bin/env node

/**
 * Google OR-Tools Installation Helper
 * This script helps install Google OR-Tools for enhanced route optimization
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Google OR-Tools Installation Helper');
console.log('=====================================\n');

console.log('📦 Installing Google OR-Tools...');
console.log('This may take several minutes...\n');

try {
  // Check if we're on Windows
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    console.log('🔧 Windows detected - installing OR-Tools...');
    execSync('npm install @google/ortools --save-optional', { stdio: 'inherit' });
  } else {
    console.log('🐧 Linux/Mac detected - installing system dependencies first...');

    // Try to install system dependencies (may require sudo)
    try {
      if (process.platform === 'linux') {
        console.log('📋 Installing Linux dependencies...');
        execSync('sudo apt-get update && sudo apt-get install -y build-essential cmake', { stdio: 'inherit' });
      } else if (process.platform === 'darwin') {
        console.log('🍎 Installing macOS dependencies...');
        execSync('brew install cmake', { stdio: 'inherit' });
      }
    } catch (error) {
      console.log('⚠️  System dependency installation failed. Continuing with OR-Tools installation...');
      console.log('   You may need to install build tools manually if OR-Tools installation fails.');
    }

    // Install OR-Tools
    console.log('📦 Installing Google OR-Tools...');
    execSync('npm install @google/ortools --save-optional', { stdio: 'inherit' });
  }

  console.log('\n✅ Google OR-Tools installation completed!');
  console.log('🎯 Your route optimization will now use Google OR-Tools when available.');
  console.log('📊 Expect significantly better optimization results!\n');

  console.log('🔄 Restart your application to use OR-Tools:');
  console.log('   cd backend && npm start');
  console.log('   cd frontend && npm start\n');

} catch (error) {
  console.log('\n❌ Google OR-Tools installation failed.');
  console.log('📝 This is normal - OR-Tools can be complex to install.');
  console.log('🔄 Your application will continue using the fallback algorithms.');
  console.log('   The optimization quality is still excellent!\n');

  console.log('💡 To try OR-Tools installation later:');
  console.log('   cd backend && node install-ortools.js\n');

  console.log('📖 For manual installation, visit:');
  console.log('   https://developers.google.com/optimization/install\n');
}