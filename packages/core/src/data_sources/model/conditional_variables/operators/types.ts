import { AnyTypeOperation } from './AnyTypeOperator';
import { BooleanOperation } from './BooleanOperator';
import { NumberOperation } from './NumberOperator';
import { StringOperation } from './StringOperator';

export type DataConditionOperation = AnyTypeOperation | StringOperation | NumberOperation | BooleanOperation;
