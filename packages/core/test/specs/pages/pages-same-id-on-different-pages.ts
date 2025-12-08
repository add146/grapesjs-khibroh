import Editor from '../../../src/editor';
import EditorModel from '../../../src/editor/model/Editor';
import ComponentWrapper from '../../../src/dom_components/model/ComponentWrapper';

describe('Pages with same component ids across pages', () => {
  let editor: Editor;
  let em: EditorModel;
  let pm: Editor['Pages'];
  let domc: Editor['Components'];
  const getTitle = (wrapper: ComponentWrapper) => wrapper.components().at(0)!.components().at(0)!;

  beforeAll(() => {
    editor = new Editor({
      pageManager: {
        pages: [
          {
            id: 'p1',
            frames: [
              {
                component: {
                  type: 'wrapper',
                  attributes: { id: 'body' },
                  components: [
                    {
                      tagName: 'section',
                      components: [
                        {
                          tagName: 'h1',
                          type: 'text',
                          attributes: { id: 'main-title' },
                          components: [{ type: 'textnode', content: 'A' }],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            id: 'p2',
            frames: [
              {
                component: {
                  type: 'wrapper',
                  attributes: { id: 'body' },
                  components: [
                    {
                      tagName: 'section',
                      components: [
                        {
                          tagName: 'h1',
                          type: 'text',
                          attributes: { id: 'main-title' },
                          components: [{ type: 'textnode', content: 'B' }],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    });

    em = editor.getModel();
    pm = em.Pages;
    domc = em.Components;
    pm.onLoad();
  });

  afterAll(() => {
    editor.destroy();
  });

  test('Handles pages with components having the same id across pages', () => {
    const pages = pm.getAll();
    expect(pages.length).toBe(2);

    const p1 = pages[0];
    const p2 = pages[1];

    const w1 = p1.getMainComponent();
    const w2 = p2.getMainComponent();

    expect(w1.getId()).toBe('body');
    expect(w2.getId()).toBe('body');

    const t1 = getTitle(w1);
    const t2 = getTitle(w2);

    // IDs should be preserved per page but stored uniquely in the shared map
    expect(t1.getId()).toBe('main-title');
    expect(t2.getId()).toBe('main-title');

    const all = domc.allById();

    expect(all['body']).toBe(w1);
    expect(all['body-2']).toBe(w2);
    expect(all['main-title']).toBe(t1);
    expect(all['main-title-2']).toBe(t2);

    const html1 = editor.getHtml({ component: w1 });
    const html2 = editor.getHtml({ component: w2 });

    expect(html1).toContain('A');
    expect(html2).toContain('B');
  });
});
