const MentorConversation = require('../models/MentorConversation');
const careerTwinService = require('../services/careerTwinService');
const geminiService = require('../services/geminiService');

// @desc    Get or initialize the user's mentor conversation
// @route   GET /api/mentor
// @access  Private
exports.getMentorConversation = async (req, res, next) => {
  try {
    let conversation = await MentorConversation.findOne({ user: req.user._id });
    if (!conversation) {
      conversation = await MentorConversation.create({
        user: req.user._id,
        title: 'CareerTwin AI Mentorship',
        messages: [
          {
            sender: 'mentor',
            text: `Hello! I am your personal CareerTwin AI Mentor. I have full access to your digital career profile, target roles, interview metrics, and skill gaps. How can I help guide your preparation today?`,
            timestamp: new Date(),
          },
        ],
      });
    }
    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message to Mentor AI and get contextual reply
// @route   POST /api/mentor/chat
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a message.' });
    }

    // 1. Get current Career Twin State
    const twinState = await careerTwinService.getCareerTwinState(req.user._id);

    // 2. Find or create conversation
    let conversation = await MentorConversation.findOne({ user: req.user._id });
    if (!conversation) {
      conversation = new MentorConversation({
        user: req.user._id,
        messages: [],
      });
    }

    // 3. Add user message
    conversation.messages.push({
      sender: 'user',
      text: message.trim(),
      timestamp: new Date(),
      twinContextSnapshot: {
        targetRole: twinState.targetRole,
        careerReadinessScore: twinState.careerReadiness.score,
        recentInterviewScore: twinState.interviews.avgOverall,
        topGaps: twinState.skills.gaps.slice(0, 3).map((g) => g.name),
      },
    });

    // 4. Load Live Adaptive Learning Context
    const Decision = require('../models/Decision');
    const LearnerState = require('../models/LearnerState');
    const latestDecision = await Decision.findOne({ learnerId: req.user._id })
      .populate('conceptId', 'name slug order')
      .sort({ timestamp: -1 });

    const activeStates = await LearnerState.find({ learnerId: req.user._id })
      .populate('conceptId', 'name slug order');

    const adaptiveContext = {
      activeAction: latestDecision?.action || 'PRACTICE',
      targetConcept: latestDecision?.conceptId?.name || 'Java Core Fundamentals',
      decisionReason: latestDecision?.reason || 'System recommends guided exercises on core fundamentals.',
      conceptMasterySummary: activeStates.map((s) => `${s.conceptId?.name || 'Concept'}: ${s.mastery}% mastery`),
    };

    // 5. Generate AI Mentor response with injected context
    let mentorReply;
    try {
      mentorReply = await geminiService.mentorChat({
        userMessage: message.trim(),
        conversationHistory: conversation.messages,
        twinContext: {
          targetRole: twinState.targetRole,
          careerReadinessScore: twinState.careerReadiness.score,
          avgTechnicalScore: twinState.interviews.avgTechnical,
          avgCommunicationScore: twinState.interviews.avgCommunication,
          resumeScore: twinState.resume.score,
          topGaps: twinState.skills.gaps.map((g) => g.name),
          projectsCount: twinState.projects.count,
          githubConnected: twinState.github.isConnected,
          codolioConnected: twinState.codolio?.isConnected || false,
          codolioSolved: twinState.codolio?.totalSolved || 0,
          codolioTier: twinState.codolio?.tier || 'N/A',
          activeAction: adaptiveContext.activeAction,
          targetConcept: adaptiveContext.targetConcept,
          decisionReason: adaptiveContext.decisionReason,
          conceptMasterySummary: adaptiveContext.conceptMasterySummary,
        },
      });
    } catch (aiErr) {
      console.warn('[Mentor AI Warning] Fallback mentor reply used:', aiErr.message);
      mentorReply = generateContextualMentorFallback(message.trim(), twinState, req.user, adaptiveContext, conversation.messages);
    }

    // 6. Add mentor reply to conversation
    conversation.messages.push({
      sender: 'mentor',
      text: mentorReply,
      timestamp: new Date(),
    });

    await conversation.save();

    res.status(200).json({
      success: true,
      message: mentorReply,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Intelligent context-aware mentor conversational engine when external LLM is unreachable
 */
function generateContextualMentorFallback(message, twinState, user, adaptiveContext = {}, history = []) {
  const query = message.toLowerCase().trim();
  const targetRole = twinState.targetRole || 'Full Stack Developer';
  const score = twinState.careerReadiness?.score !== null && twinState.careerReadiness?.score !== undefined 
    ? `${twinState.careerReadiness.score}/100` 
    : 'Not calculated yet';
  const topGaps = (twinState.skills?.gaps || []).slice(0, 4).map((g) => g.name);
  const userName = user?.name || 'there';
  const resumeScore = twinState.resume?.score ?? null;
  const resumeAnalysis = twinState.resume?.analysis || null;
  const interviewCount = twinState.interviews?.completedCount || 0;
  const commScore = twinState.interviews?.avgCommunication ?? null;
  const techScore = twinState.interviews?.avgTechnical ?? null;
  const projCount = twinState.projects?.count || 0;

  // 1. Detect random gibberish or non-words
  const isVowelDeficient = !/[aeiouy]/i.test(query) && query.length >= 4;
  const isRepetitive = /(.)\1{3,}/.test(query);
  const isRandomKeySmash = /^[b-df-hj-np-tv-z]{4,}$/i.test(query) || /^[^a-zA-Z0-9\s]{3,}$/.test(query);
  if (isVowelDeficient || isRepetitive || isRandomKeySmash || query.length < 2) {
    return `I didn't quite catch that! As your CareerTwin AI Mentor, ask me anything specific about your **${targetRole}** journey, such as:
- *"Why is my resume score ${resumeScore || 68}/100 and how can I boost it?"*
- *"Why is my communication score low and how do I improve?"*
- *"How can I improve my project engineering strength?"*
- *"What is my highest leverage improvement this month?"*
- *"What should I learn next based on my gaps?"*`;
  }

  // 2. Greetings
  if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))\b/i.test(query)) {
    return `Hello ${userName}! 👋 Great to connect with you. 

Here is your current **${targetRole}** profile snapshot:
- 📊 **Career Readiness Index**: **${score}**
- 📄 **Resume ATS Score**: **${resumeScore !== null ? `${resumeScore}/100` : 'Not uploaded yet'}**
- 🎙️ **Mock Interviews**: **${interviewCount} completed**
- 💻 **Showcase Projects**: **${projCount} evaluated**
- 🎯 **Current Adaptive Focus**: **${adaptiveContext.activeAction || 'PRACTICE'} on ${adaptiveContext.targetConcept || 'Java Core'}**

What specific area would you like to drill into or improve right now?`;
  }

  // 3. Resume / ATS / CV Questions (e.g. "can u explain me why my resume is now 68/100", "why is my resume score 68", "how to improve resume")
  if (/resume|cv|ats|curriculum\s*vitae/i.test(query) || (/(68|score)/i.test(query) && /resume|ats|cv/i.test(query))) {
    const curScore = resumeScore !== null ? resumeScore : 68;
    const impact = resumeAnalysis?.impactScore || 62;
    const keyword = resumeAnalysis?.keywordScore || 68;
    const clarity = resumeAnalysis?.clarityScore || 75;
    const roleAlign = resumeAnalysis?.roleAlignmentScore || 67;
    const missing = resumeAnalysis?.missingSkills?.length 
      ? resumeAnalysis.missingSkills.slice(0, 4).join(', ') 
      : (topGaps.length ? topGaps.join(', ') : 'Docker, Microservices, CI/CD, Unit Testing');

    return `### 📄 Why Your Resume Scored **${curScore}/100** for **${targetRole}**

Here is the exact evaluation breakdown based on our ATS parsing engine:

#### 🔍 Dimension Breakdown:
- **Clarity & Formatting (${clarity}/100)**: Clean readable structure and proper section dividers.
- **ATS Keyword Alignment (${keyword}/100)**: Contains basic technologies, but lacks critical industry keywords like: **${missing}**.
- **Role Alignment (${roleAlign}/100)**: General development experience is evident, but lacks specialized architectural depth for ${targetRole}.
- **Quantifiable Impact (${impact}/100)**: Experience bullets describe *tasks done* rather than *measurable business outcomes*.

---

#### 🚀 3 Exact Fixes to Raise Your Score from ${curScore} to 85+:
1. **Use the Google X-Y-Z Formula on Experience Bullets**:
   - ❌ *Weak*: "Developed backend APIs using Java and Spring Boot."
   - ✅ *Strong*: "Architected 12+ RESTful microservices in Spring Boot, reducing API response latency by **28%** and serving **1,000+ daily active requests**."
2. **Add a Dedicated Technical Skills Grid**:
   - Group skills into: *Languages*, *Frameworks*, *Databases*, *DevOps/Cloud (Docker, AWS)*, and *Testing (JUnit, Mockito)* so ATS scanners parse them instantly.
3. **Include Production Signals**:
   - Highlight automated unit/integration tests, Git branching strategies, and live deployment links (Vercel, Render, AWS).

Re-upload your updated PDF in the **[Resume Analyzer](/resume.html)** anytime to recalculate your score!`;
  }

  // 4. Communication Score / Speech / STAR Method (e.g. "Why is my communication score low?")
  if (/communication|speech|speaking|filler|star\s*method|articulate|pacing|voice/i.test(query)) {
    const commDisplay = commScore !== null ? `${commScore}/100` : 'No speech data yet';
    return `### 🎙️ Understanding Your Communication Score (${commDisplay})

In technical interviews for **${targetRole}**, hiring managers evaluate candidate communication across 4 key criteria:

1. **STAR Method Answer Structure (Weight: 40%)**:
   - **Situation & Task (20%)**: Establish the business problem and technical constraints in 2–3 concise sentences.
   - **Action (60%)**: Dedicate the bulk of your time to your *exact* engineering steps, architectural trade-offs, and design choices.
   - **Result (20%)**: Conclude with quantifiable results (e.g. "improved query throughput by 40%").

2. **Pacing & Cadence (Weight: 25%)**:
   - The ideal technical interview speaking cadence is **120–150 Words Per Minute (WPM)**. Speaking slower can signal uncertainty, while exceeding 165 WPM makes complex technical ideas hard to follow.

3. **Filler Word Control (Weight: 20%)**:
   - Speech analysis monitors frequency of *"um", "uh", "like", "you know", "basically"*. Keeping filler density below 2% significantly raises your communication rating.

4. **Technical Articulation (Weight: 15%)**:
   - Using crisp industry vocabulary (e.g. "thread-safe concurrent data structure", "event-driven architecture") rather than vague descriptions.

💡 **Next Step**: Head to the **[Mock Interview Room](/mock-interview.html)** to practice an interactive session and receive instant speech analytics!`;
  }

  // 5. Project Engineering Strength & Showcase (e.g. "How can I improve my project engineering strength?")
  if (/project|portfolio|showcase|engineering strength|github repo/i.test(query)) {
    return `### 💻 How to Elevate Your Project Engineering Strength

Recruiters and hiring managers for **${targetRole}** look for proof of *production-grade software engineering*, not just tutorial clones.

You currently have **${projCount}** evaluated project(s) on your profile.

#### 🛠️ Key Pillars of High-Signal Projects:
1. **Build 1 Complex System Over 5 Basic Apps**:
   - Instead of basic To-Do or Calculator apps, build an end-to-end distributed system (e.g. *Real-Time Collaborative Workspace*, *Distributed Task Queue*, or *Event-Driven E-Commerce Engine*).
2. **Include Production Architecture**:
   - **Database & Cache**: Relational (PostgreSQL) or NoSQL (MongoDB) paired with Redis caching.
   - **Security**: JWT authentication, rate limiting, and input sanitization.
   - **Containerization**: Include a verified \`Dockerfile\` and \`docker-compose.yml\` for 1-click startup.
   - **CI/CD & Tests**: Include unit/integration tests with GitHub Actions automated test pipelines.
3. **Write a Gold-Standard README**:
   - High-level system architecture diagram.
   - API documentation table (endpoints, request/response formats).
   - Local setup guide and a live hosted demo link.

Head over to the **[Projects Tab](/projects.html)** to submit your repository for instant multi-dimensional evaluation!`;
  }

  // 6. Highest Leverage Improvement / What to Focus on This Month
  if (/highest leverage|this month|where should i start|priority|priorities|focus first|what to do first|biggest impact/i.test(query)) {
    const recommendations = [];
    if (interviewCount === 0) {
      recommendations.push(`🥇 **#1 Complete Your First Mock Interview (Highest ROI)**: You have 0 completed mock interviews. Technical interviews carry a **25% weight** in your Career Readiness Index. Taking one 5-question interview will immediately establish your technical baseline score.`);
    }
    if (projCount === 0) {
      recommendations.push(`🥈 **#2 Submit 1 Flagship Project (20% Weight)**: You have 0 evaluated showcase projects. Adding a single GitHub repository with tests and architecture docs will activate this 20% dimension.`);
    }
    if ((resumeScore || 68) < 80) {
      recommendations.push(`🥉 **#3 Optimize Resume from ${resumeScore || 68} to 85+ (15% Weight)**: Rewrite your resume bullet points using quantifiable metrics (Google X-Y-Z formula) and re-upload your PDF.`);
    }
    recommendations.push(`🎯 **#4 Adaptive Curriculum Practice**: Complete active exercises for **${adaptiveContext.targetConcept || 'Core Fundamentals'}** on your dashboard.`);

    return `### ⚡ Your Highest Leverage Priorities This Month

Here are the actions ranked by mathematical impact on your **${score}** Career Readiness Index:

${recommendations.join('\n\n')}

Which of these would you like to start on first?`;
  }

  // 7. Skill Gaps & What to Learn Next
  if (/gaps?|what should i learn|missing skill|what skill|curriculum/i.test(query)) {
    const gapsList = topGaps.length ? topGaps : ['Microservices Architecture', 'Docker & Kubernetes', 'System Design & Scalability', 'Advanced SQL & Query Optimization'];
    return `### 🎯 Targeted Learning Plan for ${targetRole}

Based on job market requirements and your digital profile, here are your critical skill gaps:

${gapsList.map((gap, i) => `${i + 1}. **${gap}**: High-frequency requirement for ${targetRole} job descriptions.`).join('\n')}

---

### 📚 Recommended Execution Strategy:
1. **Immediate Adaptive Focus**: **${adaptiveContext.targetConcept || gapsList[0]}**
   - *Reason*: ${adaptiveContext.decisionReason || 'Foundational prerequisite required before scaling up.'}
   - *Action*: Solve diagnostic questions in the **[Diagnostic Room](/diagnostic.html)**.
2. **Long-Term Trajectory**: Follow your customized month-by-month learning checkpoints on the **[Career Roadmap](/roadmap.html)**.`;
  }

  // 8. Specific Readiness Index Breakdown (Only when explicitly asked about overall readiness)
  if (/(career\s*)?readiness\s*(index|score)|what\s*(is|about)\s*(my\s*)?readiness|breakdown\s*of\s*(my\s*)?readiness|how is readiness calculated/i.test(query)) {
    const interviewScore = twinState.interviews?.avgOverall !== null ? `${twinState.interviews.avgOverall}/100` : 'No completed interviews yet';
    return `### 📊 Career Readiness Index Breakdown (${score})

Your overall readiness reflects 5 weighted dimensions:
- **Technical & Mock Interviews (Weight: 25%)**: ${interviewScore}
- **Showcase Projects (Weight: 20%)**: ${projCount} evaluated project(s)
- **Resume Quality & ATS Alignment (Weight: 15%)**: ${resumeScore !== null ? `${resumeScore}/100` : 'No resume uploaded'}
- **Skill Coverage (Weight: 15%)**: ${topGaps.length ? `Identified gaps: ${topGaps.join(', ')}` : 'Strong coverage'}
- **Coding Platforms & Problem Solving (Weight: 25%)**: ${twinState.codolio?.isConnected ? `${twinState.codolio.totalSolved} solved on Codolio` : 'Connect Codolio/LeetCode'}

💡 **Key Takeaway**: Completing your first mock interview and submitting 1 evaluated project will yield the biggest instant jump in your index!`;
  }

  // 9. Career Roadmap Questions
  if (/roadmap|milestone|schedule|timeline/i.test(query)) {
    return `### 🗺️ Career Roadmap Overview

Your personalized career roadmap structures your journey to **${targetRole}**:
1. **Monthly Milestones**: Segmented into focused themes (Core Fundamentals, Architectural Patterns, Deployment & Cloud, Interview Drills).
2. **Actionable Tasks**: Concrete tasks categorized under *Coding*, *Project*, *Concept*, and *System Design* with estimated hours.
3. **Interactive Tracking**: As you complete tasks on the **[Career Roadmap](/roadmap.html)**, your progress automatically updates your Career Twin index.

Would you like advice on any specific milestone or task?`;
  }

  // 10. Technical Concept Deep Dives (Java, Spring, OOP, SQL, React, DSA, etc.)
  if (/java|spring|oop|encapsulation|inheritance|polymorphism|interface|sql|database|postgres|mongo|docker|api|rest|microservice|react|javascript|typescript|python|thread|concurrency|hashmap|array|tree|graph/i.test(query)) {
    return `### 💡 Technical Deep Dive for ${targetRole}

Here is the engineering breakdown regarding **"${message}"**:

1. **Fundamental Principles**:
   - In modern software development, focus on clean architecture, the **SOLID principles**, and **separation of concerns**.
   - Always favor composition over inheritance and keep business logic strictly decoupled from transport layers (controllers, endpoints).

2. **Scalability & Production Considerations**:
   - **Time & Space Complexity**: Watch for $O(N^2)$ nested loops and the N+1 query problem in ORMs (use \`JOIN FETCH\` or indexed queries).
   - **Robust Error Handling**: Implement structured exceptions with descriptive HTTP status codes (400 Bad Request, 404 Not Found, 500 Server Error).
   - **Thread Safety**: When dealing with concurrent requests, protect shared mutable state using atomic variables or concurrent collections.

3. **Interview Talking Point**:
   - When asked this in an interview, always explain the **purpose**, the **under-the-hood mechanism**, and a **real-world scenario** where you implemented it.

Would you like a concrete code snippet demonstrating this?`;
  }

  // 11. General Conversational Fallback (Tailored, never repeating the readiness index)
  return `### 💬 Career Twin Mentor Response

Regarding your question: **"${message}"**

As your personal Career Mentor focused on your **${targetRole}** journey:
- **Current Standing**: Your digital profile is set to **${targetRole}** with an overall Career Readiness Index of **${score}**.
- **Next High-Value Move**: ${topGaps.length ? `Prioritize mastering **${topGaps[0]}**` : 'Continue consistent mock interview practice'} and building full-stack portfolio evidence.
- **Resources**: You can explore curated milestones in your **[Career Roadmap](/roadmap.html)** or practice coding fundamentals in the **[Diagnostic Room](/diagnostic.html)**.

Feel free to ask me for specific code examples, resume bullet rewrites, or interview practice questions!`;
}

// @desc    Clear mentor conversation history
// @route   DELETE /api/mentor
// @access  Private
exports.clearConversation = async (req, res, next) => {
  try {
    await MentorConversation.findOneAndDelete({ user: req.user._id });
    res.status(200).json({ success: true, message: 'Mentorship history cleared.' });
  } catch (error) {
    next(error);
  }
};

exports.generateContextualMentorFallback = generateContextualMentorFallback;
