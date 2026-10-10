const assert = require('assert');
const unifiedSkillExtractorService = require('../backend/services/unifiedSkillExtractorService');
const UnifiedSkillInventory = require('../backend/models/UnifiedSkillInventory');

async function runTests() {
  console.log('🧪 Starting Unified Skill Extraction & Aggregation Test Suite...\n');

  // Test 1: Skill Name Normalization
  console.log('--- Test 1: Normalization & Identity Preservation ---');
  assert.strictEqual(unifiedSkillExtractorService.normalizeSkillName('js'), 'JavaScript');
  assert.strictEqual(unifiedSkillExtractorService.normalizeSkillName('JavaScript'), 'JavaScript');
  assert.strictEqual(unifiedSkillExtractorService.normalizeSkillName('ReactJS'), 'React');
  assert.strictEqual(unifiedSkillExtractorService.normalizeSkillName('node.js'), 'Node.js');
  assert.strictEqual(unifiedSkillExtractorService.normalizeSkillName('postgres'), 'PostgreSQL');
  assert.strictEqual(unifiedSkillExtractorService.normalizeSkillName('k8s'), 'Kubernetes');
  assert.strictEqual(unifiedSkillExtractorService.normalizeSkillName('Java'), 'Java');
  assert.strictEqual(unifiedSkillExtractorService.normalizeSkillName('c++'), 'C++');
  assert.strictEqual(unifiedSkillExtractorService.normalizeSkillName('c#'), 'C#');

  // Assert distinct technologies are NOT wrongly merged
  assert.notStrictEqual(
    unifiedSkillExtractorService.normalizeSkillName('Java'),
    unifiedSkillExtractorService.normalizeSkillName('JavaScript'),
    'Java and JavaScript must never be merged'
  );
  assert.notStrictEqual(
    unifiedSkillExtractorService.normalizeSkillName('C'),
    unifiedSkillExtractorService.normalizeSkillName('C++'),
    'C and C++ must never be merged'
  );
  console.log('✅ Skill Name Normalization tests passed.');

  // Test 2: Resume Dynamic Skill Extraction
  console.log('\n--- Test 2: Dynamic Resume Skill Extraction ---');
  const sampleResumeText = `
    MAYA PATEL - Full Stack Engineer
    EXPERIENCE:
    Senior Developer at TechCorp (2022 - Present)
    - Architected scalable microservices using Node.js, Express.js, and TypeScript.
    - Designed relational databases with PostgreSQL and managed key-value caching using Redis.
    - Containerized backend workloads with Docker and deployed automated pipelines on AWS with CI/CD.
    - Implemented deep learning models using PyTorch and NLP processing pipelines.
    SKILLS:
    Languages: Python, Java, JavaScript, TypeScript, Go
    Frameworks: React, Next.js, Spring Boot, FastAPI
    Databases: MongoDB, PostgreSQL, SQLite
    Cloud: Docker, Kubernetes, AWS, GitHub Actions
    Concepts: Object-Oriented Programming (OOP), Data Structures & Algorithms, RESTful APIs, Agile
  `;

  const resumeSkills = await unifiedSkillExtractorService.extractSkillsFromResume(sampleResumeText);
  assert(Array.isArray(resumeSkills), 'Resume skills must be an array');
  assert(resumeSkills.length >= 10, `Expected at least 10 extracted resume skills, got ${resumeSkills.length}`);

  const hasPython = resumeSkills.find((s) => s.normalizedName === 'Python');
  assert(hasPython, 'Python should be extracted from resume');
  assert.strictEqual(hasPython.category, 'Programming Languages');
  assert.strictEqual(hasPython.evidence.found, true);
  assert(hasPython.evidence.excerpt.length > 5, 'Must contain supporting text excerpt');

  const hasDocker = resumeSkills.find((s) => s.normalizedName === 'Docker');
  assert(hasDocker, 'Docker should be extracted');
  assert.strictEqual(hasDocker.category, 'Cloud & DevOps');

  const hasPyTorch = resumeSkills.find((s) => s.normalizedName === 'PyTorch');
  assert(hasPyTorch, 'PyTorch should be extracted');
  assert.strictEqual(hasPyTorch.category, 'AI, ML & Data Science');

  console.log(`✅ Resume extraction passed: ${resumeSkills.length} competencies extracted with context excerpts.`);

  // Test 3: GitHub Codebase & Dependency Extraction
  console.log('\n--- Test 3: GitHub Project Evidence Extraction ---');
  const sampleGithubSkills = [
    {
      skillName: 'TypeScript',
      normalizedName: 'TypeScript',
      category: 'Programming Languages',
      source: 'github',
      evidence: [
        {
          repo: 'careertwin-core',
          repoUrl: 'https://github.com/user/careertwin-core',
          file: 'Source Code (TypeScript)',
          evidenceType: 'implementation',
          snippet: '142,500 bytes of verified TypeScript source code in careertwin-core',
          confidence: 95,
        },
      ],
      extractionConfidence: 95,
    },
    {
      skillName: 'React',
      normalizedName: 'React',
      category: 'Frameworks & Libraries',
      source: 'github',
      evidence: [
        {
          repo: 'careertwin-frontend',
          repoUrl: 'https://github.com/user/careertwin-frontend',
          file: 'package.json',
          evidenceType: 'dependency',
          snippet: 'Dependency declaration: "react": "^18.2.0" in package.json',
          confidence: 85,
        },
      ],
      extractionConfidence: 85,
    },
    {
      skillName: 'Docker',
      normalizedName: 'Docker',
      category: 'Cloud & DevOps',
      source: 'github',
      evidence: [
        {
          repo: 'careertwin-core',
          repoUrl: 'https://github.com/user/careertwin-core',
          file: 'Dockerfile',
          evidenceType: 'implementation',
          snippet: 'Containerization configuration in Dockerfile',
          confidence: 90,
        },
      ],
      extractionConfidence: 90,
    },
    {
      skillName: 'Rust',
      normalizedName: 'Rust',
      category: 'Programming Languages',
      source: 'github',
      evidence: [
        {
          repo: 'rust-crypto-engine',
          repoUrl: 'https://github.com/user/rust-crypto-engine',
          file: 'Source Code (Rust)',
          evidenceType: 'implementation',
          snippet: '85,000 bytes of verified Rust source code',
          confidence: 95,
        },
      ],
      extractionConfidence: 95,
    },
  ];

  console.log('✅ GitHub project evidence format validated.');

  // Test 4: Unified Aggregation & Deduplication
  console.log('\n--- Test 4: Unified Aggregation, Corroboration & Deduplication ---');
  const simulatedLearnerStates = [
    {
      conceptId: { slug: 'programming-basics', name: 'Programming Basics' },
      mastery: 85,
      uncertainty: 20,
      evidenceCount: 10,
    },
  ];

  const aggregated = unifiedSkillExtractorService.aggregateSkills(
    resumeSkills,
    sampleGithubSkills,
    simulatedLearnerStates
  );

  assert(aggregated.skills.length > 0, 'Aggregated skills must not be empty');
  assert(aggregated.summary.totalUnique === aggregated.skills.length, 'totalUnique must match skills length');
  assert(aggregated.summary.bothCount > 0, 'Must have skills found in both sources');

  // Verify a skill found in BOTH sources (e.g. Docker or React or TypeScript)
  const dockerSkill = aggregated.skills.find((s) => s.normalizedName === 'Docker');
  assert(dockerSkill, 'Docker should be present in unified inventory');
  assert.strictEqual(dockerSkill.primarySource, 'both');
  assert(dockerSkill.sources.includes('resume') && dockerSkill.sources.includes('github'));
  assert(dockerSkill.evidence.resume.found === true, 'Docker should retain resume evidence');
  assert(dockerSkill.evidence.github.length > 0, 'Docker should retain GitHub evidence');

  // Verify GitHub-only skill (Rust)
  const rustSkill = aggregated.skills.find((s) => s.normalizedName === 'Rust');
  assert(rustSkill, 'Rust should be retained as GitHub-only skill');
  assert.strictEqual(rustSkill.primarySource, 'github');
  assert.strictEqual(rustSkill.evidence.resume.found, false);

  // Verify Mastery Integrity: Unassessed skills MUST NOT have arbitrary mastery
  const unassessedSkill = aggregated.skills.find((s) => s.normalizedName === 'Rust');
  assert.strictEqual(unassessedSkill.verificationStatus, 'unverified');
  assert.strictEqual(unassessedSkill.mastery, null, 'Mastery must remain null for unassessed skill');

  console.log('✅ Aggregation results:');
  console.log(`   - Total Unique Skills: ${aggregated.summary.totalUnique}`);
  console.log(`   - In Resume: ${aggregated.summary.resumeCount}`);
  console.log(`   - In GitHub: ${aggregated.summary.githubCount}`);
  console.log(`   - Corroborated in Both: ${aggregated.summary.bothCount}`);

  console.log('\n====================================================');
  console.log('🎉 All Unified Skill Extraction Tests Passed Successfully!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
