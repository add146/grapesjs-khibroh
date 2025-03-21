import { ObjectAny } from '../../common';
import Component from '../../dom_components/model/Component';
import { ComponentDefinition, ComponentOptions, ComponentProperties } from '../../dom_components/model/types';
import { toLowerCase } from '../../utils/mixins';
import DataVariable, { DataVariableProps, DataVariableType } from './DataVariable';

export interface ComponentDataVariableProps extends ComponentProperties {
  type: typeof DataVariableType;
  dataResolver: DataVariableProps;
}

export default class ComponentDataVariable extends Component {
  dataResolver: DataVariable;

  get defaults() {
    return {
      // @ts-ignore
      ...super.defaults,
      droppable: false,
      type: DataVariableType,
      dataResolver: {
        path: '',
        defaultValue: '',
      },
    };
  }

  constructor(props: ComponentDataVariableProps, opt: ComponentOptions) {
    super(props, opt);

    this.dataResolver = new DataVariable(props.dataResolver, opt);
    this.listenToPropsChange();
  }

  getPath() {
    return this.dataResolver.get('path');
  }

  getDefaultValue() {
    return this.dataResolver.get('defaultValue');
  }

  getDataValue() {
    return this.dataResolver.getDataValue();
  }

  getInnerHTML() {
    return this.getDataValue();
  }

  setPath(newPath: string) {
    this.dataResolver.set('path', newPath);
  }

  setDefaultValue(newValue: string) {
    this.dataResolver.set('defaultValue', newValue);
  }

  private listenToPropsChange() {
    this.on('change:dataResolver', () => {
      this.dataResolver.set(this.get('dataResolver'));
    });
  }

  toJSON(opts?: ObjectAny): ComponentDefinition {
    const json = super.toJSON(opts);
    const dataResolver = this.dataResolver.toJSON();
    delete dataResolver.type;

    return {
      ...json,
      dataResolver,
    };
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === DataVariableType;
  }
}
