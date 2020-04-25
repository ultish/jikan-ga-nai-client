import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | tracker/day', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:tracker/day');
    assert.ok(route);
  });
});
