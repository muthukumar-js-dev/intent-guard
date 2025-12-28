You are an expert Open Source maintainer and GitHub repository architect.

Your task is to fully set up community, feedback, and support infrastructure
for this npm package repository, following 2025 open-source best practices.

PROJECT CONTEXT:
- This is a public npm package
- The goal is to encourage high-quality issues, feedback, and contributions
- No external documentation website is used (README-driven project)
- GitHub is the single source of truth for issues, discussions, and sponsorship

WHAT YOU MUST DO:

1. ISSUE TEMPLATES (MANDATORY)
Create the following directory structure:

.github/ISSUE_TEMPLATE/

Inside it, create these YAML-based issue templates:

a) bug_report.yml
- Name: "🐞 Bug Report"
- Purpose: Capture reproducible bugs with minimal back-and-forth
- Required fields:
  - Package version
  - Node.js version
  - Bug description
  - Steps to reproduce
  - Expected behavior
- Auto-apply label: "bug"
- Title prefix: "[Bug]: "

b) feature_request.yml
- Name: "💡 Feature Request"
- Purpose: Capture real pain points and enhancement ideas
- Required fields:
  - Problem statement
  - Proposed solution
- Optional fields:
  - Alternatives considered
  - Importance dropdown (Nice to have / Important / Critical)
- Auto-apply label: "enhancement"
- Title prefix: "[Feature]: "

c) question.yml
- Name: "❓ Question / Feedback"
- Purpose: General questions and non-bug feedback
- Required field:
  - Question or feedback description
- Auto-apply label: "question"
- Title prefix: "[Question]: "

Use modern GitHub Issue Forms (YAML), not legacy markdown templates.

2. ISSUE CONFIGURATION
Create:

.github/ISSUE_TEMPLATE/config.yml

- Disable blank issues
- Add a contact link that redirects users to GitHub Discussions
- Clearly state that bugs and features must use templates

3. GITHUB DISCUSSIONS
Enable GitHub Discussions for this repository and define categories:

- 📢 Announcements (maintainers only)
- 💬 General Feedback
- 💡 Ideas & Proposals
- 🙋 Q&A
- 🧠 Architecture & Design

Ensure discussions are positioned as the place for:
- Open-ended feedback
- Questions
- Early ideas before feature requests

4. GITHUB SPONSORSHIP
Set up GitHub Sponsors configuration:

- Enable GitHub Sponsors for the repository owner
- Create FUNDING.yml under .github/
- Include GitHub Sponsors as the primary option
- Add a short, professional sponsorship description focused on:
  - Sustaining open-source maintenance
  - Improving documentation and ecosystem tooling
- Do NOT include aggressive or marketing language

5. LABEL SYSTEM
Ensure the repository has the following labels created and documented:

- bug
- enhancement
- question
- discussion
- good first issue
- needs clarification

6. README UPDATES
Update README.md by adding a clear section titled:

"🤝 Community, Feedback & Support"

This section must explain:
- Bugs → GitHub Issues (Bug Report)
- Feature ideas → Feature Request or Discussions
- Questions → GitHub Discussions
- How users can support the project via Sponsorship

Use concise, developer-friendly language.

7. QUALITY BAR
- Follow GitHub and npm ecosystem conventions (Express, Vite, Prisma style)
- Keep language clear, non-confusing, and welcoming
- Avoid over-engineering
- Everything must work automatically once pushed to GitHub

FINAL OUTPUT EXPECTATION:
- All required files created with correct paths
- Correct YAML syntax
- No placeholders left unresolved
- Ready to commit and push

Do not ask questions.
Proceed with implementation.
