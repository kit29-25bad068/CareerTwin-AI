const axios = require('axios');
const geminiService = require('./geminiService');

/**
 * Normalization dictionary for equivalent skill aliases.
 * Important: Distinct technologies (e.g., Java vs JavaScript, C vs C++ vs C#) MUST NOT be merged.
 */
const CANONICAL_SKILL_MAP = {
  // Programming Languages
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'ecmascript': 'JavaScript',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'py': 'Python',
  'python': 'Python',
  'python3': 'Python',
  'java': 'Java',
  'core java': 'Java',
  'java core': 'Java',
  'cpp': 'C++',
  'c++': 'C++',
  'csharp': 'C#',
  'c#': 'C#',
  'c': 'C',
  'golang': 'Go',
  'go': 'Go',
  'rust': 'Rust',
  'ruby': 'Ruby',
  'php': 'PHP',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'r': 'R',
  'scala': 'Scala',
  'dart': 'Dart',
  'shell': 'Shell Scripting',
  'bash': 'Bash',
  'powershell': 'PowerShell',
  'sql': 'SQL',
  'html': 'HTML5',
  'html5': 'HTML5',
  'css': 'CSS3',
  'css3': 'CSS3',

  // Frameworks & Libraries
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'express': 'Express.js',
  'expressjs': 'Express.js',
  'express.js': 'Express.js',
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  'react native': 'React Native',
  'next': 'Next.js',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'vue': 'Vue.js',
  'vuejs': 'Vue.js',
  'vue.js': 'Vue.js',
  'angular': 'Angular',
  'angularjs': 'Angular',
  'angular.js': 'Angular',
  'svelte': 'Svelte',
  'django': 'Django',
  'flask': 'Flask',
  'fastapi': 'FastAPI',
  'spring': 'Spring Boot',
  'spring boot': 'Spring Boot',
  'springboot': 'Spring Boot',
  'spring framework': 'Spring Boot',
  'nest': 'NestJS',
  'nestjs': 'NestJS',
  'nest.js': 'NestJS',
  'redux': 'Redux',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'bootstrap': 'Bootstrap',
  'sass': 'Sass / SCSS',
  'scss': 'Sass / SCSS',
  'jquery': 'jQuery',
  'graphql': 'GraphQL',

  // Databases & Storage
  'mongo': 'MongoDB',
  'mongodb': 'MongoDB',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'psql': 'PostgreSQL',
  'mysql': 'MySQL',
  'sqlite': 'SQLite',
  'redis': 'Redis',
  'cassandra': 'Cassandra',
  'dynamodb': 'DynamoDB',
  'prisma': 'Prisma ORM',
  'mongoose': 'Mongoose',
  'sequelize': 'Sequelize',
  'typeorm': 'TypeORM',
  'elasticsearch': 'Elasticsearch',

  // Cloud & DevOps
  'docker': 'Docker',
  'containerization': 'Docker',
  'k8s': 'Kubernetes',
  'kubernetes': 'Kubernetes',
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'gcp': 'Google Cloud Platform (GCP)',
  'google cloud': 'Google Cloud Platform (GCP)',
  'azure': 'Microsoft Azure',
  'microsoft azure': 'Microsoft Azure',
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',
  'github actions': 'GitHub Actions',
  'jenkins': 'Jenkins',
  'terraform': 'Terraform',
  'ansible': 'Ansible',
  'nginx': 'Nginx',
  'linux': 'Linux',

  // AI, ML & Data Science
  'tensorflow': 'TensorFlow',
  'tf': 'TensorFlow',
  'pytorch': 'PyTorch',
  'torch': 'PyTorch',
  'scikit-learn': 'Scikit-Learn',
  'sklearn': 'Scikit-Learn',
  'pandas': 'Pandas',
  'numpy': 'NumPy',
  'keras': 'Keras',
  'scipy': 'SciPy',
  'matplotlib': 'Matplotlib',
  'seaborn': 'Seaborn',
  'nlp': 'Natural Language Processing (NLP)',
  'natural language processing': 'Natural Language Processing (NLP)',
  'computer vision': 'Computer Vision',
  'cv': 'Computer Vision',
  'deep learning': 'Deep Learning',
  'dl': 'Deep Learning',
  'machine learning': 'Machine Learning',
  'ml': 'Machine Learning',
  'llm': 'Large Language Models (LLMs)',
  'generative ai': 'Generative AI',
  'genai': 'Generative AI',

  // Developer Tools & Platforms
  'git': 'Git',
  'github': 'GitHub',
  'gitlab': 'GitLab',
  'jira': 'Jira',
  'postman': 'Postman',
  'vite': 'Vite',
  'webpack': 'Webpack',
  'jest': 'Jest',
  'pytest': 'PyTest',
  'mocha': 'Mocha',
  'cypress': 'Cypress',

  // Software Architecture & Concepts
  'oop': 'Object-Oriented Programming (OOP)',
  'object-oriented programming': 'Object-Oriented Programming (OOP)',
  'object oriented programming': 'Object-Oriented Programming (OOP)',
  'dsa': 'Data Structures & Algorithms',
  'data structures': 'Data Structures & Algorithms',
  'data structures and algorithms': 'Data Structures & Algorithms',
  'microservices': 'Microservices Architecture',
  'system design': 'System Design',
  'design patterns': 'Software Design Patterns',
  'rest': 'RESTful APIs',
  'rest api': 'RESTful APIs',
  'restful apis': 'RESTful APIs',
  'restful api': 'RESTful APIs',
  'grpc': 'gRPC',
  'websockets': 'WebSockets',
  'websocket': 'WebSockets',

  // Engineering Methodologies
  'agile': 'Agile / Scrum',
  'scrum': 'Agile / Scrum',
  'tdd': 'Test-Driven Development (TDD)',
  'test driven development': 'Test-Driven Development (TDD)',
  'code review': 'Code Review & Quality',
};

const CATEGORY_MAP = {
  // Programming Languages
  'JavaScript': 'Programming Languages',
  'TypeScript': 'Programming Languages',
  'Python': 'Programming Languages',
  'Java': 'Programming Languages',
  'C++': 'Programming Languages',
  'C#': 'Programming Languages',
  'C': 'Programming Languages',
  'Go': 'Programming Languages',
  'Rust': 'Programming Languages',
  'Ruby': 'Programming Languages',
  'PHP': 'Programming Languages',
  'Swift': 'Programming Languages',
  'Kotlin': 'Programming Languages',
  'R': 'Programming Languages',
  'Scala': 'Programming Languages',
  'Dart': 'Programming Languages',
  'SQL': 'Programming Languages',
  'HTML5': 'Programming Languages',
  'CSS3': 'Programming Languages',
  'Shell Scripting': 'Programming Languages',
  'Bash': 'Programming Languages',
  'PowerShell': 'Programming Languages',

  // Frameworks & Libraries
  'React': 'Frameworks & Libraries',
  'React Native': 'Frameworks & Libraries',
  'Next.js': 'Frameworks & Libraries',
  'Vue.js': 'Frameworks & Libraries',
  'Angular': 'Frameworks & Libraries',
  'Svelte': 'Frameworks & Libraries',
  'Node.js': 'Frameworks & Libraries',
  'Express.js': 'Frameworks & Libraries',
  'NestJS': 'Frameworks & Libraries',
  'Django': 'Frameworks & Libraries',
  'Flask': 'Frameworks & Libraries',
  'FastAPI': 'Frameworks & Libraries',
  'Spring Boot': 'Frameworks & Libraries',
  'Redux': 'Frameworks & Libraries',
  'Tailwind CSS': 'Frameworks & Libraries',
  'Bootstrap': 'Frameworks & Libraries',
  'Sass / SCSS': 'Frameworks & Libraries',
  'GraphQL': 'Frameworks & Libraries',

  // Databases & Storage
  'MongoDB': 'Databases & Storage',
  'PostgreSQL': 'Databases & Storage',
  'MySQL': 'Databases & Storage',
  'SQLite': 'Databases & Storage',
  'Redis': 'Databases & Storage',
  'Cassandra': 'Databases & Storage',
  'DynamoDB': 'Databases & Storage',
  'Prisma ORM': 'Databases & Storage',
  'Mongoose': 'Databases & Storage',
  'Sequelize': 'Databases & Storage',
  'TypeORM': 'Databases & Storage',
  'Elasticsearch': 'Databases & Storage',

  // Cloud & DevOps
  'Docker': 'Cloud & DevOps',
  'Kubernetes': 'Cloud & DevOps',
  'AWS': 'Cloud & DevOps',
  'Google Cloud Platform (GCP)': 'Cloud & DevOps',
  'Microsoft Azure': 'Cloud & DevOps',
  'CI/CD': 'Cloud & DevOps',
  'GitHub Actions': 'Cloud & DevOps',
  'Jenkins': 'Cloud & DevOps',
  'Terraform': 'Cloud & DevOps',
  'Ansible': 'Cloud & DevOps',
  'Nginx': 'Cloud & DevOps',
  'Linux': 'Cloud & DevOps',

  // AI, ML & Data Science
  'Machine Learning': 'AI, ML & Data Science',
  'Deep Learning': 'AI, ML & Data Science',
  'TensorFlow': 'AI, ML & Data Science',
  'PyTorch': 'AI, ML & Data Science',
  'Scikit-Learn': 'AI, ML & Data Science',
  'Pandas': 'AI, ML & Data Science',
  'NumPy': 'AI, ML & Data Science',
  'Keras': 'AI, ML & Data Science',
  'Natural Language Processing (NLP)': 'AI, ML & Data Science',
  'Computer Vision': 'AI, ML & Data Science',
  'Large Language Models (LLMs)': 'AI, ML & Data Science',
  'Generative AI': 'AI, ML & Data Science',

  // Developer Tools & Platforms
  'Git': 'Developer Tools & Platforms',
  'GitHub': 'Developer Tools & Platforms',
  'GitLab': 'Developer Tools & Platforms',
  'Postman': 'Developer Tools & Platforms',
  'Vite': 'Developer Tools & Platforms',
  'Webpack': 'Developer Tools & Platforms',
  'Jest': 'Developer Tools & Platforms',
  'PyTest': 'Developer Tools & Platforms',
  'Mocha': 'Developer Tools & Platforms',
  'Cypress': 'Developer Tools & Platforms',
  'Jira': 'Developer Tools & Platforms',

  // Architecture & Concepts
  'Object-Oriented Programming (OOP)': 'Software Architecture & Concepts',
  'Data Structures & Algorithms': 'Software Architecture & Concepts',
  'Microservices Architecture': 'Software Architecture & Concepts',
  'System Design': 'Software Architecture & Concepts',
  'Software Design Patterns': 'Software Architecture & Concepts',
  'RESTful APIs': 'Software Architecture & Concepts',
  'gRPC': 'Software Architecture & Concepts',
  'WebSockets': 'Software Architecture & Concepts',

  // Engineering Methodologies
  'Agile / Scrum': 'Technical Methodologies',
  'Test-Driven Development (TDD)': 'Technical Methodologies',
  'Code Review & Quality': 'Technical Methodologies',
};

/**
 * Normalize skill name cleanly without merging distinct technologies.
 */
function normalizeSkillName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  const cleaned = rawName.trim().replace(/^[-•*#\s]+/, '').replace(/[,;:]+$/, '');
  const key = cleaned.toLowerCase();

  if (CANONICAL_SKILL_MAP[key]) {
    return CANONICAL_SKILL_MAP[key];
  }

  // Preserve acronyms / title casing for unmapped skills
  if (cleaned.length <= 4 && cleaned === cleaned.toUpperCase()) {
    return cleaned;
  }

  // Clean title case fallback
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Assign appropriate technical category to a normalized skill.
 */
function assignCategory(normalizedName, explicitCategory = null) {
  if (CATEGORY_MAP[normalizedName]) {
    return CATEGORY_MAP[normalizedName];
  }

  if (explicitCategory && explicitCategory !== 'Other' && explicitCategory !== 'Other Technical Skills') {
    return explicitCategory;
  }

  const lower = normalizedName.toLowerCase();
  if (lower.includes('language') || lower.includes('script')) return 'Programming Languages';
  if (lower.includes('framework') || lower.includes('library') || lower.includes('react') || lower.includes('vue')) return 'Frameworks & Libraries';
  if (lower.includes('db') || lower.includes('sql') || lower.includes('database') || lower.includes('data store')) return 'Databases & Storage';
  if (lower.includes('cloud') || lower.includes('devops') || lower.includes('deploy') || lower.includes('docker') || lower.includes('ci/cd')) return 'Cloud & DevOps';
  if (lower.includes('ai') || lower.includes('ml') || lower.includes('learning') || lower.includes('model') || lower.includes('data science') || lower.includes('vision') || lower.includes('nlp')) return 'AI, ML & Data Science';
  if (lower.includes('tool') || lower.includes('test') || lower.includes('git') || lower.includes('cli') || lower.includes('ide')) return 'Developer Tools & Platforms';
  if (lower.includes('architecture') || lower.includes('design') || lower.includes('pattern') || lower.includes('api') || lower.includes('algorithm') || lower.includes('structure')) return 'Software Architecture & Concepts';
  if (lower.includes('agile') || lower.includes('scrum') || lower.includes('method') || lower.includes('process')) return 'Technical Methodologies';

  return 'Other Technical Skills';
}

/**
 * Extract excerpt containing skill in resume text.
 */
function findSupportingExcerpt(rawText, skillName) {
  if (!rawText) return '';
  const lines = rawText.split('\n');
  const escaped = skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (regex.test(line) && line.length > 5) {
      // Find enclosing section if possible
      let section = 'General';
      for (let j = Math.max(0, i - 10); j <= i; j++) {
        const prev = lines[j].trim().toUpperCase();
        if (/^(SKILLS|TECHNICAL SKILLS|EXPERIENCE|WORK EXPERIENCE|PROJECTS|EDUCATION|SUMMARY)/.test(prev)) {
          section = prev.slice(0, 30);
          break;
        }
      }
      return { section, excerpt: line.slice(0, 240) };
    }
  }

  // Fallback: check whole text
  const match = regex.exec(rawText);
  if (match) {
    const start = Math.max(0, match.index - 50);
    const end = Math.min(rawText.length, match.index + skillName.length + 80);
    return {
      section: 'Resume Context',
      excerpt: rawText.substring(start, end).replace(/\s+/g, ' ').trim(),
    };
  }

  return { section: 'Resume Text', excerpt: `Mentioned in candidate resume document.` };
}

/**
 * Extract skills dynamically from resume text or Resume & CV Analyzer document.
 */
async function extractSkillsFromResume(input, targetRole = 'Software Engineer') {
  let rawText = '';
  let preExtractedSkills = [];
  let projectTechs = [];

  if (typeof input === 'string') {
    rawText = input;
  } else if (input && typeof input === 'object') {
    rawText = input.rawText || '';
    if (Array.isArray(input.parsedData?.skills)) {
      preExtractedSkills = input.parsedData.skills;
    }
    if (Array.isArray(input.parsedData?.projects)) {
      input.parsedData.projects.forEach((p) => {
        if (Array.isArray(p.techStack)) {
          p.techStack.forEach((t) => projectTechs.push({ tech: t, projectTitle: p.title || 'Project' }));
        }
      });
    }
  }

  if (!rawText && preExtractedSkills.length === 0) {
    return [];
  }

  const resumeSkillsMap = new Map();

  // 1. Ingest skills directly identified by Resume & CV Analyzer
  for (const s of preExtractedSkills) {
    if (s && typeof s === 'string') {
      const canonical = normalizeSkillName(s);
      if (canonical) {
        resumeSkillsMap.set(canonical, {
          skillName: s.trim(),
          normalizedName: canonical,
          category: assignCategory(canonical),
          source: 'resume',
          evidence: {
            found: true,
            section: 'Resume & CV Analyzer (Parsed Skills)',
            excerpt: `Directly detected in candidate resume by Resume & CV Analyzer engine.`,
            confidence: 95,
          },
          extractionConfidence: 95,
        });
      }
    }
  }

  // 2. Ingest tech stacks from Resume & CV Analyzer project records
  for (const item of projectTechs) {
    if (item.tech && typeof item.tech === 'string') {
      const canonical = normalizeSkillName(item.tech);
      if (canonical && !resumeSkillsMap.has(canonical)) {
        resumeSkillsMap.set(canonical, {
          skillName: item.tech.trim(),
          normalizedName: canonical,
          category: assignCategory(canonical),
          source: 'resume',
          evidence: {
            found: true,
            section: `Resume & CV Analyzer (Project: ${item.projectTitle})`,
            excerpt: `Tech stack requirement in project "${item.projectTitle}" on candidate resume.`,
            confidence: 90,
          },
          extractionConfidence: 90,
        });
      }
    }
  }

  // 1. Deterministic NLP / Pattern scanner across known canonical dictionary
  const knownKeywords = Object.keys(CANONICAL_SKILL_MAP);
  for (const keyword of knownKeywords) {
    // Avoid short ambiguous acronyms without word boundaries
    if (keyword.length <= 2 && !['js', 'ts', 'py', 'c#', 'c', 'r', 'go', 'ai', 'ml', 'dl', 'db'].includes(keyword)) {
      continue;
    }
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(^|[^a-zA-Z0-9_+#])${escaped}([^a-zA-Z0-9_+#]|$)`, 'i');
    if (pattern.test(rawText)) {
      const canonical = CANONICAL_SKILL_MAP[keyword];
      if (!resumeSkillsMap.has(canonical)) {
        const { section, excerpt } = findSupportingExcerpt(rawText, keyword);
        const inSkillsSection = section.toUpperCase().includes('SKILL');
        const inExpSection = section.toUpperCase().includes('EXPERIENCE') || section.toUpperCase().includes('PROJECT');
        const confidence = inSkillsSection ? 95 : inExpSection ? 90 : 82;

        resumeSkillsMap.set(canonical, {
          skillName: canonical,
          normalizedName: canonical,
          category: assignCategory(canonical),
          source: 'resume',
          evidence: {
            found: true,
            section,
            excerpt,
            confidence,
          },
          extractionConfidence: confidence,
        });
      }
    }
  }

  // 2. AI-assisted dynamic extraction with Gemini (if available) for niche, domain-specific, or emerging skills
  try {
    const prompt = `You are a Technical Skill Extraction Engine.
Analyze this resume text and extract all identifiable technical skills, including:
- Programming languages
- Frameworks and libraries
- Databases and storage systems
- Cloud, DevOps, and infrastructure technologies
- AI, Machine Learning, and Data Science tools/frameworks
- Developer tools, testing frameworks, and platforms
- Software engineering concepts, architecture, and methodologies

IMPORTANT:
- Extract skills dynamically based on actual evidence in the resume.
- For each skill, include the EXACT excerpt or sentence from the resume where it appears, and estimated confidence (0-100).
- Do not invent skills not mentioned in the text.

Resume Text:
"""
${rawText.slice(0, 6000)}
"""

Return ONLY a JSON array of objects with schema:
[
  {
    "skillName": "Skill Name",
    "category": "Programming Languages | Frameworks & Libraries | Databases & Storage | Cloud & DevOps | AI, ML & Data Science | Developer Tools & Platforms | Software Architecture & Concepts | Technical Methodologies | Other Technical Skills",
    "section": "Section name where found (e.g. Skills, Experience, Projects)",
    "excerpt": "Exact text or bullet point mentioning the skill",
    "confidence": 85
  }
]`;

    const aiResults = await geminiService.callGemini(prompt, 'You are an accurate technical skill extraction engine. Return valid JSON only.', true, { temperature: 0.2 });

    if (Array.isArray(aiResults)) {
      for (const item of aiResults) {
        if (item && item.skillName) {
          const canonical = normalizeSkillName(item.skillName);
          if (canonical && canonical.length >= 2) {
            const category = assignCategory(canonical, item.category);
            const excerpt = item.excerpt || (findSupportingExcerpt(rawText, canonical).excerpt);
            const section = item.section || (findSupportingExcerpt(rawText, canonical).section);
            const confidence = Math.min(100, Math.max(50, Number(item.confidence) || 85));

            if (!resumeSkillsMap.has(canonical)) {
              resumeSkillsMap.set(canonical, {
                skillName: item.skillName.trim(),
                normalizedName: canonical,
                category,
                source: 'resume',
                evidence: {
                  found: true,
                  section,
                  excerpt,
                  confidence,
                },
                extractionConfidence: confidence,
              });
            } else {
              // Update with richer excerpt if available
              const existing = resumeSkillsMap.get(canonical);
              if (excerpt && (!existing.evidence.excerpt || existing.evidence.excerpt.length < excerpt.length)) {
                existing.evidence.excerpt = excerpt;
                existing.evidence.section = section;
              }
            }
          }
        }
      }
    }
  } catch (aiErr) {
    console.warn('[Skill Extractor AI Note]: Gemini dynamic extraction fallback triggered:', aiErr.message);
  }

  return Array.from(resumeSkillsMap.values());
}

/**
 * Inspect GitHub repositories and extract verifiable skills with direct code & dependency evidence.
 * Accepts either username string or GitHubProfile document from GitHub Signals.
 */
async function extractSkillsFromGitHub(input, repoUrls = []) {
  let cleanUsername = '';
  let preExtractedLanguages = [];
  let profileRepos = [];

  if (typeof input === 'string') {
    cleanUsername = input.trim().replace(/^@/, '');
  } else if (input && typeof input === 'object') {
    cleanUsername = (input.username || '').trim().replace(/^@/, '');
    if (Array.isArray(input.topLanguages)) {
      preExtractedLanguages = input.topLanguages;
    }
    if (Array.isArray(input.repositories)) {
      profileRepos = input.repositories;
    }
  }

  const githubSkillsMap = new Map();
  const notes = [];
  let analyzedReposCount = 0;

  // 1. Ingest languages and engineering signals directly identified by GitHub Signals
  for (const l of preExtractedLanguages) {
    if (l && l.language && l.language !== 'Unspecified') {
      const canonical = normalizeSkillName(l.language);
      if (canonical) {
        const evidenceItem = {
          repo: 'GitHub Signals Profile',
          repoUrl: cleanUsername ? `https://github.com/${cleanUsername}` : 'https://github.com',
          file: `Codebase Language Analysis (${l.language})`,
          evidenceType: 'implementation',
          snippet: `Identified by GitHub Signals: ${l.percentage || 0}% of analyzed codebase across ${l.repoCount || 1} repositories.`,
          confidence: 95,
        };

        githubSkillsMap.set(canonical, {
          skillName: l.language,
          normalizedName: canonical,
          category: assignCategory(canonical, 'Programming Languages'),
          source: 'github',
          evidence: [evidenceItem],
          extractionConfidence: 95,
        });
      }
    }
  }

  // Ingest repository languages from GitHub Signals profile records
  for (const r of profileRepos) {
    if (r && r.language && r.language !== 'Unspecified') {
      const canonical = normalizeSkillName(r.language);
      if (canonical && !githubSkillsMap.has(canonical)) {
        const evidenceItem = {
          repo: r.name || 'Repository',
          repoUrl: r.htmlUrl || (cleanUsername ? `https://github.com/${cleanUsername}/${r.name}` : ''),
          file: `Primary Repository Language (${r.language})`,
          evidenceType: 'implementation',
          snippet: `Primary repository language detected by GitHub Signals for "${r.name}".`,
          confidence: 90,
        };

        githubSkillsMap.set(canonical, {
          skillName: r.language,
          normalizedName: canonical,
          category: assignCategory(canonical, 'Programming Languages'),
          source: 'github',
          evidence: [evidenceItem],
          extractionConfidence: 90,
        });
      }
    }
  }

  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'CareerTwin-AI-Platform',
  };

  const token = process.env.GITHUB_TOKEN;
  if (token && token !== 'your_github_personal_access_token_here') {
    headers.Authorization = `token ${token}`;
  }

  // 2. Gather repositories to inspect deeper
  let targetRepos = [];

  // Use repos from GitHub Signals document if present
  for (const r of profileRepos.slice(0, 8)) {
    targetRepos.push({
      owner: cleanUsername,
      name: r.name,
      html_url: r.htmlUrl || `https://github.com/${cleanUsername}/${r.name}`,
      language: r.language,
      description: r.description,
    });
  }

  // Parse any explicit repository URLs passed
  if (Array.isArray(repoUrls) && repoUrls.length > 0) {
    for (const url of repoUrls) {
      if (typeof url === 'string' && url.includes('github.com/')) {
        const parts = url.split('github.com/')[1]?.split('/');
        if (parts && parts.length >= 2) {
          const owner = parts[0].trim();
          const repo = parts[1].replace(/\.git$/, '').trim();
          if (!targetRepos.some((t) => t.name.toLowerCase() === repo.toLowerCase())) {
            targetRepos.push({ owner, name: repo, html_url: `https://github.com/${owner}/${repo}` });
          }
        }
      }
    }
  }

  // If username provided, fetch user's public repositories
  if (cleanUsername) {
    try {
      const reposRes = await axios.get(
        `https://api.github.com/users/${cleanUsername}/repos?per_page=15&sort=updated`,
        { headers, timeout: 10000 }
      );
      const userRepos = reposRes.data || [];
      const nonForks = userRepos.filter((r) => !r.fork);
      const chosen = nonForks.length > 0 ? nonForks : userRepos;

      for (const r of chosen.slice(0, 8)) {
        if (!targetRepos.some((t) => t.name.toLowerCase() === r.name.toLowerCase())) {
          targetRepos.push({
            owner: r.owner?.login || cleanUsername,
            name: r.name,
            html_url: r.html_url,
            language: r.language,
            description: r.description,
          });
        }
      }
      notes.push(`Successfully accessed ${chosen.length} public repositories for @${cleanUsername}.`);
    } catch (userErr) {
      if (userErr.response && userErr.response.status === 404) {
        notes.push(`GitHub profile @${cleanUsername} was not found.`);
      } else if (userErr.response && userErr.response.status === 403) {
        notes.push(`GitHub API rate limit reached. Public repository metadata used where cached.`);
      } else {
        notes.push(`Could not connect to GitHub user @${cleanUsername}: ${userErr.message}`);
      }
    }
  }

  if (targetRepos.length === 0) {
    return { skills: [], notes, analyzedReposCount: 0 };
  }

  // 2. Inspect each repository for verifiable code, dependencies, and documentation
  for (const repoInfo of targetRepos.slice(0, 6)) {
    const { owner, name, html_url } = repoInfo;
    analyzedReposCount++;

    // A. Languages Endpoint (Direct Implementation Evidence via Code Bytes)
    try {
      const langRes = await axios.get(
        `https://api.github.com/repos/${owner}/${name}/languages`,
        { headers, timeout: 8000 }
      );
      const languages = langRes.data || {};
      for (const [lang, bytes] of Object.entries(languages)) {
        if (bytes > 300) {
          const canonical = normalizeSkillName(lang);
          const evidenceItem = {
            repo: name,
            repoUrl: html_url,
            file: `Source Code (${lang})`,
            evidenceType: 'implementation',
            snippet: `${bytes.toLocaleString()} bytes of verified ${lang} source code in ${name}`,
            confidence: bytes > 5000 ? 95 : 85,
          };

          if (!githubSkillsMap.has(canonical)) {
            githubSkillsMap.set(canonical, {
              skillName: lang,
              normalizedName: canonical,
              category: assignCategory(canonical, 'Programming Languages'),
              source: 'github',
              evidence: [evidenceItem],
              extractionConfidence: evidenceItem.confidence,
            });
          } else {
            githubSkillsMap.get(canonical).evidence.push(evidenceItem);
          }
        }
      }
    } catch (langErr) {
      // Gracefully continue
    }

    // B. Package & Dependency Configuration Files (Verifiable Package Dependencies)
    const dependencyFiles = [
      { path: 'package.json', type: 'node' },
      { path: 'requirements.txt', type: 'python' },
      { path: 'pom.xml', type: 'maven' },
      { path: 'go.mod', type: 'go' },
      { path: 'Cargo.toml', type: 'rust' },
      { path: 'Dockerfile', type: 'docker' },
      { path: 'docker-compose.yml', type: 'docker-compose' },
    ];

    for (const depFile of dependencyFiles) {
      try {
        const fileRes = await axios.get(
          `https://api.github.com/repos/${owner}/${name}/contents/${depFile.path}`,
          { headers, timeout: 8000 }
        );

        if (fileRes.data && fileRes.data.content) {
          const fileContent = Buffer.from(fileRes.data.content, 'base64').toString('utf8');

          if (depFile.type === 'node') {
            try {
              const pkgJson = JSON.parse(fileContent);
              const allDeps = {
                ...(pkgJson.dependencies || {}),
                ...(pkgJson.devDependencies || {}),
              };

              const nodeDepMappings = {
                'react': { name: 'React', cat: 'Frameworks & Libraries' },
                'react-dom': { name: 'React', cat: 'Frameworks & Libraries' },
                'next': { name: 'Next.js', cat: 'Frameworks & Libraries' },
                'vue': { name: 'Vue.js', cat: 'Frameworks & Libraries' },
                '@angular/core': { name: 'Angular', cat: 'Frameworks & Libraries' },
                'express': { name: 'Express.js', cat: 'Frameworks & Libraries' },
                '@nestjs/core': { name: 'NestJS', cat: 'Frameworks & Libraries' },
                'redux': { name: 'Redux', cat: 'Frameworks & Libraries' },
                '@reduxjs/toolkit': { name: 'Redux', cat: 'Frameworks & Libraries' },
                'tailwindcss': { name: 'Tailwind CSS', cat: 'Frameworks & Libraries' },
                'bootstrap': { name: 'Bootstrap', cat: 'Frameworks & Libraries' },
                'mongoose': { name: 'Mongoose', cat: 'Databases & Storage' },
                'mongodb': { name: 'MongoDB', cat: 'Databases & Storage' },
                'pg': { name: 'PostgreSQL', cat: 'Databases & Storage' },
                'mysql2': { name: 'MySQL', cat: 'Databases & Storage' },
                'sqlite3': { name: 'SQLite', cat: 'Databases & Storage' },
                'redis': { name: 'Redis', cat: 'Databases & Storage' },
                '@prisma/client': { name: 'Prisma ORM', cat: 'Databases & Storage' },
                'prisma': { name: 'Prisma ORM', cat: 'Databases & Storage' },
                'graphql': { name: 'GraphQL', cat: 'Frameworks & Libraries' },
                'axios': { name: 'RESTful APIs', cat: 'Software Architecture & Concepts' },
                'jest': { name: 'Jest', cat: 'Developer Tools & Platforms' },
                'typescript': { name: 'TypeScript', cat: 'Programming Languages' },
                'vite': { name: 'Vite', cat: 'Developer Tools & Platforms' },
                'webpack': { name: 'Webpack', cat: 'Developer Tools & Platforms' },
                'socket.io': { name: 'WebSockets', cat: 'Software Architecture & Concepts' },
              };

              // Also add Node.js as environment dependency
              if (Object.keys(allDeps).length > 0) {
                const nodeCanonical = 'Node.js';
                const nodeEvidence = {
                  repo: name,
                  repoUrl: html_url,
                  file: 'package.json',
                  evidenceType: 'dependency',
                  snippet: `Configured Node.js runtime environment with ${Object.keys(allDeps).length} package dependencies in ${name}`,
                  confidence: 88,
                };
                if (!githubSkillsMap.has(nodeCanonical)) {
                  githubSkillsMap.set(nodeCanonical, {
                    skillName: 'Node.js',
                    normalizedName: nodeCanonical,
                    category: 'Frameworks & Libraries',
                    source: 'github',
                    evidence: [nodeEvidence],
                    extractionConfidence: 88,
                  });
                } else {
                  githubSkillsMap.get(nodeCanonical).evidence.push(nodeEvidence);
                }
              }

              for (const [depPkg, version] of Object.entries(allDeps)) {
                if (nodeDepMappings[depPkg]) {
                  const mapped = nodeDepMappings[depPkg];
                  const canonical = normalizeSkillName(mapped.name);
                  const evidenceItem = {
                    repo: name,
                    repoUrl: html_url,
                    file: 'package.json',
                    evidenceType: 'dependency',
                    snippet: `Dependency declaration: "${depPkg}": "${version}" in package.json`,
                    confidence: 85,
                  };

                  if (!githubSkillsMap.has(canonical)) {
                    githubSkillsMap.set(canonical, {
                      skillName: mapped.name,
                      normalizedName: canonical,
                      category: mapped.cat,
                      source: 'github',
                      evidence: [evidenceItem],
                      extractionConfidence: 85,
                    });
                  } else {
                    githubSkillsMap.get(canonical).evidence.push(evidenceItem);
                  }
                }
              }
            } catch (jsonErr) {}
          } else if (depFile.type === 'python') {
            const pythonDeps = [
              { key: 'django', name: 'Django', cat: 'Frameworks & Libraries' },
              { key: 'flask', name: 'Flask', cat: 'Frameworks & Libraries' },
              { key: 'fastapi', name: 'FastAPI', cat: 'Frameworks & Libraries' },
              { key: 'numpy', name: 'NumPy', cat: 'AI, ML & Data Science' },
              { key: 'pandas', name: 'Pandas', cat: 'AI, ML & Data Science' },
              { key: 'torch', name: 'PyTorch', cat: 'AI, ML & Data Science' },
              { key: 'tensorflow', name: 'TensorFlow', cat: 'AI, ML & Data Science' },
              { key: 'scikit-learn', name: 'Scikit-Learn', cat: 'AI, ML & Data Science' },
              { key: 'pytest', name: 'PyTest', cat: 'Developer Tools & Platforms' },
            ];

            for (const item of pythonDeps) {
              const regex = new RegExp(`^${item.key}\\b`, 'im');
              if (regex.test(fileContent)) {
                const canonical = normalizeSkillName(item.name);
                const evidenceItem = {
                  repo: name,
                  repoUrl: html_url,
                  file: 'requirements.txt',
                  evidenceType: 'dependency',
                  snippet: `Package requirement: ${item.key} declared in requirements.txt`,
                  confidence: 85,
                };

                if (!githubSkillsMap.has(canonical)) {
                  githubSkillsMap.set(canonical, {
                    skillName: item.name,
                    normalizedName: canonical,
                    category: item.cat,
                    source: 'github',
                    evidence: [evidenceItem],
                    extractionConfidence: 85,
                  });
                } else {
                  githubSkillsMap.get(canonical).evidence.push(evidenceItem);
                }
              }
            }
          } else if (depFile.type === 'docker' || depFile.type === 'docker-compose') {
            const canonical = 'Docker';
            const evidenceItem = {
              repo: name,
              repoUrl: html_url,
              file: depFile.path,
              evidenceType: 'implementation',
              snippet: `Containerization configuration in ${depFile.path}`,
              confidence: 90,
            };

            if (!githubSkillsMap.has(canonical)) {
              githubSkillsMap.set(canonical, {
                skillName: 'Docker',
                normalizedName: canonical,
                category: 'Cloud & DevOps',
                source: 'github',
                evidence: [evidenceItem],
                extractionConfidence: 90,
              });
            } else {
              githubSkillsMap.get(canonical).evidence.push(evidenceItem);
            }
          }
        }
      } catch (fileErr) {
        // File does not exist in repo (404), gracefully ignore without error
      }
    }

    // C. Check GitHub Actions Workflows (CI/CD Evidence)
    try {
      const workflowRes = await axios.get(
        `https://api.github.com/repos/${owner}/${name}/contents/.github/workflows`,
        { headers, timeout: 6000 }
      );
      if (Array.isArray(workflowRes.data) && workflowRes.data.length > 0) {
        const canonical = 'GitHub Actions';
        const evidenceItem = {
          repo: name,
          repoUrl: html_url,
          file: `.github/workflows/${workflowRes.data[0].name}`,
          evidenceType: 'implementation',
          snippet: `Automated CI/CD workflow defined in .github/workflows`,
          confidence: 90,
        };
        if (!githubSkillsMap.has(canonical)) {
          githubSkillsMap.set(canonical, {
            skillName: 'GitHub Actions',
            normalizedName: canonical,
            category: 'Cloud & DevOps',
            source: 'github',
            evidence: [evidenceItem],
            extractionConfidence: 90,
          });
        } else {
          githubSkillsMap.get(canonical).evidence.push(evidenceItem);
        }

        const cicdCanonical = 'CI/CD';
        if (!githubSkillsMap.has(cicdCanonical)) {
          githubSkillsMap.set(cicdCanonical, {
            skillName: 'CI/CD',
            normalizedName: cicdCanonical,
            category: 'Cloud & DevOps',
            source: 'github',
            evidence: [evidenceItem],
            extractionConfidence: 88,
          });
        }
      }
    } catch (wfErr) {}

    // D. Check README.md (Documentation Evidence)
    try {
      const readmeRes = await axios.get(
        `https://api.github.com/repos/${owner}/${name}/readme`,
        { headers, timeout: 6000 }
      );
      if (readmeRes.data && readmeRes.data.content) {
        const readmeContent = Buffer.from(readmeRes.data.content, 'base64').toString('utf8');
        const docKeywords = [
          'REST API',
          'GraphQL',
          'Microservices',
          'System Design',
          'Object-Oriented Programming',
          'TDD',
          'Agile',
        ];

        for (const kw of docKeywords) {
          if (new RegExp(`\\b${kw}\\b`, 'i').test(readmeContent)) {
            const canonical = normalizeSkillName(kw);
            const evidenceItem = {
              repo: name,
              repoUrl: html_url,
              file: 'README.md',
              evidenceType: 'documentation',
              snippet: `Architecture & methodology documentation in README.md: "${kw}"`,
              confidence: 72,
            };

            if (!githubSkillsMap.has(canonical)) {
              githubSkillsMap.set(canonical, {
                skillName: kw,
                normalizedName: canonical,
                category: assignCategory(canonical),
                source: 'github',
                evidence: [evidenceItem],
                extractionConfidence: 72,
              });
            } else {
              githubSkillsMap.get(canonical).evidence.push(evidenceItem);
            }
          }
        }
      }
    } catch (rmErr) {}
  }

  return {
    skills: Array.from(githubSkillsMap.values()),
    notes,
    analyzedReposCount,
  };
}

/**
 * Unified Skill Aggregation Engine:
 * Consolidates skills from Resume and GitHub, normalizes names,
 * deduplicates, preserves dual evidence, attaches existing mastery
 * without overwriting, and determines partial mode.
 */
function aggregateSkills(resumeSkills = [], githubSkills = [], learnerStates = []) {
  const unifiedMap = new Map();

  // Create lookup for existing learner mastery state (e.g. from BKT/Concept assessments)
  const masteryMap = new Map();
  if (Array.isArray(learnerStates)) {
    for (const state of learnerStates) {
      if (state && state.conceptId) {
        const slug = state.conceptId.slug || '';
        const name = (state.conceptId.name || '').toLowerCase();
        masteryMap.set(slug.toLowerCase(), state);
        masteryMap.set(name, state);
      }
    }
  }

  // 1. Ingest Resume Skills
  for (const rSkill of resumeSkills) {
    const norm = rSkill.normalizedName || normalizeSkillName(rSkill.skillName);
    if (!norm) continue;

    unifiedMap.set(norm, {
      skillName: rSkill.skillName || norm,
      normalizedName: norm,
      category: rSkill.category || assignCategory(norm),
      sources: ['resume'],
      primarySource: 'resume',
      evidence: {
        resume: rSkill.evidence || {
          found: true,
          section: 'Resume Context',
          excerpt: 'Mentioned in candidate resume.',
          confidence: rSkill.extractionConfidence || 80,
        },
        github: [],
      },
      extractionConfidence: rSkill.extractionConfidence || 80,
      verificationStatus: 'unverified',
      mastery: null, // Mastery is NEVER assigned from extraction alone!
      verifiedAt: null,
    });
  }

  // 2. Ingest GitHub Skills & Deduplicate / Corroborate
  for (const gSkill of githubSkills) {
    const norm = gSkill.normalizedName || normalizeSkillName(gSkill.skillName);
    if (!norm) continue;

    const gEvidence = Array.isArray(gSkill.evidence) ? gSkill.evidence : [];

    if (unifiedMap.has(norm)) {
      // Skill present in BOTH sources! Corroborate and merge
      const existing = unifiedMap.get(norm);
      if (!existing.sources.includes('github')) {
        existing.sources.push('github');
      }
      existing.primarySource = 'both';
      existing.evidence.github = gEvidence;

      // Multi-source confidence boost (corroboration)
      const baseConf = Math.max(existing.extractionConfidence, gSkill.extractionConfidence || 80);
      existing.extractionConfidence = Math.min(98, baseConf + 6);
    } else {
      // Skill present ONLY in GitHub
      unifiedMap.set(norm, {
        skillName: gSkill.skillName || norm,
        normalizedName: norm,
        category: gSkill.category || assignCategory(norm),
        sources: ['github'],
        primarySource: 'github',
        evidence: {
          resume: { found: false, section: '', excerpt: '', confidence: 0 },
          github: gEvidence,
        },
        extractionConfidence: gSkill.extractionConfidence || 80,
        verificationStatus: 'unverified',
        mastery: null, // Mastery is NEVER assigned from extraction alone!
        verifiedAt: null,
      });
    }
  }

  // 3. Cross-reference existing valid LearnerState (Mastery Engine)
  // Only populate mastery if valid assessment already exists; DO NOT overwrite valid mastery!
  for (const skill of unifiedMap.values()) {
    const key = skill.normalizedName.toLowerCase();
    const stateMatch = masteryMap.get(key) ||
      (key.includes('java') && masteryMap.get('programming-basics')) ||
      (key.includes('oop') && masteryMap.get('oop-basics')) ||
      (key.includes('algorithm') && masteryMap.get('problem-solving'));

    if (stateMatch && stateMatch.evidenceCount > 0) {
      skill.mastery = stateMatch.mastery;
      if (stateMatch.mastery >= 70 && stateMatch.uncertainty <= 30) {
        skill.verificationStatus = 'verified';
        skill.verifiedAt = stateMatch.lastAttemptAt || new Date();
      } else {
        skill.verificationStatus = 'verifying';
      }
    }
  }

  const allSkills = Array.from(unifiedMap.values());

  // Sort: Both sources first, then by extraction confidence descending
  allSkills.sort((a, b) => {
    if (a.primarySource === 'both' && b.primarySource !== 'both') return -1;
    if (b.primarySource === 'both' && a.primarySource !== 'both') return 1;
    return b.extractionConfidence - a.extractionConfidence;
  });

  // Calculate summary counts
  const totalUnique = allSkills.length;
  const resumeCount = allSkills.filter((s) => s.sources.includes('resume')).length;
  const githubCount = allSkills.filter((s) => s.sources.includes('github')).length;
  const bothCount = allSkills.filter((s) => s.primarySource === 'both').length;

  return {
    skills: allSkills,
    summary: {
      totalUnique,
      resumeCount,
      githubCount,
      bothCount,
    },
  };
}

module.exports = {
  CANONICAL_SKILL_MAP,
  CATEGORY_MAP,
  normalizeSkillName,
  assignCategory,
  extractSkillsFromResume,
  extractSkillsFromGitHub,
  aggregateSkills,
};
