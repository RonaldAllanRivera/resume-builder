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
        'Create a job-targeted resume based ONLY on the resume facts and the job ad.\n\nRules:\n- Do not invent facts (no new companies, dates, titles, skills, metrics)\n- Prefer the most relevant experiences/projects for this role\n- Keep it ATS-friendly (plain text)\n- Use clear section headings\n\nProfile focus (optional):\n{{profileFocus}}\n\nResume Facts (from database):\n{{resumeFacts}}\n\nJob Ad Title:\n{{jobTitle}}\n\nCompany:\n{{companyName}}\n\nJob Ad:\n{{jdText}}\n\nOutput: Return only the final resume text.',
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
