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
      defaultValue: 'phase5-v1',
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
      defaultValue: 'gpt-4o-mini',
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
      defaultValue:
        'Write an application letter based on the resume and the job ad.\n\nRules:\n- 3 to 5 short paragraphs\n- Do not invent facts\n- Use the greeting, header, and footer EXACTLY as provided\n- Match the provided letter style and tone notes\n\nLetter style (example to mimic):\n{{coverLetterStyle}}\n\nTone notes:\n{{toneNotes}}\n\nHeader (may be empty):\n{{resolvedHeader}}\n\nGreeting:\n{{resolvedGreeting}}\n\nFooter (must include as-is):\n{{resolvedFooter}}\n\n{{companyBlock}}\n\nGenerated Resume:\n{{generatedResume}}\n\nJob Ad:\n{{jdText}}\n\nOutput: Return the full application letter text including header (if present), greeting, body, and footer.',
    },
  ],
}
