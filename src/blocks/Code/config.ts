import type { Block } from 'payload'

export const Code: Block = {
  slug: 'code',
  interfaceName: 'CodeBlock',
  fields: [
    {
      name: 'language',
      type: 'select',
      defaultValue: 'typescript',
      options: [
        {
          label: 'Typescript',
          value: 'typescript',
        },
        {
          label: 'Javascript',
          value: 'javascript',
        },
        {
          label: 'CSS',
          value: 'css',
        },
        {
          label: 'PHP',
          value: 'php',
        },
        {
          label: 'Bash',
          value: 'bash',
        },
        {
          label: 'JSON',
          value: 'json',
        },
        {
          label: 'SQL',
          value: 'sql',
        },
        {
          label: 'HTML / Markup',
          value: 'markup',
        },
        {
          label: 'Plain text',
          value: 'text',
        },
      ],
    },
    {
      name: 'code',
      type: 'code',
      label: false,
      required: true,
    },
  ],
}
