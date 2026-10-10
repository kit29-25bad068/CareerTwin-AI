/**
 * CareerTwin AI - Adaptive Learning API & UI Controller
 */

const AdaptiveAPI = {
  // Demo Fallback User ID (Alex Rivers)
  DEFAULT_DEMO_LEARNER_ID: '64f1a2b3c4d5e6f7a8b9c0d1',

  getLearnerId() {
    const user = window.API?.getUser ? window.API.getUser() : null;
    return user?._id || user?.id || localStorage.getItem('careertwin_active_learner') || this.DEFAULT_DEMO_LEARNER_ID;
  },

  setDemoLearner(learnerId) {
    localStorage.setItem('careertwin_active_learner', learnerId);
  },

  async getNextAction(learnerId = this.getLearnerId()) {
    return window.API.get(`/adaptive/next-action?learnerId=${learnerId}`);
  },

  async getMastery(learnerId = this.getLearnerId()) {
    return window.API.get(`/adaptive/mastery?learnerId=${learnerId}`);
  },

  async getLearningPath(learnerId = this.getLearnerId()) {
    return window.API.get(`/adaptive/learning-path?learnerId=${learnerId}`);
  },

  async getDecisions(learnerId = this.getLearnerId(), limit = 25) {
    return window.API.get(`/adaptive/decisions?learnerId=${learnerId}&limit=${limit}`);
  },

  async getAttempts(learnerId = this.getLearnerId(), conceptId = null, limit = 50) {
    let url = `/adaptive/attempts?learnerId=${learnerId}&limit=${limit}`;
    if (conceptId) url += `&conceptId=${conceptId}`;
    return window.API.get(url);
  },

  async getConcepts() {
    return window.API.get('/adaptive/concepts');
  },

  async getConceptGraph() {
    return window.API.get('/adaptive/concepts/graph');
  },

  async getDiagnosticQuestions() {
    return window.API.get('/adaptive/diagnostic-questions');
  },

  async submitAttempt(payload) {
    const qId = payload.questionId || payload.id || payload._id;
    const body = {
      learnerId: payload.learnerId || this.getLearnerId(),
      questionId: qId,
      userAnswer: payload.userAnswer,
      responseTime: payload.responseTime || 15,
      confidence: payload.confidence || 3,
      hintsUsed: payload.hintsUsed || 0,
      sessionId: payload.sessionId || `session_${Date.now()}`,
    };
    return window.API.post('/adaptive/attempts', body);
  },

  async getDiagnosticInventory(learnerId = this.getLearnerId()) {
    return window.API.get(`/adaptive/diagnostic/inventory?learnerId=${learnerId}`);
  },

  async extractDiagnosticSkills(payload = {}) {
    const body = {
      learnerId: payload.learnerId || this.getLearnerId(),
      githubUsername: payload.githubUsername || '',
      repoUrls: payload.repoUrls || [],
      resumeText: payload.resumeText || '',
    };
    return window.API.post('/adaptive/diagnostic/extract', body);
  },

  async uploadDiagnosticResume(formData) {
    return window.API.post('/adaptive/diagnostic/upload-resume', formData);
  },

  async deleteDiagnosticInventory(learnerId = this.getLearnerId()) {
    return window.API.delete(`/adaptive/diagnostic/inventory?learnerId=${learnerId}`);
  },
};

const AdaptiveUI = {
  // Interactive Modal for answering questions
  openAttemptModal(question, onComplete = null) {
    // Remove existing modal if any
    const existing = document.getElementById('adaptive-attempt-modal');
    if (existing) existing.remove();

    const startTime = Date.now();
    let hintsUsed = 0;
    let selectedConfidence = 3;
    let timerInterval = null;

    const modal = document.createElement('div');
    modal.id = 'adaptive-attempt-modal';
    modal.className = 'modal-backdrop';

    const hasOptions = Array.isArray(question.options) && question.options.length > 0;
    const conceptName = question.conceptId?.name || question.concept?.name || 'Java Concept';
    const typeLabel = question.type || 'Question';
    const difficultyStars = '★'.repeat(question.difficulty || 1) + '☆'.repeat(Math.max(0, 5 - (question.difficulty || 1)));

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header-bar">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="badge badge-cyan">${typeLabel}</span>
            <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">${conceptName}</span>
            <span style="color: var(--accent-amber); font-size: 0.8rem;" title="Difficulty: ${question.difficulty}/5">${difficultyStars}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div class="timer-pill" id="modal-timer">⏱️ <span id="timer-display">00:00</span></div>
            <button class="btn btn-secondary btn-sm" id="modal-close-btn" style="padding: 0.25rem 0.5rem; font-size: 1rem;">✕</button>
          </div>
        </div>

        <div class="modal-content-body" id="modal-body-area">
          <div class="question-prompt-text">${question.question}</div>

          ${question.codeSnippet ? `<div class="code-snippet-box"><code>${this.escapeHtml(question.codeSnippet)}</code></div>` : ''}

          <div id="answer-input-container">
            ${
              hasOptions
                ? `
              <div class="options-list">
                ${question.options
                  .map(
                    (opt, idx) => `
                  <label class="option-choice" for="opt-${idx}">
                    <input type="radio" name="attempt-option" id="opt-${idx}" value="${this.escapeHtml(opt)}">
                    <span>${this.escapeHtml(opt)}</span>
                  </label>
                `
                  )
                  .join('')}
              </div>
            `
                : `
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Type Your Answer or Code Fix:</label>
                <textarea id="freeform-answer-input" class="form-control" rows="3" placeholder="Enter output or corrected code..." style="font-family: var(--font-mono); background: #080c16; border-color: rgba(255,255,255,0.1); color: #fff; width: 100%; border-radius: var(--radius-md); padding: 0.75rem;"></textarea>
              </div>
            `
            }
          </div>

          <!-- Confidence Rating Picker -->
          <div class="confidence-selector-container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.05em;">Confidence in your answer</span>
              <span id="confidence-label" style="font-size: 0.8rem; color: var(--accent-secondary); font-weight: 600;">Medium Confidence (3/5)</span>
            </div>
            <div class="confidence-scale">
              <button type="button" class="confidence-btn" data-val="1">1: Pure Guess</button>
              <button type="button" class="confidence-btn" data-val="2">2: Low</button>
              <button type="button" class="confidence-btn active" data-val="3">3: Medium</button>
              <button type="button" class="confidence-btn" data-val="4">4: High</button>
              <button type="button" class="confidence-btn" data-val="5">5: Certain</button>
            </div>
          </div>

          <!-- Hint Section -->
          <div id="hint-container" style="display: none; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); padding: 0.85rem 1.1rem; color: #fbbf24; font-size: 0.88rem;">
            💡 <strong>Hint:</strong> <span id="hint-text">Think about variable scope and Java precedence rules.</span>
          </div>

          <!-- Action buttons -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; flex-wrap: wrap; gap: 0.75rem;">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-request-hint">
              💡 Need a Hint (-25% evidence weight)
            </button>
            <button type="button" class="btn btn-primary btn-md" id="btn-submit-attempt">
              🚀 Submit Answer
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup Timer
    timerInterval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const m = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const s = String(elapsedSec % 60).padStart(2, '0');
      const timerDisplay = document.getElementById('timer-display');
      if (timerDisplay) timerDisplay.textContent = `${m}:${s}`;
    }, 1000);

    // Event: Close Modal
    const closeModal = () => {
      clearInterval(timerInterval);
      modal.remove();
    };

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);

    // Event: Option choices highlight
    modal.querySelectorAll('.option-choice').forEach((label) => {
      label.addEventListener('click', () => {
        modal.querySelectorAll('.option-choice').forEach((l) => l.classList.remove('selected'));
        label.classList.add('selected');
        const radio = label.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });

    // Event: Confidence Buttons
    const confidenceNames = {
      1: 'Pure Guess (1/5)',
      2: 'Low Confidence (2/5)',
      3: 'Medium Confidence (3/5)',
      4: 'High Confidence (4/5)',
      5: 'Absolute Certainty (5/5)',
    };
    modal.querySelectorAll('.confidence-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.confidence-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedConfidence = Number(btn.getAttribute('data-val'));
        document.getElementById('confidence-label').textContent = confidenceNames[selectedConfidence];
      });
    });

    // Event: Hint Request
    document.getElementById('btn-request-hint').addEventListener('click', () => {
      hintsUsed += 1;
      const hintContainer = document.getElementById('hint-container');
      hintContainer.style.display = 'block';
      document.getElementById('btn-request-hint').disabled = true;
      document.getElementById('btn-request-hint').textContent = '💡 Hint Active';
    });

    // Event: Submit Answer
    document.getElementById('btn-submit-attempt').addEventListener('click', async () => {
      const submitBtn = document.getElementById('btn-submit-attempt');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Evaluating...';

      let answer = null;
      if (hasOptions) {
        let checked = modal.querySelector('input[name="attempt-option"]:checked');
        if (!checked) {
          const selectedLabel = modal.querySelector('.option-choice.selected');
          if (selectedLabel) {
            const radio = selectedLabel.querySelector('input[type="radio"]');
            if (radio) {
              radio.checked = true;
              checked = radio;
            }
          }
        }
        if (!checked) {
          if (window.Utils?.showToast) {
            window.Utils.showToast('Please select an option before submitting.', 'warning');
          }
          this.showModalError(modal, 'Please select an option before submitting.');
          submitBtn.disabled = false;
          submitBtn.textContent = '🚀 Submit Answer';
          return;
        }
        answer = checked.value;
      } else {
        const textInput = document.getElementById('freeform-answer-input');
        if (!textInput || !textInput.value.trim()) {
          if (window.Utils?.showToast) {
            window.Utils.showToast('Please provide an answer before submitting.', 'warning');
          }
          this.showModalError(modal, 'Please provide an answer before submitting.');
          submitBtn.disabled = false;
          submitBtn.textContent = '🚀 Submit Answer';
          return;
        }
        answer = textInput.value.trim();
      }

      const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      clearInterval(timerInterval);

      const targetQuestionId = question._id || question.id || question.questionId;

      try {
        const res = await AdaptiveAPI.submitAttempt({
          questionId: targetQuestionId,
          userAnswer: answer,
          responseTime: elapsedSeconds,
          confidence: selectedConfidence,
          hintsUsed,
        });

        if (res && res.success) {
          // Render Feedback View inside modal
          this.renderAttemptFeedback(modal, question, res, () => {
            closeModal();
            if (typeof onComplete === 'function') {
              onComplete(res);
            }
          });
        } else {
          const errMsg = res?.message || 'Submission failed.';
          if (window.Utils?.showToast) {
            window.Utils.showToast(errMsg, 'error');
          }
          this.showModalError(modal, errMsg);
          submitBtn.disabled = false;
          submitBtn.textContent = '🚀 Submit Answer';
        }
      } catch (err) {
        console.error('Attempt submission error:', err);
        const errMsg = err?.message || 'Failed to submit attempt.';
        if (window.Utils?.showToast) {
          window.Utils.showToast(errMsg, 'error');
        }
        this.showModalError(modal, errMsg);
        submitBtn.disabled = false;
        submitBtn.textContent = '🚀 Submit Answer';
      }
    });
  },

  showModalError(modal, msg) {
    let errBanner = modal.querySelector('#modal-error-banner');
    if (!errBanner) {
      errBanner = document.createElement('div');
      errBanner.id = 'modal-error-banner';
      errBanner.style.cssText = 'background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.4); border-radius: var(--radius-sm); padding: 0.65rem 0.85rem; font-size: 0.85rem; color: #fb7185; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;';
      const body = modal.querySelector('#modal-body-area');
      if (body) body.prepend(errBanner);
    }
    errBanner.innerHTML = `<span>⚠️ ${this.escapeHtml(msg)}</span><button type="button" style="background:none;border:none;color:#fb7185;cursor:pointer;font-weight:bold;margin-left:0.5rem;" onclick="this.parentElement.remove()">✕</button>`;
  },

  renderAttemptFeedback(modal, question, result, onDone) {
    const modalBody = modal.querySelector('#modal-body-area');
    const isCorrect = result.correct;
    const state = result.stateUpdate;
    const evidence = result.evidence || {};
    const gaming = evidence.gamingFlags || [];

    const masteryDelta = state?.masteryDelta >= 0 ? `+${state.masteryDelta}%` : `${state.masteryDelta}%`;
    const uncertaintyDelta = state?.uncertaintyDelta <= 0 ? `${state.uncertaintyDelta}%` : `+${state.uncertaintyDelta}%`;

    modalBody.innerHTML = `
      <div class="attempt-feedback-card ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 2rem;">${isCorrect ? '🎉' : '❌'}</span>
            <div>
              <h3 style="font-size: 1.3rem; margin: 0; color: ${isCorrect ? '#34d399' : '#fb7185'};">
                ${isCorrect ? 'Correct!' : 'Incorrect'}
              </h3>
              <span style="font-size: 0.85rem; color: var(--text-muted);">
                Evidence Quality: <strong>${evidence.quality || 'STANDARD'}</strong> (Weight: ${evidence.weight?.toFixed(2) || '1.00'}x)
              </span>
            </div>
          </div>
          <div class="deltas-pill-row">
            <span class="delta-tag ${state?.masteryDelta >= 0 ? 'delta-up' : 'delta-down'}">
              Mastery: ${masteryDelta} (${state?.newMastery}%)
            </span>
            <span class="delta-tag delta-up">
              Uncertainty: ${uncertaintyDelta} (${state?.newUncertainty}%)
            </span>
          </div>
        </div>

        ${
          gaming.length > 0
            ? `
          <div style="background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.4); border-radius: var(--radius-sm); padding: 0.6rem 0.85rem; font-size: 0.8rem; color: #fb7185;">
            ⚠️ <strong>Anti-Gaming Flags Triggered:</strong> ${gaming.join(', ')} (Evidence weight moderated)
          </div>
        `
            : ''
        }

        <div style="background: rgba(0, 0, 0, 0.25); border-radius: var(--radius-sm); padding: 0.85rem; margin-top: 0.25rem;">
          <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 0.25rem;">
            Correct Answer:
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.95rem; color: #38bdf8;">
            ${this.escapeHtml(result.correctAnswer || 'N/A')}
          </div>
        </div>

        ${
          result.explanation
            ? `
          <div style="font-size: 0.92rem; line-height: 1.55; color: var(--text-primary); margin-top: 0.25rem;">
            <strong>Explanation:</strong> ${this.escapeHtml(result.explanation)}
          </div>
        `
            : ''
        }

        <div style="margin-top: 1rem; display: flex; justify-content: flex-end;">
          <button class="btn btn-primary btn-md" id="btn-feedback-continue">
            Continue Learning Path ➔
          </button>
        </div>
      </div>
    `;

    modalBody.querySelector('#btn-feedback-continue').addEventListener('click', onDone);
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
};

window.AdaptiveAPI = AdaptiveAPI;
window.AdaptiveUI = AdaptiveUI;
