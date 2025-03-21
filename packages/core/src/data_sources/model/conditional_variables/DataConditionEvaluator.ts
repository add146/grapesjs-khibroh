import { DataVariableProps } from '../DataVariable';
import EditorModel from '../../../editor/model/Editor';
import { resolveDynamicValue, isDataVariable } from '../../utils';
import { ExpressionProps, LogicGroupProps } from './DataCondition';
import { LogicalGroupEvaluator } from './LogicalGroupEvaluator';
import { Operator } from './operators/BaseOperator';
import { AnyTypeOperation, AnyTypeOperator } from './operators/AnyTypeOperator';
import { BooleanOperator } from './operators/BooleanOperator';
import { NumberOperator, NumberOperation } from './operators/NumberOperator';
import { StringOperator, StringOperation } from './operators/StringOperator';
import { Model } from '../../../common';
import { DataConditionOperation } from './operators/types';

export type ConditionProps = ExpressionProps | LogicGroupProps | boolean;

interface DataConditionEvaluatorProps {
  condition: ConditionProps;
}

export class DataConditionEvaluator extends Model<DataConditionEvaluatorProps> {
  private em: EditorModel;

  constructor(props: DataConditionEvaluatorProps, opts: { em: EditorModel }) {
    super(props);
    this.em = opts.em;
  }

  evaluate(): boolean {
    const em = this.em;
    const condition = this.get('condition');
    if (typeof condition === 'boolean') return condition;

    if (this.isLogicGroup(condition)) {
      const { logicalOperator, statements } = condition;
      const operator = new BooleanOperator(logicalOperator, { em });
      const logicalGroup = new LogicalGroupEvaluator(operator, statements, { em });
      return logicalGroup.evaluate();
    }

    if (this.isExpression(condition)) {
      const { left, operator, right } = condition;
      const evaluateLeft = resolveDynamicValue(left, this.em);
      const evaluateRight = resolveDynamicValue(right, this.em);
      const op = this.getOperator(evaluateLeft, operator);
      if (!op) return false;

      const evaluated = op.evaluate(evaluateLeft, evaluateRight);
      return evaluated;
    }

    this.em.logError('Invalid condition type.');
    return false;
  }

  /**
   * Factory method for creating operators based on the data type.
   */
  private getOperator(left: any, operator: string | undefined): Operator<DataConditionOperation> | undefined {
    const em = this.em;

    if (this.isOperatorInEnum(operator, AnyTypeOperation)) {
      return new AnyTypeOperator(operator as AnyTypeOperation, { em });
    } else if (typeof left === 'number') {
      return new NumberOperator(operator as NumberOperation, { em });
    } else if (typeof left === 'string') {
      return new StringOperator(operator as StringOperation, { em });
    }

    this.em?.logError(`Unsupported data type: ${typeof left}`);
    return;
  }

  getDependentDataVariables(): DataVariableProps[] {
    const condition = this.get('condition');
    if (!condition) return [];

    return this.extractDataVariables(condition);
  }

  private extractDataVariables(condition: ConditionProps): DataVariableProps[] {
    const variables: DataVariableProps[] = [];

    if (this.isExpression(condition)) {
      if (isDataVariable(condition.left)) variables.push(condition.left);
      if (isDataVariable(condition.right)) variables.push(condition.right);
    } else if (this.isLogicGroup(condition)) {
      condition.statements.forEach((stmt) => variables.push(...this.extractDataVariables(stmt)));
    }

    return variables;
  }

  private isLogicGroup(condition: any): condition is LogicGroupProps {
    return condition && typeof condition.logicalOperator !== 'undefined' && Array.isArray(condition.statements);
  }

  private isExpression(condition: any): condition is ExpressionProps {
    return condition && typeof condition.left !== 'undefined' && typeof condition.operator === 'string';
  }

  private isOperatorInEnum(operator: string | undefined, enumObject: any): boolean {
    return Object.values(enumObject).includes(operator);
  }

  toJSON(options?: any) {
    const condition = this.get('condition');
    if (typeof condition === 'object') {
      const json = JSON.parse(JSON.stringify(condition));
      return json;
    }

    return condition;
  }
}
