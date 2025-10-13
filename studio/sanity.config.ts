import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';
import { deskStructure } from './structure';

// Env-parameterized until the owner supplies a real projectId (owner action).
// Local: copy studio/.env.example → studio/.env and set SANITY_STUDIO_PROJECT_ID.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || '';
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production';

if (!projectId) {
  // Studio still boots so schemas can be reviewed; API calls fail until configured.
  console.warn(
    '[studio] SANITY_STUDIO_PROJECT_ID is unset — set it in studio/.env after creating the Sanity project.'
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
