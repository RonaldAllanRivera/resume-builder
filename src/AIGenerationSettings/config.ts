import type { GlobalConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'

export const DEFAULT_AI_GENERATION_PROMPT_VERSION = 'phase5-v1'

export const DEFAULT_AI_GENERATION_MODEL = 'gpt-4o-mini'

export const DEFAULT_AI_GENERATION_TEMPERATURE = 0.0

export const DEFAULT_AI_GENERATION_SYSTEM_PROMPT = `You are a strict resume and cover letter drafting assistant.

Non-negotiable rules:
- Do NOT invent facts.
- Do NOT create new jobs/clients/projects/certifications/skills that are not explicitly present in the provided Resume Facts.
- Do NOT change company names, locations, or date ranges. Copy them exactly from Resume Facts or omit if missing.
- Do NOT change job titles unless the prompt explicitly instructs you to reword them (wording only; no new facts).
- If a fact is missing, omit it (do not guess).
- Output must be plain text / markdown only.`

export const DEFAULT_AI_GENERATION_EXPERIENCE_REWRITE_PROMPT = `Rewrite CURRENT work experiences to better match the job ad while staying strictly factual.

Rules:
- Do NOT invent facts
- Do NOT change company names or dates
- You MAY rewrite the role title (wording only) to align with the job ad
- If helpful and justified by the provided facts, you MAY append ONE aligned title variant using this exact format:
  "<Original Title> | <Aligned Title Variant>"
  Otherwise, keep the original title.
- Do NOT add or imply freelance, self-employed, contractor, contractual, or project-based roles
- You MAY rewrite each highlight bullet for clarity and relevance, but you must preserve the meaning
- Highlights must be plain text strings (do NOT include leading "*" or "-" bullet markers)
- Keep highlights concise, action-oriented, and ATS-friendly
- Keep bullet count <= original bullet count for that experience
- Return JSON only

Return JSON shape:
{"experiences":[{"id":"<expId>","roleTitle":"<custom title>","highlights":["..."]}]}

Job Title: {{jobTitle}}

Job Ad:
{{jdText}}

Current Experiences (authoritative source):
{{currentExperiencesJson}}`

export const DEFAULT_AI_GENERATION_PROJECTS_REWRITE_PROMPT = `Summarize the following projects into short resume bullets tailored to the job ad.

Rules:
- Do NOT invent facts
- Use ONLY information present in each project's title/summary/tech
- Output 2 to 3 bullets per project (prefer 3 when possible)
- Bullets must be concise and ATS-friendly (aim ~10-18 words each)
- Bullets must be plain text strings (do NOT include leading "*" or "-" bullet markers)
- Return JSON only

Return JSON shape:
{"projects":[{"id":"<projId>","bullets":["...","...","..."]}]}

Job Title: {{jobTitle}}

Job Ad:
{{jdText}}

Projects (authoritative source):
{{projectsJson}}`

export const DEFAULT_AI_GENERATION_RESUME_PROMPT = `Rewrite the resume into a clean, modern resume that is ATS-friendly and easy for humans to scan.

Optimization goal:
- Keep the resume as short as possible (target ~1 page). Prefer dense, high-signal content.

Hard rules (must follow):
- Output ONLY the final resume text (no explanations, no preface, no advice sections)
- Do NOT invent facts.
- You may ONLY use content that appears in Resume Facts.
- Do NOT create any new roles such as "Self-Employed" or new companies.
- Do NOT create any new projects (no made-up product names).
- Do NOT change company names, job titles, locations, or date ranges.
- Bullet points must be grounded in the specific role/project highlights from Resume Facts.
- No tables, no emojis.

CRITICAL: How to use Resume Facts
- Resume Facts contain tagged entries like "- [proj:123] Project Title — URL" and "- [cert:123] Certification — Issuer"
- ONLY use projects that have "- [proj:" tags in Resume Facts
- ONLY use certifications that have "- [cert:" tags in Resume Facts
- ONLY use education that have "- [edu:" tags in Resume Facts
- Copy names, issuers, locations, and dates EXACTLY as shown in Resume Facts
- Use the bullet points (indented lines) under each tagged entry as your highlights

CRITICAL: Some sections are pre-formatted
- The following shortcodes are already formatted from the database/server:
  - {{professionalExperienceBlocks}}
  - {{professionalExperienceBlocksCustomized}}
  - {{earlierExperienceLines}}
  - {{latestProjectsBlocks}}
  - {{educationBlocks}}
  - {{certificationBlocks}}
- You MUST include them EXACTLY as provided.
- Do NOT rewrite them.
- Do NOT re-order bullets.
- Do NOT change dates/titles/companies.
- Do NOT add missing details.

Target role: {{jobTitle}}
Company: {{companyName}}

Job Ad (use only to choose emphasis, NOT to add facts):
{{jdText}}

Resume Facts (authoritative source of truth):
{{resumeFacts}}

Profile focus / constraints (optional):
{{profileFocus}}

First, generate a professional headline (1 line, 10-15 words) that positions the candidate for the target role based on Resume Facts and Job Ad. Make it specific to the job requirements while staying true to Resume Facts.

Output: Return ONLY the final resume text in markdown using this EXACT layout:

# **{{fullName}}**
**[Generated Headline Here]**
Location: {{address}}
Email: {{email}} | Mobile: {{phone}}
Portfolio: https://{{portfolioUrl}}
LinkedIn: https://{{linkedinUrl}}
GitHub: https://{{githubUrl}}

---

## **Professional Summary**

Write 2 to 3 sentences (concise).
- Must be consistent with Resume Facts.
- Emphasize skills and experience relevant to the target role/job ad.
- If the job targets AI/LLM/automation, highlight those skills IF present in Resume Facts.
- If the job targets Laravel/WordPress/Full-Stack, highlight those skills IF present in Resume Facts.
- Do not invent skills or experience not present in Resume Facts.

---

## **Core Skills**

Output exactly ONE line in this format (no bullets, no subheadings, no extra blank lines):
skill1, skill2, skill3, ...

Do NOT add any prefix like "Core Skills:".

Rules:
- Use ONLY tools/tech explicitly present in Resume Facts
- Prioritize skills most relevant to the Job Ad
- Keep it short: 12 to 18 skills max
- Comma + space separators only

---

## **Professional Experience**

{{professionalExperienceBlocksCustomized}}

---

## **Latest Projects**

{{latestProjectsBlocks}}

---

## **Earlier Experience**

{{earlierExperienceLines}}

---

## **Education**

{{educationBlocks}}

---

## **Certifications (Selected)**

{{certificationBlocks}}

*(Full certification list available on LinkedIn)*`

export const DEFAULT_AI_GENERATION_COVER_LETTER_STYLE = ''

export const DEFAULT_AI_GENERATION_COVER_LETTER_PROMPT =
  'Write an application letter based on the resume and the job ad.\n\nRules:\n- 3 to 5 short paragraphs\n- Do not invent facts\n- Use the greeting, header, and footer EXACTLY as provided (verbatim)\n- If Header is empty, OMIT it entirely\n- Do NOT output labels like "Header:", "Greeting:", or "Footer:"\n- Match the provided letter style and tone notes\n\nLetter style (example to mimic):\n{{coverLetterStyle}}\n\nTone notes:\n{{toneNotes}}\n\nHeader text (may be empty; include only if non-empty):\n{{resolvedHeader}}\n\nGreeting text:\n{{resolvedGreeting}}\n\nFooter text (must include as-is):\n{{resolvedFooter}}\n\n{{companyBlock}}\n\nGenerated Resume:\n{{generatedResume}}\n\nJob Ad:\n{{jdText}}\n\nOutput: Return the full application letter text (header if present, greeting, body, footer).'

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
              code: '{{address}}',
              description: 'From Globals → Resume Profile → address',
            },
            {
              code: '{{email}}',
              description: 'From Globals → Resume Profile → email',
            },
            {
              code: '{{phone}}',
              description: 'From Globals → Resume Profile → phone',
            },
            {
              code: '{{portfolioUrl}}',
              description:
                'Derived from Globals → Site Settings → socialLinks (Portfolio/Website URL; normalized, no protocol)',
            },
            {
              code: '{{linkedinUrl}}',
              description:
                'Derived from Globals → Site Settings → socialLinks (LinkedIn URL; normalized, no protocol)',
            },
            {
              code: '{{githubUrl}}',
              description:
                'Derived from Globals → Site Settings → socialLinks (GitHub URL; normalized, no protocol)',
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
              code: '{{professionalExperienceBlocks}}',
              description:
                'Pre-formatted blocks for CURRENT experiences (experiences.current=true), joined with "---" separators, matching the new-resume.txt “Professional Experience” layout',
            },
            {
              code: '{{professionalExperienceBlocksCustomized}}',
              description:
                'AI-customized version of current experience blocks. Company + dates remain from the database, but the role title + highlight bullets may be rewritten to better match the job ad (still no invented facts).',
            },
            {
              code: '{{latestProjectsBlocks}}',
              description:
                'Pre-formatted top 3 job-relevant projects (selected via the selection step when available). Includes title, repo/live URL, tech stack line, and bullets. Must be included verbatim.',
            },
            {
              code: '{{educationBlocks}}',
              description:
                'Pre-formatted education entries in a strict 3-line format: degree, school-location, and date range (e.g. "May 2001 to May 2004"). Must be included verbatim.',
            },
            {
              code: '{{certificationBlocks}}',
              description:
                'Pre-formatted top 5 job-ad-relevant certifications (selected via the selection step when available). Each entry includes title, a single metadata line (issuer, duration, issue date), and credential URL. Must be included verbatim.',
            },
            {
              code: '{{professionalExperience1Block}}',
              description:
                'First CURRENT experience block (current=true). Use when you want explicit control over ordering/placement',
            },
            {
              code: '{{professionalExperience2Block}}',
              description: 'Second CURRENT experience block (current=true)',
            },
            {
              code: '{{professionalExperience1BlockCustomized}}',
              description:
                'AI-customized first CURRENT experience block (title + bullets rewritten for the job ad; company + dates unchanged)',
            },
            {
              code: '{{professionalExperience2BlockCustomized}}',
              description:
                'AI-customized second CURRENT experience block (title + bullets rewritten for the job ad; company + dates unchanged)',
            },
            {
              code: '{{professionalExperience1TitleCustomized}}',
              description:
                'AI-customized role title for the first CURRENT experience (wording only; no new facts)',
            },
            {
              code: '{{professionalExperience2TitleCustomized}}',
              description:
                'AI-customized role title for the second CURRENT experience (wording only; no new facts)',
            },
            {
              code: '{{professionalExperience1HighlightsCustomized}}',
              description:
                'AI-customized markdown bullets for the first CURRENT experience (rewritten for relevance; no new facts)',
            },
            {
              code: '{{professionalExperience2HighlightsCustomized}}',
              description:
                'AI-customized markdown bullets for the second CURRENT experience (rewritten for relevance; no new facts)',
            },
            {
              code: '{{earlierExperienceLines}}',
              description:
                'Pre-formatted one-line entries for PAST experiences (experiences.current=false), one per line, matching the new-resume.txt “Earlier Experience” format',
            },
            {
              code: '{{earlierExperience1Line}}',
              description: 'First PAST experience one-liner (current=false)',
            },
            {
              code: '{{earlierExperience2Line}}',
              description: 'Second PAST experience one-liner (current=false)',
            },
            {
              code: '{{earlierExperience3Line}}',
              description: 'Third PAST experience one-liner (current=false)',
            },
            {
              code: '{{earlierExperience4Line}}',
              description: 'Fourth PAST experience one-liner (current=false)',
            },
            {
              code: '{{earlierExperience5Line}}',
              description: 'Fifth PAST experience one-liner (current=false)',
            },
            {
              code: '{{earlierExperience6Line}}',
              description: 'Sixth PAST experience one-liner (current=false)',
            },
            {
              code: '{{earlierExperience7Line}}',
              description: 'Seventh PAST experience one-liner (current=false)',
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
      name: 'experienceRewritePrompt',
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
              code: '{{jobTitle}}',
              description: 'From Generation → Job Ad → title',
            },
            {
              code: '{{jdText}}',
              description: 'From Generation → Job Ad → jobDescription',
            },
            {
              code: '{{currentExperiencesJson}}',
              description:
                'JSON payload of CURRENT experiences from the database (current=true), including id/title/company/location/dates/highlights',
            },
          ],
        },
      },
      defaultValue: DEFAULT_AI_GENERATION_EXPERIENCE_REWRITE_PROMPT,
    },
    {
      name: 'projectsRewritePrompt',
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
              code: '{{jobTitle}}',
              description: 'From Generation → Job Ad → title',
            },
            {
              code: '{{jdText}}',
              description: 'From Generation → Job Ad → jobDescription',
            },
            {
              code: '{{projectsJson}}',
              description:
                'JSON payload of the TOP 3 selected projects from the database (id/title/summary/tech), used as the authoritative source for bullet rewriting',
            },
          ],
        },
      },
      defaultValue: DEFAULT_AI_GENERATION_PROJECTS_REWRITE_PROMPT,
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
