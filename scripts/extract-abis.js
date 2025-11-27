import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const CONTRACTS_OUT_DIR = path.join(__dirname, '../contracts/out');
const ABIS_OUTPUT_DIR = path.join(__dirname, '../src/contracts/abis');

// Contract names to extract
const CONTRACTS_TO_EXTRACT = ['LuckyPacket'];

// Ensure output directory exists
if (!fs.existsSync(ABIS_OUTPUT_DIR)) {
  fs.mkdirSync(ABIS_OUTPUT_DIR, { recursive: true });
}

console.log('🔍 Extracting ABIs from compiled contracts...\n');

CONTRACTS_TO_EXTRACT.forEach((contractName) => {
  const artifactPath = path.join(
    CONTRACTS_OUT_DIR,
    `${contractName}.sol`,
    `${contractName}.json`
  );

  if (!fs.existsSync(artifactPath)) {
    console.warn(`⚠️  Warning: ${contractName} artifact not found at ${artifactPath}`);
    return;
  }

  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abi = artifact.abi;

    // Write ABI to file
    const outputPath = path.join(ABIS_OUTPUT_DIR, `${contractName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));

    console.log(`✅ Extracted ABI for ${contractName}`);
    console.log(`   → ${outputPath}\n`);
  } catch (error) {
    console.error(`❌ Error extracting ABI for ${contractName}:`, error.message);
  }
});

// Create TypeScript types file
const typesContent = `// Auto-generated file - do not edit manually
// Generated from contract ABIs

${CONTRACTS_TO_EXTRACT.map((contractName) => {
  const abiPath = path.join(ABIS_OUTPUT_DIR, `${contractName}.json`);
  if (fs.existsSync(abiPath)) {
    return `import ${contractName}ABI from './${contractName}.json';`;
  }
  return '';
})
  .filter(Boolean)
  .join('\n')}

export {
${CONTRACTS_TO_EXTRACT.map((contractName) => `  ${contractName}ABI`)
  .filter((_, index) => {
    const abiPath = path.join(ABIS_OUTPUT_DIR, `${CONTRACTS_TO_EXTRACT[index]}.json`);
    return fs.existsSync(abiPath);
  })
  .join(',\n')}
};
`;

const typesPath = path.join(ABIS_OUTPUT_DIR, 'index.ts');
fs.writeFileSync(typesPath, typesContent);

console.log('✅ Created TypeScript exports');
console.log(`   → ${typesPath}\n`);
console.log('🎉 ABI extraction completed!');
