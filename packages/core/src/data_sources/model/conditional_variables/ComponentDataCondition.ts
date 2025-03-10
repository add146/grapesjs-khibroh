import Component from '../../../dom_components/model/Component';
import { ComponentDefinition, ComponentOptions } from '../../../dom_components/model/types';
import { toLowerCase } from '../../../utils/mixins';
import { DataCondition, DataConditionProps, DataConditionType } from './DataCondition';
import { ConditionProps } from './DataConditionEvaluator';

export default class ComponentDataCondition extends Component {
  dataResolver: DataCondition;

  constructor(props: DataConditionProps, opt: ComponentOptions) {
    const dataConditionInstance = new DataCondition(props, { em: opt.em });

    super(
      {
        ...props,
        type: DataConditionType,
        components: dataConditionInstance.getDataValue(),
        droppable: false,
      },
      opt,
    );
    this.dataResolver = dataConditionInstance;
    this.dataResolver.onValueChange = this.handleConditionChange.bind(this);
  }

  getCondition() {
    return this.dataResolver.getCondition();
  }

  getIfTrue() {
    return this.dataResolver.getIfTrue();
  }

  getIfFalse() {
    return this.dataResolver.getIfFalse();
  }

  private handleConditionChange() {
    this.components(this.dataResolver.getDataValue());
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === DataConditionType;
  }

  setCondition(newCondition: ConditionProps) {
    this.dataResolver.setCondition(newCondition);
  }

  setIfTrue(newIfTrue: any) {
    this.dataResolver.setIfTrue(newIfTrue);
  }

  setIfFalse(newIfFalse: any) {
    this.dataResolver.setIfFalse(newIfFalse);
  }

  toJSON(): ComponentDefinition {
    return this.dataResolver.toJSON();
  }
}
