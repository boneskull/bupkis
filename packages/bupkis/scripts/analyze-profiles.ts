#!/usr/bin/env node

/**
 * Profile Analysis Script for Bupkis
 *
 * Analyzes CPU profiles and generates flame graphs for performance insights.
 * Supports multiple profile formats and provides actionable recommendations.
 */

import { existsSync } from 'fs';
import { mkdir, readdir, readFile } from 'fs/promises';
import { basename, extname, join } from 'path';

const PROFILES_DIR = '.profiles';
const OUTPUT_DIR = '.profiles/reports';

/**
 * Ensure output directory exists
 */
const ensureOutputDir = async (): Promise<void> => {
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }
};

/**
 * Find all CPU profile files
 */
const findProfiles = async (): Promise<string[]> => {
  if (!existsSync(PROFILES_DIR)) {
    console.log(
      '❌ No profiles directory found. Run a profiling script first.',
    );
    console.log(
      '   Example: npm run profile:bench -- --mode ci --suite sync-schema',
    );
    return [];
  }

  const files = await readdir(PROFILES_DIR);
  return files.filter(
    (file) =>
      extname(file) === '.cpuprofile' ||
      extname(file) === '.json' ||
      file.includes('flamegraph'),
  );
};

interface ProfileAnalysis {
  duration: number;
  filename: string;
  hotFunctions: Array<[string, number]>;
  totalNodes: number;
  totalSamples: number;
}

/**
 * Analyze a CPU profile and extract key metrics
 */
const analyzeProfile = async (
  filename: string,
): Promise<null | ProfileAnalysis> => {
  const filepath = join(PROFILES_DIR, filename);

  try {
    const content = await readFile(filepath, 'utf8');
    const profile = JSON.parse(content) as {
      endTime?: number;
      nodes?: Array<{
        callFrame?: {
          functionName?: string;
          url?: string;
        };
        hitCount?: number;
      }>;
      samples?: unknown[];
      startTime?: number;
    };

    if (!profile.nodes) {
      console.log(`⚠️  Skipping ${filename} - not a valid CPU profile`);
      return null;
    }

    const nodes = profile.nodes;
    const samples = profile.samples || [];

    // Calculate total runtime
    const startTime = profile.startTime || 0;
    const endTime = profile.endTime || 0;
    const duration = endTime - startTime;

    // Find hot functions
    const functionTimes = new Map<string, number>();

    for (const node of nodes) {
      if (node.callFrame && node.callFrame.functionName) {
        const name = node.callFrame.functionName;
        const url = node.callFrame.url || 'unknown';
        const key = `${name} (${basename(url)})`;

        functionTimes.set(
          key,
          (functionTimes.get(key) || 0) + (node.hitCount || 0),
        );
      }
    }

    // Sort by hit count
    const hotFunctions = Array.from(functionTimes.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return {
      duration: duration / 1000, // Convert to seconds

      filename,
      hotFunctions,
      totalNodes: nodes.length,
      totalSamples: samples.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`❌ Error analyzing ${filename}:`, errorMessage);
    return null;
  }
};

/**
 * Generate recommendations based on profile analysis
 */
const generateRecommendations = (analysis: ProfileAnalysis): string[] => {
  const recommendations: string[] = [];

  if (analysis.hotFunctions.length > 0) {
    const topFunction = analysis.hotFunctions[0];
    if (topFunction) {
      const [functionName, hitCount] = topFunction;

      if (hitCount > analysis.totalSamples * 0.1) {
        recommendations.push(
          `🎯 Hot spot detected: "${functionName}" accounts for ${Math.round((hitCount / analysis.totalSamples) * 100)}% of CPU time`,
        );
      }
    }

    // Look for assertion-related hot spots
    const assertionHits = analysis.hotFunctions.filter(
      ([name]: [string, number]) =>
        name.includes('expect') ||
        name.includes('assertion') ||
        name.includes('parse') ||
        name.includes('validate'),
    );

    if (assertionHits.length > 0) {
      recommendations.push(
        '🔍 Assertion performance insights available - consider optimizing argument parsing or validation logic',
      );
    }

    // Look for Zod-related performance
    const zodHits = analysis.hotFunctions.filter(
      ([name]: [string, number]) =>
        name.includes('zod') ||
        name.includes('schema') ||
        name.includes('safeParse'),
    );

    if (zodHits.length > 0) {
      recommendations.push(
        '📊 Zod schema validation detected in hot path - consider schema optimization or caching',
      );
    }
  }

  if (analysis.duration > 5) {
    recommendations.push(
      `⏱️  Long execution time (${analysis.duration.toFixed(2)}s) - consider profiling with comprehensive mode`,
    );
  }

  return recommendations;
};

/**
 * Main analysis function
 */
const main = async (): Promise<void> => {
  console.log('🔥 Bupkis Profile Analyzer\n');

  await ensureOutputDir();
  const profiles = await findProfiles();

  if (profiles.length === 0) {
    console.log('No profiles found. Generate some profiles first:');
    console.log('  npm run profile:bench -- --mode ci --suite sync-schema');
    console.log('  npm run profile:test');
    console.log('  npm run profile:property\n');
    return;
  }

  console.log(`Found ${profiles.length} profile(s):\n`);

  const analyses: ProfileAnalysis[] = [];

  for (const profile of profiles) {
    console.log(`📊 Analyzing ${profile}...`);
    const analysis = await analyzeProfile(profile);

    if (analysis) {
      analyses.push(analysis);

      console.log(`   Duration: ${analysis.duration.toFixed(2)}s`);
      console.log(`   Samples: ${analysis.totalSamples.toLocaleString()}`);
      console.log(`   Nodes: ${analysis.totalNodes.toLocaleString()}`);

      if (analysis.hotFunctions.length > 0) {
        console.log('   🔥 Top hot functions:');
        analysis.hotFunctions.slice(0, 3).forEach(([name, hits], i) => {
          const percentage = ((hits / analysis.totalSamples) * 100).toFixed(1);
          console.log(`      ${i + 1}. ${name} (${percentage}%)`);
        });
      }

      const recommendations = generateRecommendations(analysis);
      if (recommendations.length > 0) {
        console.log('   💡 Recommendations:');
        recommendations.forEach((rec) => console.log(`      ${rec}`));
      }

      console.log('');
    }
  }

  // Generate summary report
  if (analyses.length > 0) {
    console.log('📈 Summary Report:');
    console.log('─'.repeat(50));

    const totalDuration = analyses.reduce((sum, a) => sum + a.duration, 0);
    const totalSamples = analyses.reduce((sum, a) => sum + a.totalSamples, 0);

    console.log(`Total execution time: ${totalDuration.toFixed(2)}s`);
    console.log(`Total samples: ${totalSamples.toLocaleString()}`);
    console.log(
      `Average samples/second: ${Math.round(totalSamples / totalDuration).toLocaleString()}`,
    );

    console.log('\n🔧 How to view flame graphs:');
    console.log(
      '1. Chrome DevTools: Open chrome://inspect → Open dedicated DevTools → Performance tab → Load .cpuprofile',
    );
    console.log(
      '2. VS Code: Install "Performance Analysis" extension and open .cpuprofile files',
    );
    console.log('3. Online: Upload to https://www.speedscope.app/');
    console.log(
      '4. Clinic.js: Run `npm run profile:bench:clinic` for interactive HTML reports\n',
    );
  }
};

main().catch(console.error);
