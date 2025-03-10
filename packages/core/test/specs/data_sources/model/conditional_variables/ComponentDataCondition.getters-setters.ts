import { Component, DataSourceManager, Editor } from '../../../../../src';
import { DataVariableType } from '../../../../../src/data_sources/model/DataVariable';
import ComponentDataCondition from '../../../../../src/data_sources/model/conditional_variables/ComponentDataCondition';
import { DataConditionType } from '../../../../../src/data_sources/model/conditional_variables/DataCondition';
import { AnyTypeOperation } from '../../../../../src/data_sources/model/conditional_variables/operators/AnyTypeOperator';
import { NumberOperation } from '../../../../../src/data_sources/model/conditional_variables/operators/NumberOperator';
import ComponentDataConditionView from '../../../../../src/data_sources/view/ComponentDataConditionView';
import ComponentWrapper from '../../../../../src/dom_components/model/ComponentWrapper';
import EditorModel from '../../../../../src/editor/model/Editor';
import { setupTestEditor } from '../../../../common';

describe('ComponentDataCondition Setters', () => {
  let editor: Editor;
  let em: EditorModel;
  let dsm: DataSourceManager;
  let cmpRoot: ComponentWrapper;

  beforeEach(() => {
    ({ editor, em, dsm, cmpRoot } = setupTestEditor());
  });

  afterEach(() => {
    em.destroy();
  });

  it('should update the condition using setCondition', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 0,
        operator: NumberOperation.greaterThan,
        right: -1,
      },
      ifTrue: '<h1>some text</h1>',
      ifFalse: '<h1>false text</h1>',
    })[0] as ComponentDataCondition;

    const newCondition = {
      left: 1,
      operator: NumberOperation.lessThan,
      right: 0,
    };

    component.setCondition(newCondition);
    expect(component.getCondition()).toEqual(newCondition);
    expect(component.getInnerHTML()).toBe('<h1>false text</h1>');
  });

  it('should update the ifTrue value using setIfTrue', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 0,
        operator: NumberOperation.greaterThan,
        right: -1,
      },
      ifTrue: '<h1>some text</h1>',
      ifFalse: '<h1>false text</h1>',
    })[0] as ComponentDataCondition;

    const newIfTrue = '<h1>new true text</h1>';
    component.setIfTrue(newIfTrue);
    expect(component.getIfTrue()).toEqual(newIfTrue);
    expect(component.getInnerHTML()).toBe(newIfTrue);
  });

  it('should update the ifFalse value using setIfFalse', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 0,
        operator: NumberOperation.greaterThan,
        right: -1,
      },
      ifTrue: '<h1>some text</h1>',
      ifFalse: '<h1>false text</h1>',
    })[0] as ComponentDataCondition;

    const newIfFalse = '<h1>new false text</h1>';
    component.setIfFalse(newIfFalse);
    expect(component.getIfFalse()).toEqual(newIfFalse);

    component.setCondition({
      left: 0,
      operator: NumberOperation.lessThan,
      right: -1,
    });
    expect(component.getInnerHTML()).toBe(newIfFalse);
  });

  it('should update the data sources and re-evaluate the condition', () => {
    const dataSource = {
      id: 'ds1',
      records: [
        { id: 'left_id', left: 'Name1' },
        { id: 'right_id', right: 'Name1' },
      ],
    };
    dsm.add(dataSource);

    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: {
          type: DataVariableType,
          path: 'ds1.left_id.left',
        },
        operator: AnyTypeOperation.equals,
        right: {
          type: DataVariableType,
          path: 'ds1.right_id.right',
        },
      },
      ifTrue: '<h1>True value</h1>',
      ifFalse: '<h1>False value</h1>',
    })[0] as ComponentDataCondition;

    expect(component.getInnerHTML()).toBe('<h1>True value</h1>');

    changeDataSourceValue(dsm, 'Different value');
    expect(component.getInnerHTML()).toBe('<h1>False value</h1>');

    changeDataSourceValue(dsm, 'Name1');
    expect(component.getInnerHTML()).toBe('<h1>True value</h1>');
  });

  it('should re-render the component when condition, ifTrue, or ifFalse changes', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 0,
        operator: NumberOperation.greaterThan,
        right: -1,
      },
      ifTrue: '<h1>some text</h1>',
      ifFalse: '<h1>false text</h1>',
    })[0] as ComponentDataCondition;

    const componentView = component.getView() as ComponentDataConditionView;

    component.setIfTrue('<h1>new true text</h1>');
    expect(componentView.el.innerHTML).toContain('new true text');

    component.setIfFalse('<h1>new false text</h1>');
    component.setCondition({
      left: 0,
      operator: NumberOperation.lessThan,
      right: -1,
    });
    expect(componentView.el.innerHTML).toContain('new false text');
  });
});

function changeDataSourceValue(dsm: DataSourceManager, newValue: string) {
  dsm.get('ds1').getRecord('left_id')?.set('left', newValue);
}
