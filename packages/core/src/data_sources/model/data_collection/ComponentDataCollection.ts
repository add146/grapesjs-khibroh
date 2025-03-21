import { bindAll, isArray } from 'underscore';
import { ObjectAny } from '../../../common';
import Component from '../../../dom_components/model/Component';
import { ComponentDefinition, ComponentOptions } from '../../../dom_components/model/types';
import EditorModel from '../../../editor/model/Editor';
import { isObject, serialize, toLowerCase } from '../../../utils/mixins';
import DataResolverListener from '../DataResolverListener';
import DataSource from '../DataSource';
import DataVariable, { DataVariableProps, DataVariableType } from '../DataVariable';
import { ensureComponentInstance, isDataVariable } from '../../utils';
import { DataCollectionType, keyCollectionDefinition, keyCollectionsStateMap, keyIsCollectionItem } from './constants';
import {
  ComponentDataCollectionProps,
  DataCollectionConfig,
  DataCollectionDataSource,
  DataCollectionProps,
  DataCollectionState,
  DataCollectionStateMap,
} from './types';
import { getSymbolsToUpdate } from '../../../dom_components/model/SymbolUtils';
import { StyleProps, UpdateStyleOptions } from '../../../domain_abstract/model/StyleableModel';
import { updateFromWatcher } from '../../../dom_components/model/ComponentDataResolverWatchers';

export default class ComponentDataCollection extends Component {
  dataSourceWatcher?: DataResolverListener;

  constructor(props: ComponentDataCollectionProps, opt: ComponentOptions) {
    const collectionDef = props[keyCollectionDefinition];

    if (opt.forCloning) {
      return super(props as any, opt) as unknown as ComponentDataCollection;
    }

    const em = opt.em;
    const newProps = { ...props, components: undefined, droppable: false } as any;
    const cmp: ComponentDataCollection = super(newProps, opt) as unknown as ComponentDataCollection;

    if (!collectionDef) {
      em.logError('missing collection definition');
      return cmp;
    }

    this.rebuildChildrenFromCollection();
    bindAll(this, 'rebuildChildrenFromCollection');
    this.listenTo(this, `change:${keyCollectionDefinition}`, this.rebuildChildrenFromCollection);
    this.listenToDataSource();

    return cmp;
  }

  getItemsCount() {
    const items = this.getDataSourceItems();
    const startIndex = Math.max(0, this.getConfigStartIndex() ?? 0);
    const configEndIndex = this.getConfigEndIndex() ?? Number.MAX_VALUE;
    const endIndex = Math.min(items.length - 1, configEndIndex);

    const count = endIndex - startIndex + 1;
    return Math.max(0, count);
  }

  getConfigStartIndex() {
    return this.collectionConfig.startIndex;
  }

  getConfigEndIndex() {
    return this.collectionConfig.endIndex;
  }

  getComponentDef(): ComponentDefinition {
    return this.getFirstChildJSON();
  }

  getDataSource(): DataCollectionDataSource {
    return this.collectionDef?.collectionConfig?.dataSource;
  }

  getCollectionId(): string {
    return this.collectionDef?.collectionConfig?.collectionId;
  }

  setComponentDef(componentDef: ComponentDefinition) {
    this.set(keyCollectionDefinition, { ...this.collectionDef, componentDef });
  }

  setStartIndex(startIndex: number): void {
    if (startIndex < 0) {
      this.em.logError('Start index should be greater than or equal to 0');
      return;
    }

    this.updateCollectionConfig({ startIndex });
  }

  setEndIndex(endIndex: number): void {
    this.updateCollectionConfig({ endIndex });
  }

  private updateCollectionConfig(updates: Partial<DataCollectionConfig>): void {
    this.set(keyCollectionDefinition, {
      ...this.collectionDef,
      collectionConfig: {
        ...this.collectionConfig,
        ...updates,
      },
    });
  }

  setDataSource(dataSource: DataCollectionDataSource) {
    this.set(keyCollectionDefinition, {
      ...this.collectionDef,
      collectionConfig: { ...this.collectionConfig, dataSource },
    });
  }

  private getDataSourceItems() {
    return this.collectionDef?.collectionConfig ? getDataSourceItems(this.collectionConfig.dataSource, this.em) : [];
  }

  private getCollectionStateMap() {
    return (this.get(keyCollectionsStateMap) || {}) as DataCollectionStateMap;
  }

  private get collectionDef() {
    return (this.get(keyCollectionDefinition) || {}) as DataCollectionProps;
  }

  private get collectionConfig() {
    return (this.collectionDef?.collectionConfig || {}) as DataCollectionConfig;
  }

  private get collectionDataSource() {
    return this.collectionConfig.dataSource;
  }

  private getFirstChildJSON() {
    const firstChild = this.components().at(0);
    const firstChildJSON = firstChild ? serialize(firstChild) : this.collectionDef.componentDef;
    delete firstChildJSON?.draggable;
    delete firstChildJSON?.removable;
    return firstChildJSON;
  }

  private listenToDataSource() {
    const { em } = this;
    const path = this.collectionDataSource?.path;
    if (!path) return;
    this.dataSourceWatcher = new DataResolverListener({
      em,
      resolver: new DataVariable({ type: DataVariableType, path }, { em }),
      onUpdate: this.rebuildChildrenFromCollection,
    });
  }

  private rebuildChildrenFromCollection() {
    this.components().reset(this.getCollectionItems(), updateFromWatcher as any);
  }

  getCollectionItems() {
    const { componentDef, collectionConfig } = this.collectionDef;
    const result = validateCollectionConfig(collectionConfig, componentDef, this.em);

    if (!result) {
      return [];
    }

    const components: Component[] = [];
    const collectionId = collectionConfig.collectionId;
    const items = this.getDataSourceItems();

    const startIndex = this.getConfigStartIndex() ?? 0;
    const configEndIndex = this.getConfigEndIndex() ?? Number.MAX_VALUE;
    const endIndex = Math.min(items.length - 1, configEndIndex);
    const totalItems = endIndex - startIndex + 1;
    const parentCollectionStateMap = this.getCollectionStateMap();

    let symbolMain: Component;
    for (let index = startIndex; index <= endIndex; index++) {
      const item = items[index];
      const isFirstItem = index === startIndex;
      const collectionState: DataCollectionState = {
        collectionId,
        currentIndex: index,
        currentItem: item,
        startIndex: startIndex,
        endIndex: endIndex,
        totalItems: totalItems,
        remainingItems: totalItems - (index + 1),
      };

      if (parentCollectionStateMap[collectionId]) {
        this.em.logError(
          `The collection ID "${collectionId}" already exists in the parent collection state. Overriding it is not allowed.`,
        );
        return [];
      }

      const collectionsStateMap: DataCollectionStateMap = {
        ...parentCollectionStateMap,
        [collectionId]: collectionState,
      };

      if (isFirstItem) {
        symbolMain = ensureComponentInstance(
          {
            ...componentDef,
            draggable: false,
            removable: false,
          },
          this.opt,
        );
      }

      const instance = symbolMain!.clone({ symbol: true });
      !isFirstItem && instance.set('locked', true);
      setCollectionStateMapAndPropagate(collectionsStateMap, collectionId)(instance);
      components.push(instance);
    }

    return components;
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === DataCollectionType;
  }

  toJSON(opts?: ObjectAny) {
    const json = super.toJSON.call(this, opts) as ComponentDataCollectionProps;
    json[keyCollectionDefinition].componentDef = this.getFirstChildJSON();
    delete json.components;
    delete json.droppable;
    return json;
  }
}

function setCollectionStateMapAndPropagate(collectionsStateMap: DataCollectionStateMap, collectionId: string) {
  return (cmp: Component) => {
    setCollectionStateMap(collectionsStateMap)(cmp);

    const addListener = (component: Component) => {
      setCollectionStateMapAndPropagate(collectionsStateMap, collectionId)(component);
    };

    const listenerKey = `_hasAddListener${collectionId ? `_${collectionId}` : ''}`;
    const cmps = cmp.components();

    if (!cmp.collectionStateListeners.includes(listenerKey)) {
      cmp.listenTo(cmps, 'add', addListener);
      cmp.collectionStateListeners.push(listenerKey);

      const removeListener = (component: Component) => {
        component.stopListening(component.components(), 'add', addListener);
        component.off(`change:${keyCollectionsStateMap}`, handleCollectionStateMapChange);
        const index = component.collectionStateListeners.indexOf(listenerKey);
        if (index !== -1) {
          component.collectionStateListeners.splice(index, 1);
        }

        const collectionsStateMap = component.get(keyCollectionsStateMap);
        component.set(keyCollectionsStateMap, {
          ...collectionsStateMap,
          [collectionId]: undefined,
        });
      };

      cmp.listenTo(cmps, 'remove', removeListener);
    }

    cmps?.toArray().forEach((component: Component) => {
      setCollectionStateMapAndPropagate(collectionsStateMap, collectionId)(component);
    });

    cmp.on(`change:${keyCollectionsStateMap}`, handleCollectionStateMapChange);
  };
}

function handleCollectionStateMapChange(this: Component) {
  const updatedCollectionsStateMap = this.get(keyCollectionsStateMap);
  this.components()
    ?.toArray()
    .forEach((component: Component) => {
      setCollectionStateMap(updatedCollectionsStateMap)(component);
    });
}

function logErrorIfMissing(property: any, propertyPath: string, em: EditorModel) {
  if (!property) {
    em.logError(`The "${propertyPath}" property is required in the collection definition.`);
    return false;
  }
  return true;
}

function validateCollectionConfig(
  collectionConfig: DataCollectionConfig,
  componentDef: ComponentDefinition,
  em: EditorModel,
) {
  const validations = [
    { property: collectionConfig, propertyPath: 'collectionConfig' },
    { property: componentDef, propertyPath: 'componentDef' },
    { property: collectionConfig?.collectionId, propertyPath: 'collectionConfig.collectionId' },
    { property: collectionConfig?.dataSource, propertyPath: 'collectionConfig.dataSource' },
  ];

  for (const { property, propertyPath } of validations) {
    if (!logErrorIfMissing(property, propertyPath, em)) {
      return [];
    }
  }

  const startIndex = collectionConfig?.startIndex;

  if (startIndex !== undefined && (startIndex < 0 || !Number.isInteger(startIndex))) {
    em.logError(`Invalid startIndex: ${startIndex}. It must be a non-negative integer.`);
  }

  return true;
}

function setCollectionStateMap(collectionsStateMap: DataCollectionStateMap) {
  return (cmp: Component) => {
    cmp.set(keyIsCollectionItem, true);
    const updatedCollectionStateMap = {
      ...cmp.get(keyCollectionsStateMap),
      ...collectionsStateMap,
    };
    cmp.set(keyCollectionsStateMap, updatedCollectionStateMap);
    cmp.dataResolverWatchers.updateCollectionStateMap(updatedCollectionStateMap);

    const parentCollectionsId = Object.keys(updatedCollectionStateMap);
    const isFirstItem = parentCollectionsId.every(
      (key) => updatedCollectionStateMap[key].currentIndex === updatedCollectionStateMap[key].startIndex,
    );

    if (isFirstItem) {
      const __onStyleChange = cmp.__onStyleChange.bind(cmp);

      cmp.__onStyleChange = (newStyles: StyleProps, opts: UpdateStyleOptions = {}) => {
        __onStyleChange(newStyles);
        const cmps = getSymbolsToUpdate(cmp);

        cmps.forEach((cmp) => {
          cmp.addStyle(newStyles, opts);
        });
      };

      cmp.on(`change:${keyIsCollectionItem}`, () => {
        cmp.__onStyleChange = __onStyleChange;
      });
    }
  };
}

function getDataSourceItems(dataSource: DataCollectionDataSource, em: EditorModel) {
  let items: DataVariableProps[] = [];

  switch (true) {
    case isArray(dataSource):
      items = dataSource;
      break;
    case isObject(dataSource) && dataSource instanceof DataSource: {
      const id = dataSource.get('id')!;
      items = listDataSourceVariables(id, em);
      break;
    }
    case isDataVariable(dataSource): {
      const isDataSourceId = dataSource.path.split('.').length === 1;
      if (isDataSourceId) {
        const id = dataSource.path;
        items = listDataSourceVariables(id, em);
      } else {
        items = em.DataSources.getValue(dataSource.path, []);
      }
      break;
    }
    default:
  }

  return items;
}

function listDataSourceVariables(dataSource_id: string, em: EditorModel): DataVariableProps[] {
  const records = em.DataSources.getValue(dataSource_id, []);
  const keys = Object.keys(records);

  return keys.map((key) => ({
    type: DataVariableType,
    path: dataSource_id + '.' + key,
  }));
}
