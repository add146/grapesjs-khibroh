import { Operator } from './BaseOperator';

export enum BooleanOperation {
  and = 'and',
  or = 'or',
  xor = 'xor',
}

export class BooleanOperator extends Operator<BooleanOperation> {
  evaluate(statements: boolean[]): boolean {
    if (!statements?.length) return false;

    switch (this.operation) {
      case BooleanOperation.and:
        return statements.every(Boolean);
      case BooleanOperation.or:
        return statements.some(Boolean);
      case BooleanOperation.xor:
        return statements.filter(Boolean).length === 1;
      default:
        this.em.logError(`Unsupported boolean operation: ${this.operation}`);
        return false;
    }
  }
}
