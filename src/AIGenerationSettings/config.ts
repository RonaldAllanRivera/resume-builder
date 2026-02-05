import type { GlobalConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'

export const AIGenerationSettings: GlobalConfig = {
  slug: 'aiGenerationSettings',
  access: {
    read: adminOrEditor,
    update: adminOrEditor,
  },
  fields: [
    {
      name: 'promptVersion',
      type: 'text',
      required: true,
      defaultValue: 'phase5-v1',
    },
    {
      name: 'model',
      type: 'text',
      required: true,
      defaultValue: 'gpt-4o-mini',
    },
    {
      name: 'temperature',
      type: 'number',
      required: true,
      defaultValue: 0.2,
    },
    {
      name: 'systemPrompt',
      type: 'textarea',
      required: true,
      defaultValue:
        'You are a strict resume and cover letter drafting assistant. Do not invent facts. Only use information provided in the resume profile and job ad. If something is missing, omit it.',
    },
    {
      name: 'resumePrompt',
      type: 'textarea',
      required: true,
      defaultValue:
        'Create a job-targeted resume using ONLY the resume facts provided (from database) and the job ad.\n\nHard rules (must follow):\n- Do NOT invent facts (no new companies, dates, titles, tools, skills, degrees, certifications, metrics, links)\n- Only use skills/tools that appear in the Resume Facts (highlights or tech stack)\n- Select ONLY the most relevant experiences/projects/certifications for this role\n- If a section has no relevant items, omit it\n- Output must be ATS-friendly and readable in plain text markdown\n\nFormatting goal: Match this structure closely:\n# {{fullName}}\n**{{headline}}**\n\n{{contactBlock}}\n\n## PROFESSIONAL SUMMARY\n(3–5 sentences, role-specific, no fluff)\n\n## CORE SKILLS\n(bullets grouped, derived only from Resume Facts; prioritize job ad keywords)\n\n## PROFESSIONAL EXPERIENCE\n(Most relevant roles first; include 3–6 bullets per role max)\n\n## SELECTED PROJECTS\n(Only projects relevant to the job; include repo/live URLs if present)\n\n## EDUCATION\n\n## CERTIFICATIONS (Selected)\n\n## ADDITIONAL\n(optional, only if backed by Resume Facts or provided notes)\n\nProfile focus / constraints (optional):\n{{profileFocus}}\n\nJob Title (must align headline and summary to this):\n{{jobTitle}}\n\nCompany:\n{{companyName}}\n\nJob Ad:\n{{jdText}}\n\nResume Facts (from database):\n{{resumeFacts}}\n\nOutput: Return ONLY the final resume text in the format above.',
    },
    {
      name: 'coverLetterStyle',
      type: 'textarea',
      defaultValue: '',
    },
    {
      name: 'coverLetterPrompt',
      type: 'textarea',
      required: true,
      defaultValue:
        'Write an application letter based on the resume and the job ad.\n\nRules:\n- 3 to 5 short paragraphs\n- Do not invent facts\n- Use the greeting, header, and footer EXACTLY as provided\n- Match the provided letter style and tone notes\n\nLetter style (example to mimic):\n{{coverLetterStyle}}\n\nTone notes:\n{{toneNotes}}\n\nHeader (may be empty):\n{{resolvedHeader}}\n\nGreeting:\n{{resolvedGreeting}}\n\nFooter (must include as-is):\n{{resolvedFooter}}\n\n{{companyBlock}}\n\nGenerated Resume:\n{{generatedResume}}\n\nJob Ad:\n{{jdText}}\n\nOutput: Return the full application letter text including header (if present), greeting, body, and footer.',
    },
  ],
}
