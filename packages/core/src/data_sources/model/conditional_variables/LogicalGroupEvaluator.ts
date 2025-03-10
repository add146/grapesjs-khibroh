import EditorModel from '../../../editor/model/Editor';
import { DataConditionEvaluator, ConditionProps } from './DataConditionEvaluator';
import { BooleanOperator } from './operators/BooleanOperator';

export class LogicalGroupEvaluator {
  private em: EditorModel;

  constructor(
    private operator: BooleanOperator,
    private statements: ConditionProps[],
    opts: { em: EditorModel },
  ) {
    this.em = opts.em;
  }

  evaluate(): boolean {
    const results = this.statements.map((statement) => {
      const condition = new DataConditionEvaluator({ condition: statement }, { em: this.em });
      return condition.evaluate();
    });
    return this.operator.evaluate(results);
  }
}
