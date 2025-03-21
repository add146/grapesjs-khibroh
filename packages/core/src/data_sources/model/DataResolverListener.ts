import { DataSourcesEvents, DataSourceListener } from '../types';
import { stringToPath } from '../../utils/mixins';
import { Model } from '../../common';
import EditorModel from '../../editor/model/Editor';
import DataVariable, { DataVariableType } from './DataVariable';
import { DataResolver } from '../types';
import {
  DataCondition,
  DataConditionOutputChangedEvent,
  DataConditionType,
} from './conditional_variables/DataCondition';
import { DataCollectionVariableType } from './data_collection/constants';
import DataCollectionVariable from './data_collection/DataCollectionVariable';

export interface DataResolverListenerProps {
  em: EditorModel;
  resolver: DataResolver;
  onUpdate: (value: any) => void;
}

interface ListenerWithCallback extends DataSourceListener {
  callback: () => void;
}

export default class DataResolverListener {
  private listeners: ListenerWithCallback[] = [];
  private em: EditorModel;
  private onUpdate: (value: any) => void;
  private model = new Model();
  resolver: DataResolver;

  constructor(props: DataResolverListenerProps) {
    this.em = props.em;
    this.resolver = props.resolver;
    this.onUpdate = props.onUpdate;
    this.listenToResolver();
  }

  private onChange = () => {
    const value = this.resolver.getDataValue();
    this.onUpdate(value);
  };

  private createListener(obj: any, event: string, callback: () => void = this.onChange): ListenerWithCallback {
    return { obj, event, callback };
  }

  listenToResolver() {
    const { resolver, model } = this;
    this.removeListeners();
    let listeners: ListenerWithCallback[] = [];
    const type = resolver.attributes.type;

    switch (type) {
      case DataCollectionVariableType:
        listeners = this.listenToDataCollectionVariable(resolver as DataCollectionVariable);
        break;
      case DataVariableType:
        listeners = this.listenToDataVariable(resolver as DataVariable);
        break;
      case DataConditionType:
        listeners = this.listenToConditionalVariable(resolver as DataCondition);
        break;
    }

    listeners.forEach((ls) => model.listenTo(ls.obj, ls.event, ls.callback));
    this.listeners = listeners;
  }

  private listenToConditionalVariable(dataVariable: DataCondition): ListenerWithCallback[] {
    return [
      {
        obj: dataVariable,
        event: DataConditionOutputChangedEvent,
        callback: this.onChange,
      },
    ];
  }

  private listenToDataVariable(dataVariable: DataVariable): ListenerWithCallback[] {
    const { em } = this;
    const { path } = dataVariable.attributes;
    const normPath = stringToPath(path || '').join('.');
    const [ds, dr] = em.DataSources.fromPath(path!);

    const dataListeners: ListenerWithCallback[] = [];

    if (ds) {
      dataListeners.push(this.createListener(ds.records, 'add remove reset'));
    }

    if (dr) {
      dataListeners.push(this.createListener(dr, 'change'));
    }

    dataListeners.push(
      this.createListener(dataVariable, 'change:path', () => {
        this.listenToResolver();
        this.onChange();
      }),
      this.createListener(dataVariable, 'change:defaultValue'),
      this.createListener(em.DataSources.all, 'add remove reset'),
      this.createListener(em, `${DataSourcesEvents.path}:${normPath}`),
    );

    return dataListeners;
  }

  private listenToDataCollectionVariable(dataVariable: DataCollectionVariable): ListenerWithCallback[] {
    return [this.createListener(dataVariable, 'change:value')];
  }

  private removeListeners() {
    this.listeners.forEach((ls) => this.model.stopListening(ls.obj, ls.event, ls.callback));
    this.listeners = [];
  }

  destroy() {
    this.removeListeners();
  }
}
