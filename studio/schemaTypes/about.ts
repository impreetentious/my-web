import { defineField, defineType } from 'sanity';

// Mirrors content/about.json field-for-field.
export const about = defineType({
  name: 'about',
  title: 'About',
  type: 'document',
  fields: [
    defineField({ name: 'headline', title: 'Headline', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [{ type: 'text', rows: 4 }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'bioNotes',
      title: 'Bio notes',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'pullQuote', title: 'Pull quote', type: 'text', rows: 2 }),
    defineField({ name: 'pullQuoteRef', title: 'Pull quote ref', type: 'string' }),
    defineField({ name: 'currentFocus', title: 'Current focus', type: 'text', rows: 3 }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'value', title: 'Value', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
          ],
          preview: {
            select: { title: 'value', subtitle: 'label' },
          },
        },
      ],
    }),
    defineField({
      name: 'skills',
      title: 'Skills',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'stack',
      title: 'Stack',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
  ],
  preview: {
    prepare: () => ({ title: 'About' }),
  },
});
