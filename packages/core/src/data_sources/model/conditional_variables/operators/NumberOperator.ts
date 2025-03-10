import { Operator } from './BaseOperator';

export enum NumberOperation {
  greaterThan = '>',
  lessThan = '<',
  greaterThanOrEqual = '>=',
  lessThanOrEqual = '<=',
  equals = '=',
  notEquals = '!=',
}

export class NumberOperator extends Operator<NumberOperation> {
  evaluate(left: number, right: number): boolean {
    switch (this.operation) {
      case NumberOperation.greaterThan:
        return left > right;
      case NumberOperation.lessThan:
        return left < right;
      case NumberOperation.greaterThanOrEqual:
        return left >= right;
      case NumberOperation.lessThanOrEqual:
        return left <= right;
      case NumberOperation.equals:
        return left === right;
      case NumberOperation.notEquals:
        return left !== right;
      default:
        this.em.logError(`Unsupported number operation: ${this.operation}`);
        return false;
    }
  }
}
