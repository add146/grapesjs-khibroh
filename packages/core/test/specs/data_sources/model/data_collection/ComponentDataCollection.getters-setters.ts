import { Component, DataRecord, DataSource, DataSourceManager, Editor } from '../../../../../src';
import { DataVariableType } from '../../../../../src/data_sources/model/DataVariable';
import {
  DataCollectionType,
  DataCollectionVariableType,
} from '../../../../../src/data_sources/model/data_collection/constants';
import { DataCollectionStateVariableType } from '../../../../../src/data_sources/model/data_collection/types';
import EditorModel from '../../../../../src/editor/model/Editor';
import { setupTestEditor } from '../../../../common';
import ComponentDataCollection from '../../../../../src/data_sources/model/data_collection/ComponentDataCollection';

describe('Collection component getters and setters', () => {
  let em: EditorModel;
  let dsm: DataSourceManager;
  let dataSource: DataSource;
  let wrapper: Component;
  let firstRecord: DataRecord;
  let secondRecord: DataRecord;

  beforeEach(() => {
    ({ em, dsm } = setupTestEditor());
    wrapper = em.getWrapper()!;
    dataSource = dsm.add({
      id: 'my_data_source_id',
      records: [
        { id: 'user1', user: 'user1', firstName: 'Name1', age: '12' },
        { id: 'user2', user: 'user2', firstName: 'Name2', age: '14' },
        { id: 'user3', user: 'user3', firstName: 'Name3', age: '16' },
      ],
    });
    firstRecord = dataSource.getRecord('user1')!;
    secondRecord = dataSource.getRecord('user2')!;
  });

  afterEach(() => {
    em.destroy();
  });

  describe('Getters', () => {
    let cmp: ComponentDataCollection;

    beforeEach(() => {
      cmp = wrapper.components({
        type: DataCollectionType,
        collectionDef: {
          componentDef: {
            type: 'default',
            components: [
              {
                type: 'default',
                tagName: 'div',
                attributes: {
                  dataUser: {
                    type: DataCollectionVariableType,
                    variableType: DataCollectionStateVariableType.currentItem,
                    collectionId: 'my_collection',
                    path: 'user',
                  },
                },
              },
            ],
          },
          collectionConfig: {
            collectionId: 'my_collection',
            startIndex: 1,
            endIndex: 2,
            dataSource: {
              type: DataVariableType,
              path: 'my_data_source_id',
            },
          },
        },
      })[0] as ComponentDataCollection;
    });

    test('getItemsCount should return the correct number of items', () => {
      expect(cmp.getItemsCount()).toBe(2);
    });

    test('getConfigStartIndex should return the correct start index', () => {
      expect(cmp.getConfigStartIndex()).toBe(1);
    });

    test('getConfigEndIndex should return the correct end index', () => {
      expect(cmp.getConfigEndIndex()).toBe(2);
    });

    test('getComponentDef should return the correct component definition', () => {
      const componentDef = cmp.getComponentDef();

      expect(componentDef.type).toBe('default');
      expect(componentDef.components).toHaveLength(1);
      expect(componentDef?.components?.[0].attributes?.['dataUser']).toEqual({
        type: DataCollectionVariableType,
        variableType: DataCollectionStateVariableType.currentItem,
        collectionId: 'my_collection',
        path: 'user',
      });
    });

    test('getDataSource should return the correct data source', () => {
      const ds = cmp.getDataSource();

      expect(ds).toEqual({
        type: DataVariableType,
        path: 'my_data_source_id',
      });
    });

    test('getCollectionId should return the correct collection ID', () => {
      expect(cmp.getCollectionId()).toBe('my_collection');
    });

    test('getItemsCount should return 0 when no records are present', () => {
      dataSource.removeRecord('user1');
      dataSource.removeRecord('user2');
      dataSource.removeRecord('user3');
      expect(cmp.getItemsCount()).toBe(0);
    });

    test('getConfigStartIndex should handle zero as a valid start index', () => {
      cmp.setStartIndex(0);

      expect(cmp.getConfigStartIndex()).toBe(0);
      expect(cmp.getItemsCount()).toBe(3);
    });

    test('getConfigEndIndex should handle zero as a valid end index', () => {
      cmp.setEndIndex(0);

      expect(cmp.getConfigStartIndex()).toBe(1);
      expect(cmp.getConfigEndIndex()).toBe(0);
      expect(cmp.getItemsCount()).toBe(0);
    });
  });

  describe('Setters', () => {
    let cmp: ComponentDataCollection;

    beforeEach(() => {
      cmp = wrapper.components({
        type: DataCollectionType,
        collectionDef: {
          componentDef: {
            type: 'default',
            components: [
              {
                type: 'default',
                tagName: 'div',
                attributes: {
                  dataUser: {
                    type: DataCollectionVariableType,
                    variableType: DataCollectionStateVariableType.currentItem,
                    collectionId: 'my_collection',
                    path: 'user',
                  },
                },
              },
            ],
          },
          collectionConfig: {
            collectionId: 'my_collection',
            startIndex: 1,
            endIndex: 2,
            dataSource: {
              type: DataVariableType,
              path: 'my_data_source_id',
            },
          },
        },
      })[0] as ComponentDataCollection;
    });

    test('setComponentDef should update the component definition and reflect in children', () => {
      const newComponentDef = {
        type: 'newType',
        components: [
          {
            type: 'default',
            tagName: 'span',
            attributes: {
              'data-name': {
                type: DataCollectionVariableType,
                variableType: DataCollectionStateVariableType.currentItem,
                collectionId: 'my_collection',
                path: 'firstName',
              },
            },
          },
        ],
      };
      cmp.setComponentDef(newComponentDef);

      const children = cmp.components();
      expect(children).toHaveLength(2);
      expect(children.at(0).get('type')).toBe('newType');
      expect(children.at(0).components().at(0).get('tagName')).toBe('span');
      expect(children.at(0).components().at(0).getAttributes()['data-name']).toBe('Name2');
    });

    test('setStartIndex should update the start index and reflect in children', () => {
      cmp.setStartIndex(0);
      expect(cmp.getConfigStartIndex()).toBe(0);

      const children = cmp.components();
      expect(children).toHaveLength(3);
      expect(children.at(0).components().at(0).getAttributes()['dataUser']).toBe('user1');
      expect(children.at(1).components().at(0).getAttributes()['dataUser']).toBe('user2');
      expect(children.at(2).components().at(0).getAttributes()['dataUser']).toBe('user3');
    });

    test('setEndIndex should update the end index and reflect in children', () => {
      cmp.setEndIndex(3);
      expect(cmp.getConfigEndIndex()).toBe(3);

      const children = cmp.components();
      expect(children).toHaveLength(2);
      expect(children.at(0).components().at(0).getAttributes()['dataUser']).toBe('user2');
      expect(children.at(1).components().at(0).getAttributes()['dataUser']).toBe('user3');
    });

    test('setDataSource should update the data source and reflect in children', () => {
      dsm.add({
        id: 'new_data_source_id',
        records: [
          { id: 'user4', user: 'user4', firstName: 'Name4', age: '20' },
          { id: 'user5', user: 'user5', firstName: 'Name5', age: '21' },
        ],
      });

      cmp.setDataSource({
        type: DataVariableType,
        path: 'new_data_source_id',
      });

      const children = cmp.components();
      expect(children).toHaveLength(1);
      expect(children.at(0).components().at(0).getAttributes()['dataUser']).toBe('user5');
    });

    test('setStartIndex with zero should include the first record', () => {
      cmp.setStartIndex(0);

      const children = cmp.components();
      expect(children).toHaveLength(3);
      expect(children.at(0).components().at(0).getAttributes()['dataUser']).toBe('user1');
    });

    test('setEndIndex with zero should result in no children', () => {
      cmp.setEndIndex(0);

      const children = cmp.components();
      expect(children).toHaveLength(0);
    });

    test('setDataSource with an empty data source should result in no children', () => {
      dsm.add({
        id: 'empty_data_source_id',
        records: [],
      });

      cmp.setDataSource({
        type: DataVariableType,
        path: 'empty_data_source_id',
      });

      const children = cmp.components();
      expect(children).toHaveLength(0);
    });
  });

  describe('Impact on HTML output', () => {
    let cmp: ComponentDataCollection;

    beforeEach(() => {
      cmp = wrapper.components({
        type: DataCollectionType,
        collectionDef: {
          componentDef: {
            type: 'default',
            components: [
              {
                type: 'default',
                tagName: 'div',
                attributes: {
                  dataUser: {
                    type: DataCollectionVariableType,
                    variableType: DataCollectionStateVariableType.currentItem,
                    collectionId: 'my_collection',
                    path: 'user',
                  },
                },
              },
            ],
          },
          collectionConfig: {
            collectionId: 'my_collection',
            startIndex: 1,
            endIndex: 2,
            dataSource: {
              type: DataVariableType,
              path: 'my_data_source_id',
            },
          },
        },
      })[0] as ComponentDataCollection;
    });

    test('HTML output should reflect changes in startIndex', () => {
      cmp.setStartIndex(0);

      const html = cmp.toHTML();
      expect(html).toContain('dataUser="user1"');
      expect(html).toContain('dataUser="user2"');
      expect(html).toContain('dataUser="user3"');
    });

    test('HTML output should reflect changes in endIndex', () => {
      cmp.setEndIndex(3);

      const html = cmp.toHTML();
      expect(html).toContain('dataUser="user2"');
      expect(html).toContain('dataUser="user3"');
    });

    test('HTML output should reflect changes in dataSource', () => {
      dsm.add({
        id: 'new_data_source_id',
        records: [
          { id: 'user4', user: 'user4', firstName: 'Name4', age: '20' },
          { id: 'user5', user: 'user5', firstName: 'Name5', age: '21' },
        ],
      });
      cmp.setDataSource({
        type: DataVariableType,
        path: 'new_data_source_id',
      });

      const html = cmp.toHTML();
      expect(html).toContain('dataUser="user5"');
    });

    test('HTML output should be empty when endIndex is zero', () => {
      cmp.setEndIndex(0);

      const html = cmp.toHTML();
      expect(html).not.toContain('dataUser');
    });
  });
});
