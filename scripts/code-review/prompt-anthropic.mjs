/**
 * Review criteria adapted from Anthropic's Claude Code code-review plugin.
 * Upstream (multi-agent, gh CLI, inline comments):
 * https://github.com/anthropics/claude-code/blob/main/plugins/code-review/commands/code-review.md
 *
 * This repo uses a single LLM pass and one PR summary comment — not the full plugin orchestration.
 */

/** @param {string} guidelineLabel e.g. "AGENTS.md / project docs" */
export function anthropicHighSignalCriteria(guidelineLabel) {
  return `
**High signal only.** Flag issues where:
- The code will fail to compile or parse (syntax errors, type errors, missing imports, unresolved references)
- The code will definitely produce wrong results regardless of inputs (clear logic errors)
- Clear, unambiguous ${guidelineLabel} violations where you can quote the exact rule being broken
- Serious problems in the changed code only (e.g. clear security mistakes introduced in the diff)

Do NOT flag:
- Pre-existing issues outside the diff
- Something that appears to be a bug but is likely correct given context you were given
- Pedantic nitpicks a senior engineer would skip
- Issues a linter or typechecker will catch (do not assume you ran them)
- Code style, readability, or "nice to have" refactors
- Potential issues that depend on specific runtime inputs or state you cannot see
- Subjective improvements or general test-coverage lectures unless docs explicitly require tests for this change
- Doc rules that are explicitly silenced in code (e.g. eslint-disable with justification)
- If you are not confident an issue is real, omit it. False positives waste reviewer time.

Focus on the diff itself; use the provided repository context only for ${guidelineLabel} compliance scoped to changed files.`;
}

/** When no issues — matches Anthropic's empty-review comment tone (adapted). */
export function anthropicNoIssuesLine(guidelineLabel) {
  return `No issues found. Checked for bugs and ${guidelineLabel} compliance.`;
}
