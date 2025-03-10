import { Operator } from './operators/BaseOperator';
import { DataConditionOperation } from './operators/types';

export class ConditionStatement {
  constructor(
    private leftValue: any,
    private operator: Operator<DataConditionOperation>,
    private rightValue: any,
  ) {}

  evaluate(): boolean {
    return this.operator.evaluate(this.leftValue, this.rightValue);
  }
}
