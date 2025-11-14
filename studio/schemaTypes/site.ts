import { defineField, defineType } from 'sanity';

// Mirrors content/site.json field-for-field, plus resume (file asset).
export const site = defineType({
  name: 'site',
  title: 'Site',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'heroRoleLine',
      title: 'Hero role line',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: 'socials',
      title: 'Socials',
      type: 'object',
      fields: [
        defineField({
          name: 'linkedin',
          title: 'LinkedIn',
          type: 'url',
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'github',
          title: 'GitHub',
          type: 'url',
          validation: (r) => r.required(),
        }),
      ],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'domain',
      title: 'Canonical domain',
      type: 'url',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'proposition',
      title: 'Proposition',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'availability',
      title: 'Availability',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'resumeHref',
      title: 'Resume href',
      type: 'string',
      initialValue: '/resume.pdf',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'resumeAvailable',
      title: 'Resume available',
      type: 'boolean',
      initialValue: false,
      description: 'Flip true only when the resume PDF is published (or uploaded below).',
    }),
    defineField({
      name: 'resume',
      title: 'Resume PDF',
      type: 'file',
      options: { accept: 'application/pdf' },
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site' }),
  },
});
