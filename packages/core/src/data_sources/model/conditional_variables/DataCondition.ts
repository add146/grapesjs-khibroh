import { Model } from '../../../common';
import EditorModel from '../../../editor/model/Editor';
import DataVariable, { DataVariableProps } from '../DataVariable';
import DataResolverListener from '../DataResolverListener';
import { evaluateVariable, isDataVariable } from '../utils';
import { DataConditionEvaluator, ConditionProps } from './DataConditionEvaluator';
import { AnyTypeOperation } from './operators/AnyTypeOperator';
import { BooleanOperation } from './operators/BooleanOperator';
import { NumberOperation } from './operators/NumberOperator';
import { StringOperation } from './operators/StringOperator';
import { isUndefined } from 'underscore';

export const DataConditionType = 'data-condition';

export interface ExpressionProps {
  left: any;
  operator: AnyTypeOperation | StringOperation | NumberOperation;
  right: any;
}

export interface LogicGroupProps {
  logicalOperator: BooleanOperation;
  statements: ConditionProps[];
}

export interface DataConditionProps {
  type: typeof DataConditionType;
  condition: ConditionProps;
  ifTrue: any;
  ifFalse: any;
}

interface DataConditionPropsDefined extends Omit<DataConditionProps, 'condition'> {
  condition: DataConditionEvaluator;
}

export class DataCondition extends Model<DataConditionPropsDefined> {
  private em: EditorModel;
  private resolverListeners: DataResolverListener[] = [];
  private _onValueChange?: () => void;

  constructor(
    props: {
      condition: ConditionProps;
      ifTrue: any;
      ifFalse: any;
    },
    opts: { em: EditorModel; onValueChange?: () => void },
  ) {
    if (isUndefined(props.condition)) {
      opts.em.logError('No condition was provided to a conditional component.');
    }

    const conditionInstance = new DataConditionEvaluator({ condition: props.condition }, { em: opts.em });

    super({
      type: DataConditionType,
      ...props,
      condition: conditionInstance,
    });
    this.em = opts.em;
    this.listenToDataVariables();
    this._onValueChange = opts.onValueChange;

    this.on('change:condition change:ifTrue change:ifFalse', () => {
      this.listenToDataVariables();
      this._onValueChange?.();
    });
  }

  private get conditionEvaluator() {
    return this.get('condition')!;
  }

  getCondition(): ConditionProps {
    return this.get('condition')?.get('condition')!;
  }

  getIfTrue() {
    return this.get('ifTrue')!;
  }

  getIfFalse() {
    return this.get('ifFalse')!;
  }

  isTrue(): boolean {
    return this.conditionEvaluator.evaluate();
  }

  getDataValue(skipDynamicValueResolution: boolean = false): any {
    const ifTrue = this.get('ifTrue');
    const ifFalse = this.get('ifFalse');

    const isConditionTrue = this.isTrue();
    if (skipDynamicValueResolution) {
      return isConditionTrue ? ifTrue : ifFalse;
    }

    return isConditionTrue ? evaluateVariable(ifTrue, this.em) : evaluateVariable(ifFalse, this.em);
  }

  set onValueChange(newFunction: () => void) {
    this._onValueChange = newFunction;
  }

  setCondition(newCondition: ConditionProps) {
    const newConditionInstance = new DataConditionEvaluator({ condition: newCondition }, { em: this.em });
    this.set('condition', newConditionInstance);
  }

  setIfTrue(newIfTrue: any) {
    this.set('ifTrue', newIfTrue);
  }

  setIfFalse(newIfFalse: any) {
    this.set('ifFalse', newIfFalse);
  }

  private listenToDataVariables() {
    const { em } = this;
    if (!em) return;

    // Clear previous listeners to avoid memory leaks
    this.cleanupListeners();

    const dataVariables = this.getDependentDataVariables();

    dataVariables.forEach((variable) => {
      const listener = new DataResolverListener({
        em,
        resolver: new DataVariable(variable, { em: this.em }),
        onUpdate: (() => {
          this._onValueChange?.();
        }).bind(this),
      });

      this.resolverListeners.push(listener);
    });
  }

  getDependentDataVariables() {
    const dataVariables: DataVariableProps[] = this.conditionEvaluator.getDependentDataVariables();
    const ifTrue = this.get('ifTrue');
    const ifFalse = this.get('ifFalse');
    if (isDataVariable(ifTrue)) dataVariables.push(ifTrue);
    if (isDataVariable(ifFalse)) dataVariables.push(ifFalse);

    return dataVariables;
  }

  private cleanupListeners() {
    this.resolverListeners.forEach((listener) => listener.destroy());
    this.resolverListeners = [];
  }

  toJSON() {
    const ifTrue = this.get('ifTrue');
    const ifFalse = this.get('ifFalse');

    return {
      type: DataConditionType,
      condition: this.conditionEvaluator,
      ifTrue,
      ifFalse,
    };
  }
}
