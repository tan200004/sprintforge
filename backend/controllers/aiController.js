const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * AI module — stubs with realistic mock output.
 * Architecture is OpenAI-ready: swap the mock return with an API call.
 */

// POST /api/ai/generate-description
const generateTaskDescription = async (req, res) => {
  try {
    const { taskTitle, projectContext } = req.body;
    if (!taskTitle) return sendError(res, 'Task title is required', 400);

    // OpenAI-ready hook:
    // const openaiResponse = await openai.chat.completions.create({ model: 'gpt-4', messages: [...] });
    // const generatedText = openaiResponse.choices[0].message.content;

    const mockDescriptions = {
      default: `Implement the functionality for "${taskTitle}" as per the project requirements. This includes:\n\n- Setting up the necessary data models and API endpoints\n- Building the UI components with proper validation\n- Writing unit and integration tests\n- Ensuring responsive behavior across all device sizes\n- Documenting the implementation in the project wiki`,
      bug: `**Bug Report: ${taskTitle}**\n\nSteps to reproduce:\n1. Navigate to the affected section\n2. Perform the triggering action\n3. Observe the unexpected behavior\n\n**Expected behavior:** The system should handle the operation gracefully.\n**Actual behavior:** [Describe the error]\n\n**Environment:** Production / Staging\n**Severity:** High`,
      feature: `**Feature: ${taskTitle}**\n\nAs a user, I want to ${taskTitle.toLowerCase()} so that I can improve my workflow efficiency.\n\n**Acceptance Criteria:**\n- [ ] The feature is accessible from the main navigation\n- [ ] Works correctly on mobile and desktop\n- [ ] Includes proper loading and error states\n- [ ] Passes all automated tests`,
    };

    const contextLower = (projectContext || '').toLowerCase();
    let generatedDescription = mockDescriptions.default;
    if (contextLower.includes('bug') || contextLower.includes('fix')) generatedDescription = mockDescriptions.bug;
    if (contextLower.includes('feature') || contextLower.includes('new')) generatedDescription = mockDescriptions.feature;

    return sendSuccess(res, {
      generatedDescription,
      tokensUsed: 180,
      model: 'gpt-4-stub',
    }, 'Description generated');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/ai/sprint-summary
const generateSprintSummary = async (req, res) => {
  try {
    const { sprintName, completedTasks, pendingTasks, blockedTasks, teamMembers } = req.body;

    const velocityScore = completedTasks ? Math.round((completedTasks / (completedTasks + pendingTasks + blockedTasks)) * 100) : 0;

    const mockSummary = `## Sprint Summary — ${sprintName || 'Current Sprint'}\n\n**Overall Velocity:** ${velocityScore}% completion rate\n\n### ✅ Completed (${completedTasks || 0} tasks)\nThe team successfully delivered ${completedTasks || 0} tasks this sprint, meeting the core objectives defined in the sprint planning session.\n\n### 🔄 Carried Over (${pendingTasks || 0} tasks)\n${pendingTasks || 0} tasks were not completed and will be rolled into the next sprint. Review prioritization before the next planning meeting.\n\n### 🚧 Blockers (${blockedTasks || 0} tasks)\n${blockedTasks > 0 ? `${blockedTasks} tasks encountered blockers. Address dependencies and remove obstacles before sprint start.` : 'No blockers reported — great collaboration!'}\n\n### 💡 Recommendations\n- ${velocityScore >= 80 ? 'Excellent sprint performance! Consider increasing story points next sprint.' : 'Review estimation accuracy in the retrospective.'}\n- Conduct a thorough retrospective to identify workflow improvements\n- Update the product backlog based on stakeholder feedback`;

    return sendSuccess(res, {
      summary: mockSummary,
      velocityScore,
      model: 'gpt-4-stub',
    }, 'Sprint summary generated');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/ai/explain-bug
const explainBugDescription = async (req, res) => {
  try {
    const { errorMessage, codeContext } = req.body;
    if (!errorMessage) return sendError(res, 'Error message is required', 400);

    const mockExplanation = `## Bug Analysis\n\n**Error:** \`${errorMessage}\`\n\n### 🔍 Root Cause Analysis\nBased on the error pattern, this appears to be a **${errorMessage.includes('null') || errorMessage.includes('undefined') ? 'null reference / undefined value' : 'runtime'} error**.\n\n### 🛠 Likely Causes\n1. The variable or object being accessed has not been initialized\n2. An async operation completed in an unexpected order\n3. Missing null-check before accessing nested properties\n\n### ✅ Recommended Fix\n\`\`\`javascript\n// Add defensive checks before accessing nested data\nif (data && data.property) {\n  // Safe to access\n  const value = data.property;\n}\n\`\`\`\n\n### 📋 Next Steps\n- Add error boundary around the affected component\n- Write a regression test to prevent recurrence\n- Check for similar patterns in related code`;

    return sendSuccess(res, {
      explanation: mockExplanation,
      model: 'gpt-4-stub',
    }, 'Bug explained');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/ai/meeting-notes
const summarizeMeetingNotes = async (req, res) => {
  try {
    const { rawNotes, meetingTitle } = req.body;
    if (!rawNotes) return sendError(res, 'Meeting notes are required', 400);

    const mockSummary = `## Meeting Summary — ${meetingTitle || 'Team Meeting'}\n*Generated by SprintForge AI*\n\n### 📌 Key Discussion Points\n- Team reviewed current sprint progress and identified blockers\n- Discussed upcoming feature priorities and deadline adjustments\n- Agreed on revised acceptance criteria for pending user stories\n\n### ✅ Action Items\n| Owner | Task | Due Date |\n|-------|------|----------|\n| Team Lead | Update sprint board with revised estimates | EOD Today |\n| Dev Team | Resolve identified blockers | Next standup |\n| PM | Send updated roadmap to stakeholders | This week |\n\n### 🔮 Decisions Made\n1. Sprint deadline extended by 2 days to accommodate QA cycle\n2. New feature requests deferred to next sprint\n3. Daily standups moved to 10:00 AM\n\n### 📅 Next Meeting\nSprint Planning — to be scheduled after current sprint retrospective`;

    return sendSuccess(res, {
      summary: mockSummary,
      wordCount: rawNotes.split(' ').length,
      model: 'gpt-4-stub',
    }, 'Meeting notes summarized');
  } catch (err) {
    return sendError(res, err.message);
  }
};

module.exports = {
  generateTaskDescription,
  generateSprintSummary,
  explainBugDescription,
  summarizeMeetingNotes,
};
