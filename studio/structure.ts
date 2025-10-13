import type { StructureResolver } from 'sanity/structure';

// Singletons (site, about) appear once; list types keep their document lists.
export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site')
        .id('site')
        .child(S.document().schemaType('site').documentId('site').title('Site')),
      S.listItem()
        .title('About')
        .id('about')
        .child(S.document().schemaType('about').documentId('about').title('About')),
      S.divider(),
      S.documentTypeListItem('portfolioItem').title('Portfolio'),
      S.documentTypeListItem('projectItem').title('Projects'),
      S.documentTypeListItem('series').title('Series'),
      S.documentTypeListItem('post').title('Posts'),
    ]);
