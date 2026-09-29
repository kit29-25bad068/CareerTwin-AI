/**
 * Prerequisite Engine
 * Evaluates instructional dependency graphs recursively.
 * Checks ancestor prerequisites to identify root blocking dependencies.
 */

const Concept = require('../models/Concept');
const LearnerState = require('../models/LearnerState');

async function evaluatePrerequisites(conceptId, learnerId, prerequisiteThreshold = 70) {
  const allConcepts = await Concept.find({ active: true }).populate('prerequisites');
  const conceptMap = new Map();
  allConcepts.forEach((c) => conceptMap.set(c._id.toString(), c));

  const targetConcept = conceptMap.get(conceptId.toString());
  if (!targetConcept) {
    throw new Error(`Concept ${conceptId} not found`);
  }

  // Load learner states for all concepts
  const states = await LearnerState.find({ learnerId });
  const stateMap = new Map();
  states.forEach((s) => stateMap.set(s.conceptId.toString(), s));

  // Recursive Ancestor Traversal (DFS)
  const visited = new Set();
  const ancestors = [];

  function traverseAncestors(currentId) {
    const c = conceptMap.get(currentId.toString());
    if (!c) return;

    for (const prereq of c.prerequisites) {
      const pId = prereq._id ? prereq._id.toString() : prereq.toString();
      if (!visited.has(pId)) {
        visited.add(pId);
        const prereqConcept = conceptMap.get(pId);
        if (prereqConcept) {
          ancestors.push(prereqConcept);
          traverseAncestors(pId);
        }
      }
    }
  }

  traverseAncestors(conceptId);

  // Evaluate mastery for every ancestor in the dependency graph
  const prerequisiteChain = ancestors.map((ancestor) => {
    const state = stateMap.get(ancestor._id.toString());
    const mastery = state ? state.mastery : 0;
    const uncertainty = state ? state.uncertainty : 100;
    const required = ancestor.requiredMastery || prerequisiteThreshold;
    const isSatisfied = mastery >= required;

    return {
      conceptId: ancestor._id,
      slug: ancestor.slug,
      name: ancestor.name,
      order: ancestor.order,
      mastery,
      uncertainty,
      requiredMastery: required,
      isSatisfied,
    };
  });

  // Sort by order ascending (foundational concepts first)
  prerequisiteChain.sort((a, b) => a.order - b.order);

  // Find all blocking prerequisites
  const blockingPrerequisites = prerequisiteChain.filter((p) => !p.isSatisfied);
  const isBlocked = blockingPrerequisites.length > 0;

  // The root blocking concept is the earliest unsatisfied concept in the chain
  const rootBlockingConcept = isBlocked ? blockingPrerequisites[0] : null;

  return {
    targetConcept: {
      id: targetConcept._id,
      slug: targetConcept.slug,
      name: targetConcept.name,
      order: targetConcept.order,
    },
    isBlocked,
    rootBlockingConcept,
    blockingPrerequisites,
    prerequisiteChain,
    totalAncestors: ancestors.length,
  };
}

module.exports = { evaluatePrerequisites };
