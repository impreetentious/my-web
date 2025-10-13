import { defineCliConfig } from 'sanity/cli';

// Env-parameterized: set SANITY_STUDIO_PROJECT_ID after the owner creates the project.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || '';
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production';

export default defineCliConfig({
  api: {
    projectId: projectId || 'unconfigured',
    dataset,
  },
  studioHost: 'the-descent',
});
