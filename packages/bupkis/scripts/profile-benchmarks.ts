#!/usr/bin/env node

/**
 * Benchmark Profiling Integration
 *
 * This script demonstrates how to generate flame graphs from benchmark runs and
 * provides automated performance insights for Bupkis development.
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';

const PROFILES_DIR = '.profiles';

/**
 * Ensure profiles directory exists
 */
const ensureProfilesDir = async (): Promise<void> => {
  if (!existsSync(PROFILES_DIR)) {
    await mkdir(PROFILES_DIR, { recursive: true });
  }
};

/**
 * Run a command and return a promise
 */
const runCommand = (command: string, args: string[]): Promise<number> => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      shell: true,
      stdio: 'inherit',
    });

    process.on('close', (code) => {
      resolve(code || 0);
    });

    process.on('error', reject);
  });
};

/**
 * Profile benchmark performance for specific scenarios
 */
const profileBenchmarks = async (): Promise<void> => {
  console.log('🔥 Starting Bupkis Benchmark Profiling...\n');

  await ensureProfilesDir();

  const scenarios = [
    {
      mode: 'ci',
      name: 'Schema-based Assertions',
      suite: 'sync-schema',
    },
    {
      mode: 'ci',
      name: 'Function-based Assertions',
      suite: 'sync-function',
    },
    {
      mode: 'ci',
      name: 'Collection Operations',
      suite: 'collection',
    },
  ];

  for (const scenario of scenarios) {
    console.log(`📊 Profiling ${scenario.name}...`);

    const exitCode = await runCommand('npm', [
      'run',
      'profile:bench',
      '--',
      '--mode',
      scenario.mode,
      '--suite',
      scenario.suite,
    ]);

    if (exitCode === 0) {
      console.log(`✅ ${scenario.name} profiling completed`);
    } else {
      console.log(`❌ ${scenario.name} profiling failed with code ${exitCode}`);
    }
    console.log('');
  }

  console.log('🎯 Running profile analysis...\n');
  await runCommand('npm', ['run', 'profile:analyze']);

  console.log('\n🔧 Next Steps:');
  console.log('1. Open .profiles/*.cpuprofile files in Chrome DevTools');
  console.log('2. Visit https://www.speedscope.app/ for online analysis');
  console.log('3. Run `npm run profile:bench:clinic` for interactive reports');
  console.log('4. Focus optimization efforts on the identified hot spots\n');
};

// Run if called directly
if (require.main === module) {
  profileBenchmarks().catch(console.error);
}

export { profileBenchmarks };
