import Component from '../../../dom_components/model/Component';
import {
  ComponentDefinition as ComponentProperties,
  ComponentDefinitionDefined,
  ComponentOptions,
  ToHTMLOptions,
  ComponentAddType,
} from '../../../dom_components/model/types';
import { toLowerCase } from '../../../utils/mixins';
import { DataCondition, DataConditionOutputChangedEvent, DataConditionProps, DataConditionType } from './DataCondition';
import { ConditionProps } from './DataConditionEvaluator';
import { StringOperation } from './operators/StringOperator';
import { ObjectAny } from '../../../common';
import { DataConditionIfTrueType, DataConditionIfFalseType } from './constants';

export type DataConditionDisplayType = typeof DataConditionIfTrueType | typeof DataConditionIfFalseType;

export interface ComponentDataConditionProps extends ComponentProperties {
  type: typeof DataConditionType;
  dataResolver: DataConditionProps;
}

export default class ComponentDataCondition extends Component {
  dataResolver: DataCondition;

  get defaults(): ComponentDefinitionDefined {
    return {
      // @ts-ignore
      ...super.defaults,
      droppable: false,
      type: DataConditionType,
      dataResolver: {
        condition: {
          left: '',
          operator: StringOperation.equalsIgnoreCase,
          right: '',
        },
      },
      components: [
        {
          type: DataConditionIfTrueType,
        },
        {
          type: DataConditionIfFalseType,
        },
      ],
    };
  }

  constructor(props: ComponentDataConditionProps, opt: ComponentOptions) {
    // @ts-ignore
    super(props, opt);

    const { condition } = props.dataResolver;
    this.dataResolver = new DataCondition({ condition }, { em: opt.em });

    this.listenToPropsChange();
  }

  isTrue() {
    return this.dataResolver.isTrue();
  }

  getCondition() {
    return this.dataResolver.getCondition();
  }

  getIfTrueContent(): Component | undefined {
    return this.components().at(0);
  }

  getIfFalseContent(): Component | undefined {
    return this.components().at(1);
  }

  getOutputContent(): Component | undefined {
    return this.isTrue() ? this.getIfTrueContent() : this.getIfFalseContent();
  }

  setCondition(newCondition: ConditionProps) {
    this.dataResolver.setCondition(newCondition);
  }

  setIfTrueComponents(content: ComponentAddType) {
    this.setComponentsAtIndex(0, content);
  }

  setIfFalseComponents(content: ComponentAddType) {
    this.setComponentsAtIndex(1, content);
  }

  getInnerHTML(opts?: ToHTMLOptions): string {
    return this.getOutputContent()?.getInnerHTML(opts) ?? '';
  }

  private setComponentsAtIndex(index: number, newContent: ComponentAddType) {
    const component = this.components().at(index);
    component?.components(newContent);
  }

  private listenToPropsChange() {
    this.on('change:dataResolver', () => {
      this.dataResolver.set(this.get('dataResolver'));
    });
  }

  toJSON(opts?: ObjectAny): ComponentProperties {
    const json = super.toJSON(opts);
    const dataResolver = this.dataResolver.toJSON();
    delete dataResolver.type;
    delete dataResolver.ifTrue;
    delete dataResolver.ifFalse;

    return {
      ...json,
      dataResolver,
    };
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === DataConditionType;
  }
}
