/**{START_EVENTS}*/
export enum DeviceEvents {
  /**
   * @event `device:add` New device added to the collection. The `Device` is passed as an argument.
   * @example
   * editor.on('device:add', ({device}) => { ... });
   */
  add = 'device:add',

  /**
   * @event `device:add:before` Event triggered before a new device is added.
   * @example
   * editor.on('device:add:before', ({device}) => { ... });
   */
  addBefore = 'device:add:before',

  /**
   * @event `device:remove` Device removed from the collection. The `Device` is passed as an argument.
   * @example
   * editor.on('device:remove', ({device}) => { ... });
   */
  remove = 'device:remove',

  /**
   * @event `device:remove:before` Event triggered before a device is removed.
   * @example
   * editor.on('device:remove:before', ({device}) => { ... });
   */
  removeBefore = 'device:remove:before',

  /**
   * @event `device:select` A new device is selected. The `Device` is passed as an argument.
   * @example
   * editor.on('device:select', ({device}) => { ... });
   */
  select = 'device:select',

  /**
   * @event `device:select:before` Event triggered before a new device is selected.
   * @example
   * editor.on('device:select:before', ({device}) => { ... });
   */
  selectBefore = 'device:select:before',

  /**
   * @event `device:update` Device updated. The `Device` and the object containing changes are passed as arguments.
   * @example
   * editor.on('device:update', ({device}) => { ... });
   */
  update = 'device:update',

  /**
   * @event `device` Catch-all event for all the events mentioned above.
   * @example
   * editor.on('device', ({ event, model, ... }) => { ... });
   */
  all = 'device',
}
/**{END_EVENTS}*/

// This is necessary to prevent the TS documentation generator from breaking.
export default DeviceEvents;
