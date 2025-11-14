import { defineField, defineType } from 'sanity';

// Mirrors content/series.json entries. `key` is the map key (e.g. second-order).
export const series = defineType({
  name: 'series',
  title: 'Series',
  type: 'document',
  fields: [
    defineField({
      name: 'key',
      title: 'Key',
      type: 'slug',
      description: 'Stable series id used in post frontmatter (e.g. second-order).',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'planned',
      title: 'Planned parts',
      type: 'number',
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'key.current' },
  },
});
