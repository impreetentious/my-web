import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';
import { deskStructure } from './structure';

// Local development reads the project and dataset from studio/.env.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || '';
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production';

if (!projectId) {
  // Studio still boots so schemas can be reviewed; API calls fail until configured.
  console.warn(
    '[studio] SANITY_STUDIO_PROJECT_ID is unset — set it in studio/.env after creating the Sanity project.',
  );
}

export default defineConfig({
  name: 'the-descent',
  title: 'The Descent',
  projectId: projectId || 'unconfigured',
  dataset,
  plugins: [structureTool({ structure: deskStructure }), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
