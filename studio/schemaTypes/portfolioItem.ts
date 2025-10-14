import { defineField, defineType } from 'sanity';

const FIGURE = ['network', 'bars', 'stack', 'flow', 'orbit', 'pulse'] as const;

// Mirrors content/portfolio.json items + enabled/order for Studio control.
export const portfolioItem = defineType({
  name: 'portfolioItem',
  title: 'Portfolio item',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'slug',
      description: 'Stable id — matches content/portfolio.json `id`.',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'enabled', title: 'Enabled', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: 'Order', type: 'number', initialValue: 0 }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'year', title: 'Year', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 4, validation: (r) => r.required() }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({ name: 'href', title: 'Href', type: 'url' }),
    defineField({
      name: 'figure',
      title: 'Figure',
      type: 'string',
      options: { list: FIGURE.map((v) => ({ title: v, value: v })) },
    }),
    defineField({
      name: 'caseStudy',
      title: 'Case study',
      type: 'object',
      fields: [
        defineField({ name: 'context', title: 'Context', type: 'text', rows: 2 }),
        defineField({ name: 'decision', title: 'Decision', type: 'text', rows: 2 }),
        defineField({ name: 'move', title: 'Move', type: 'text', rows: 2 }),
        defineField({ name: 'model', title: 'Model', type: 'text', rows: 2 }),
        defineField({ name: 'outcome', title: 'Outcome', type: 'text', rows: 2 }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'year', enabled: 'enabled' },
    prepare: ({ title, subtitle, enabled }) => ({
      title: title || 'Untitled',
      subtitle: `${enabled === false ? 'HIDDEN · ' : ''}${subtitle || ''}`,
    }),
  },
});
