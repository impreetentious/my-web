import { defineField, defineType } from 'sanity';

const FIGURE = ['network', 'bars', 'stack', 'flow', 'orbit', 'pulse'] as const;
const STATUS = ['live', 'wip', 'archived'] as const;

// Mirrors content/projects.json items + enabled/order for Studio control.
export const projectItem = defineType({
  name: 'projectItem',
  title: 'Project item',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'slug',
      description: 'Stable id — matches content/projects.json `id`.',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'enabled', title: 'Enabled', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: 'Order', type: 'number', initialValue: 0 }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'stack',
      title: 'Stack',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({ name: 'href', title: 'Href', type: 'url' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: STATUS.map((v) => ({ title: v, value: v })) },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'figure',
      title: 'Figure',
      type: 'string',
      options: { list: FIGURE.map((v) => ({ title: v, value: v })) },
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
    select: { title: 'title', subtitle: 'status', enabled: 'enabled' },
    prepare: ({ title, subtitle, enabled }) => ({
      title: title || 'Untitled',
      subtitle: `${enabled === false ? 'HIDDEN · ' : ''}${subtitle || ''}`,
    }),
  },
});
