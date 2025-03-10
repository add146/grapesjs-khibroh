import EditorModel from '../../../../editor/model/Editor';
import { DataConditionOperation } from './types';

export abstract class Operator<OperationType extends DataConditionOperation> {
  protected em: EditorModel;
  protected operation: OperationType;

  constructor(operation: any, opts: { em: EditorModel }) {
    this.operation = operation;
    this.em = opts.em;
  }

  abstract evaluate(left: any, right: any): boolean;
}
