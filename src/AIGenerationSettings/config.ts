import type { GlobalConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'

export const DEFAULT_AI_GENERATION_PROMPT_VERSION = 'phase5-v1'

export const DEFAULT_AI_GENERATION_MODEL = 'gpt-4o-mini'

export const DEFAULT_AI_GENERATION_TEMPERATURE = 0.2

export const DEFAULT_AI_GENERATION_SYSTEM_PROMPT =
  'You are a strict resume and cover letter drafting assistant. Do not invent facts. Only use information provided in the resume profile and job ad. If something is missing, omit it.'

export const DEFAULT_AI_GENERATION_RESUME_PROMPT =
  'Rewrite the resume into a clean, modern, AI-specialist resume that is ATS-friendly and easy for humans to scan.\n\nHard rules (must follow):\n- Output ONLY the final resume text (no explanations, no preface, no "great decision", no advice sections)\n- Do NOT invent facts (no new companies, dates, titles, tools, skills, degrees, certifications, metrics, links, locations)\n- Only include skills/tech/tools that appear in Resume Facts (experience highlights, project tech stack, certifications, education)\n- Prefer relevance to the Job Ad over completeness\n- Use short bullets, avoid long paragraphs\n- No tables, no emojis, no decorative characters\n\nTarget role: {{jobTitle}}\nCompany: {{companyName}}\n\nFormatting requirements (use this exact section order; omit empty sections):\n# {{fullName}}\n**{{headline}}**\n{{contactBlock}}\n\n## Professional Summary\nWrite 3 to 5 sentences. Position the candidate as a hands-on, delivery-focused AI specialist / applied AI engineer / AI software engineer (only if supported by facts). Align to the Job Ad responsibilities: LLM-powered tools, automation agents, data ingestion/pipelines, analytics enablement, integrations with existing platforms. If a responsibility/tool is not supported by Resume Facts, do not claim it.\n\n## Core Skills\nCreate 3 to 6 skill groups. For each group, use a bold label then 3 to 6 bullets. Example groups (only if supported by Resume Facts):\n- **AI & LLM Systems**\n- **Automation & Data Pipelines**\n- **Backend & APIs**\n- **Frontend / Full-Stack Delivery**\n- **DevOps / Reliability**\n- **Analytics / Experimentation**\n\n## Professional Experience\nUse reverse-chronological order, but prioritize the most relevant roles first. For each role:\n- Role line: "### <Title>" then next line "<Company> — <Context>" then next line "<Dates>" (if dates are available)\n- Include 4 to 7 bullets max focused on measurable outcomes, automation, AI integrations, and production delivery\n- Mention specific tools only if present in Resume Facts\n\n## Selected Projects\nInclude 3 to 6 projects most relevant to AI systems, automation, data pipelines, analytics tooling, LLM integration. For each project:\n- "### <Project title>"\n- 2 to 4 bullets (what it does, what you built, what impact)\n- Include repo/live URLs if present in Resume Facts\n\n## Education\n\n## Certifications (Selected)\nList up to 6 certifications most relevant to AI, cloud, devops, and backend engineering. If the Resume Facts contain a large list, select only the most relevant and add one last line: "Full list available on request" (only if a larger list exists in facts).\n\n## Earlier Experience\nOptional. If Resume Facts contain many older roles, compress them to single-line entries: "<Title> — <Company> (<Years>)".\n\nProfile focus / constraints (optional):\n{{profileFocus}}\n\nJob Ad:\n{{jdText}}\n\nResume Facts (from database):\n{{resumeFacts}}\n\nOutput: Return ONLY the final resume text in markdown.'

export const DEFAULT_AI_GENERATION_COVER_LETTER_STYLE = ''

export const DEFAULT_AI_GENERATION_COVER_LETTER_PROMPT =
  'Write an application letter based on the resume and the job ad.\n\nRules:\n- 3 to 5 short paragraphs\n- Do not invent facts\n- Use the greeting, header, and footer EXACTLY as provided\n- Match the provided letter style and tone notes\n\nLetter style (example to mimic):\n{{coverLetterStyle}}\n\nTone notes:\n{{toneNotes}}\n\nHeader (may be empty):\n{{resolvedHeader}}\n\nGreeting:\n{{resolvedGreeting}}\n\nFooter (must include as-is):\n{{resolvedFooter}}\n\n{{companyBlock}}\n\nGenerated Resume:\n{{generatedResume}}\n\nJob Ad:\n{{jdText}}\n\nOutput: Return the full application letter text including header (if present), greeting, body, and footer.'

export const AIGenerationSettings: GlobalConfig = {
  slug: 'aiGenerationSettings',
  access: {
    read: adminOrEditor,
    update: adminOrEditor,
  },
  fields: [
    {
      name: 'resetToDefaults',
      type: 'ui',
      admin: {
        components: {
          Field:
            '@/components/Globals/AIGenerationSettingsResetButton#AIGenerationSettingsResetButton',
        },
      },
    },
    {
      name: 'promptVersion',
      type: 'text',
      required: true,
      admin: {
        components: {
          Description:
            '@/components/FieldDescriptions/FieldHelpAccordionDescription#FieldHelpAccordionDescription',
        },
        custom: {
          helpTitle: 'Help (click to expand)',
          helpSections: [
            {
              heading: 'What this is',
              lines: [
                'A free-form label saved into each Generation record as metadata.',
                'Use it to track prompt changes over time (e.g. phase5-v1, phase5-v2, python-ats-v1).',
              ],
            },
            {
              heading: 'Allowed values',
              lines: [
                'Any text is allowed. Best practice is a short, stable identifier:',
                "Examples: 'phase5-v1', 'resume-ats-v2', 'python-automation-v1'",
              ],
            },
            {
              heading: 'Why it matters',
              lines: [
                'When you review generated resumes/letters later, promptVersion tells you which prompt setup produced them.',
                'If results get worse after edits, this makes it easy to compare and roll back.',
              ],
            },
          ],
        },
      },
      defaultValue: DEFAULT_AI_GENERATION_PROMPT_VERSION,
    },
    {
      name: 'model',
      type: 'text',
      required: true,
      admin: {
        components: {
          Description:
            '@/components/FieldDescriptions/FieldHelpAccordionDescription#FieldHelpAccordionDescription',
        },
        custom: {
          helpTitle: 'Help (click to expand)',
          helpSections: [
            {
              heading: 'What this is',
              lines: [
                'The OpenAI Chat Completions model name used for selection + drafting.',
                'This string is sent directly to OpenAI as the model parameter.',
              ],
            },
            {
              heading: 'Allowed values',
              lines: [
                'Any valid OpenAI model ID works (exact spelling matters).',
                "Common examples: 'gpt-4o-mini' (cheaper), 'gpt-4o' (more capable).",
              ],
            },
            {
              heading: 'Cheaper vs expensive (rule of thumb)',
              lines: [
                "Cheaper: smaller / 'mini' models — good for most resume tailoring.",
                'More expensive: larger flagship models — better reasoning, tone, and adherence in difficult cases.',
                'Cost scales mostly with total tokens (prompt + output).',
              ],
            },
            {
              heading: 'Best practice',
              lines: [
                "Start with 'gpt-4o-mini' for day-to-day generations.",
                "If output quality is inconsistent, try 'gpt-4o' for that job ad (and consider lowering max output length or reducing resumeFacts size).",
              ],
            },
          ],
        },
      },
      defaultValue: DEFAULT_AI_GENERATION_MODEL,
    },
    {
      name: 'temperature',
      type: 'number',
      required: true,
      admin: {
        components: {
          Description:
            '@/components/FieldDescriptions/FieldHelpAccordionDescription#FieldHelpAccordionDescription',
        },
        custom: {
          helpTitle: 'Help (click to expand)',
          helpSections: [
            {
              heading: 'What this is',
              lines: [
                'Controls randomness/creativity in the model output.',
                'Lower values are more deterministic; higher values are more varied.',
              ],
            },
            {
              heading: 'Allowed values',
              lines: [
                'Typically between 0 and 2. (This app does not enforce a strict range, but OpenAI may.)',
              ],
            },
            {
              heading: 'Recommended values for resumes',
              lines: [
                '0.0–0.3: Best for ATS-friendly, consistent formatting, and “no invented facts” behavior.',
                '0.4–0.7: More expressive writing, but higher risk of drifting style or adding unsupported claims.',
              ],
            },
            {
              heading: 'Best practice',
              lines: [
                'Keep temperature low and adjust the prompt first when you want better compliance.',
                'If you want more “human” phrasing, increase slightly (e.g. from 0.2 to 0.4) and re-check for hallucinations.',
              ],
            },
          ],
        },
      },
      defaultValue: DEFAULT_AI_GENERATION_TEMPERATURE,
    },
    {
      name: 'systemPrompt',
      type: 'textarea',
      required: true,
      defaultValue: DEFAULT_AI_GENERATION_SYSTEM_PROMPT,
    },
    {
      name: 'resumePrompt',
      type: 'textarea',
      required: true,
      admin: {
        components: {
          Description:
            '@/components/FieldDescriptions/ShortcodeReferenceDescription#ShortcodeReferenceDescription',
        },
        custom: {
          shortcodeTitle: 'Shortcodes (click to expand)',
          shortcodes: [
            {
              code: '{{fullName}}',
              description: 'From Globals → Resume Profile → fullName',
            },
            {
              code: '{{headline}}',
              description: 'From Globals → Resume Profile → headline (fallback: Job Ad title)',
            },
            {
              code: '{{contactBlock}}',
              description:
                'Combined contact lines (Globals → Resume Profile: address/email/phone + Globals → Site Settings → socialLinks)',
            },
            {
              code: '{{profileFocus}}',
              description: 'From the selected ResumeProfile record (resumeText + notes)',
            },
            {
              code: '{{resumeFacts}}',
              description:
                'Structured resume facts built from database collections (experiences/projects/certifications/educations); may be pre-filtered to the most job-relevant items',
            },
            {
              code: '{{jobTitle}}',
              description: 'From Generation → Job Ad → title',
            },
            {
              code: '{{companyName}}',
              description: 'From Generation → Job Ad → company.name',
            },
            {
              code: '{{jdText}}',
              description: 'From Generation → Job Ad → jobDescription',
            },
            {
              code: '{{posterName}}',
              description: 'From Job Ad → posterName (fallback: Hiring Manager)',
            },
            {
              code: '{{jobAdTitle}}',
              description: 'Alias of job title (Job Ad → title). Useful in resume prompts.',
            },
            {
              code: '{{jobAdLocation}}',
              description: 'Job Ad → location',
            },
            {
              code: '{{jobAdUrl}}',
              description: 'Job Ad → jobUrl',
            },
            {
              code: '{{jobAdPosterName}}',
              description: 'Job Ad → posterName (no fallback applied)',
            },
            {
              code: '{{companyWebsite}}',
              description: 'Company → website',
            },
            {
              code: '{{companyAbout}}',
              description: 'Company → about',
            },
            {
              code: '{{companyToneNotes}}',
              description: 'Company → toneNotes',
            },
          ],
        },
      },
      defaultValue: DEFAULT_AI_GENERATION_RESUME_PROMPT,
    },
    {
      name: 'coverLetterStyle',
      type: 'textarea',
      defaultValue: DEFAULT_AI_GENERATION_COVER_LETTER_STYLE,
    },
    {
      name: 'coverLetterPrompt',
      type: 'textarea',
      required: true,
      admin: {
        components: {
          Description:
            '@/components/FieldDescriptions/ShortcodeReferenceDescription#ShortcodeReferenceDescription',
        },
        custom: {
          shortcodeTitle: 'Shortcodes (click to expand)',
          shortcodes: [
            {
              code: '{{coverLetterStyle}}',
              description:
                'From this global → coverLetterStyle (or per-generation override if provided)',
            },
            {
              code: '{{toneNotes}}',
              description:
                'From the Generation record (toneNotes). If empty, falls back to a combined tone from company + resume profile',
            },
            {
              code: '{{resolvedHeader}}',
              description: 'Final header text (Generation override or CoverLetterSettings default)',
            },
            {
              code: '{{resolvedGreeting}}',
              description:
                'Final greeting text (Generation override or CoverLetterSettings default; can include poster name)',
            },
            {
              code: '{{resolvedFooter}}',
              description: 'Final footer text (Generation override or CoverLetterSettings default)',
            },
            {
              code: '{{companyBlock}}',
              description:
                'Company notes block built from Job Ad → company fields (name/website/about/toneNotes)',
            },
            {
              code: '{{generatedResume}}',
              description: 'The resume generated in the same run (resumeDraft)',
            },
            {
              code: '{{jdText}}',
              description: 'From Job Ad → jobDescription',
            },
            {
              code: '{{posterName}}',
              description: 'From Job Ad → posterName (fallback: Hiring Manager)',
            },
            {
              code: '{{jobTitle}}',
              description: 'From Job Ad → title',
            },
            {
              code: '{{companyName}}',
              description: 'From Job Ad → company.name',
            },
            {
              code: '{{jobAdUrl}}',
              description: 'Job Ad → jobUrl',
            },
            {
              code: '{{jobAdLocation}}',
              description: 'Job Ad → location',
            },
          ],
        },
      },
      defaultValue: DEFAULT_AI_GENERATION_COVER_LETTER_PROMPT,
    },
  ],
}
