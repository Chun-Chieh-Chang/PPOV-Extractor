---
name: find-skills
description: Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used when the user is looking for functionality that might exist as an installable skill.
---

# Find Skills

This skill helps you discover and install skills from the open agent skills ecosystem.

## When to Use This Skill

Use this skill when the user:

- Asks "how do I do X" where X might be a common task with an existing skill
- Says "find a skill for X" or "is there a skill for X"
- Asks "can you do X" where X is a specialized capability
- Expresses interest in extending agent capabilities
- Wants to search for tools, templates, or workflows
- Mentions they wish they had help with a specific domain (design, testing, deployment, etc.)

## What is the Skills CLI?

The Skills CLI (`npx skills`) is the package manager for the open agent skills ecosystem. Skills are modular packages that extend agent capabilities with specialized knowledge, workflows, and tools.

**Key commands:**

- `npx skills find [query]` - Search for skills interactively or by keyword
- `npx skills add <package>` - Install a skill from GitHub or other sources
- `npx skills check` - Check for skill updates
- `npx skills update` - Update all installed skills

**Browse skills at:** https://skills.sh/

## How to Help Users Find Skills

### Step 1: Understand What They Need

When a user asks for help with something, identify:

1. The domain (e.g., React, testing, design, deployment)
2. The specific task (e.g., writing tests, creating animations, reviewing PRs)
3. Whether this is a common enough task that a skill likely exists

### Step 2: Check the Leaderboard First

Before running a CLI search, check the [skills.sh leaderboard](https://skills.sh/) to see if a well-known skill already exists for the domain. The leaderboard ranks skills by total installs, surfacing the most popular and battle-tested options.

For example, top skills for web development include:
- `vercel-labs/agent-skills` — React, Next.js, web design (100K+ installs each)
- `anthropics/skills` — Frontend design, document processing (100K+ installs)

### Step 3: Search for Skills

If the leaderboard doesn't cover the user's need, run the find command using the Skills CLI:

```bash
npx skills find [query]
```

**Tips for Effective Searches:**
- Use specific keywords (e.g., "react testing" instead of "testing").
- Try alternative terms if the first search fails (e.g., "deployment" or "ci-cd" instead of "deploy").
- Check popular sources like `vercel-labs/agent-skills` or `ComposioHQ/awesome-claude-skills`.

### Step 4: Verify Quality Before Recommending

Assess the skill based on its description, install count, and source.

### Step 5: Present Options to the User

When presenting skills to the user, include:
- The skill name and description.
- The install count and source reputation.
- The install command (e.g., `npx skills add <package>`) and a link to learn more at `skills.sh`.

### Step 6: Offer to Install

If the user chooses a skill, offer to run the installation command (`npx skills add <package>`) for them.

### When No Skills Are Found

If no relevant skills are found:
- Acknowledge that no existing skill was found for the requested task.
- Offer to help with the task directly using your general capabilities.
- Suggest that the user could create their own skill using `npx skills init`.
