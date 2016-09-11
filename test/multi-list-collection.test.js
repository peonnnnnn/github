/** @babel */

import MultiListCollection from '../lib/multi-list-collection'

describe('MultiListCollection', () => {
  it.only('selectItemForKey(item, key, {tail, addToExisting})', () => {
    const mlc = new MultiListCollection([
      { key: 'list1', items: ['a', 'b', 'c'] },
      { key: 'list2', items: ['d', 'e'] },
      { key: 'list3', items: ['f', 'g', 'h'] }
    ])

    // initially tail is first item
    assert.deepEqual(mlc.getTail(), {key: 'list1', item: 'a'})

    // tail is set to 'b'
    mlc.selectItemForKey('b', 'list1')
    assert.deepEqual(mlc.getTail(), {key: 'list1', item: 'b'})
    assert.deepEqual([...mlc.getSelectedItems()], ['b'])

    // addToExisting
    mlc.selectItemForKey('e', 'list2', {addToExisting: true})
    assert.deepEqual(mlc.getTail(), {key: 'list1', item: 'b'})
    assert.deepEqual([...mlc.getSelectedItems()], ['b', 'c', 'd', 'e'])

    mlc.selectItemForKey('d', 'list2', {addToExisting: true})
    assert.deepEqual(mlc.getTail(), {key: 'list1', item: 'b'})
    assert.deepEqual([...mlc.getSelectedItems()], ['b', 'c', 'd'])

    // create new tail and addToExisting
    mlc.selectItemForKey('f', 'list3', {tail: true, addToExisting: true})
    assert.deepEqual(mlc.getTail(), {key: 'list3', item: 'f'})
    assert.deepEqual([...mlc.getSelectedItems()], ['b', 'c', 'd', 'f'])

    // addToExisting
    mlc.selectItemForKey('h', 'list3', {addToExisting: true})
    assert.deepEqual(mlc.getTail(), {key: 'list3', item: 'f'})
    assert.deepEqual([...mlc.getSelectedItems()], ['b', 'c', 'd', 'f', 'g', 'h'])

    // addToExisting
    mlc.selectItemForKey('g', 'list3', {addToExisting: true})
    assert.deepEqual(mlc.getTail(), {key: 'list3', item: 'f'})
    assert.deepEqual([...mlc.getSelectedItems()], ['b', 'c', 'd', 'f', 'g'])

    // new tail without addToExisting
    mlc.selectItemForKey('e', 'list2', {tail: true})
    assert.deepEqual(mlc.getTail(), {key: 'list2', item: 'e'})
    assert.deepEqual([...mlc.getSelectedItems()], ['e'])
  })

  // toggleItemForKey
    // when this.tail should be set to null

  describe('selectItemsAndKeysInRange(endPoint1, endPoint2)', () => {
    it('takes endpoints ({key, item}) and returns an array of items between those points', () => {
      const mlc = new MultiListCollection([
        { key: 'list1', items: ['a', 'b', 'c'] },
        { key: 'list2', items: ['d', 'e'] },
        { key: 'list3', items: ['f', 'g', 'h'] }
      ])

      mlc.selectItemsAndKeysInRange({key: 'list1', item: 'b'}, {key: 'list1', item: 'c'})
      assert.deepEqual([...mlc.getSelectedItems()], ['b', 'c'])
      assert.deepEqual([...mlc.getSelectedKeys()], ['list1'])

      // endpoints can be specified in any order
      mlc.selectItemsAndKeysInRange({key: 'list1', item: 'c'}, {key: 'list1', item: 'b'})
      assert.deepEqual([...mlc.getSelectedItems()], ['b', 'c'])
      assert.deepEqual([...mlc.getSelectedKeys()], ['list1'])

      // endpoints can be in different lists
      mlc.selectItemsAndKeysInRange({key: 'list1', item: 'c'}, {key: 'list3', item: 'g'})
      assert.deepEqual([...mlc.getSelectedItems()], ['c', 'd', 'e', 'f', 'g'])
      assert.deepEqual([...mlc.getSelectedKeys()], ['list1', 'list2', 'list3'])

      mlc.selectItemsAndKeysInRange({key: 'list3', item: 'g'}, {key: 'list1', item: 'c'})
      assert.deepEqual([...mlc.getSelectedItems()], ['c', 'd', 'e', 'f', 'g'])
      assert.deepEqual([...mlc.getSelectedKeys()], ['list1', 'list2', 'list3'])

      // endpoints can be the same
      mlc.selectItemsAndKeysInRange({key: 'list1', item: 'c'}, {key: 'list1', item: 'c'})
      assert.deepEqual([...mlc.getSelectedItems()], ['c'])
      assert.deepEqual([...mlc.getSelectedKeys()], ['list1'])
    })

    it('throws error when keys or items aren\'t found', () => {
      const mlc = new MultiListCollection([
        { key: 'list1', items: ['a', 'b', 'c'] }
      ])

      assert.throws(() => {
        mlc.selectItemsAndKeysInRange({key: 'non-existent-key', item: 'b'}, {key: 'list1', item: 'c'})
      }, 'key "non-existent-key" not found')

      assert.throws(() => {
        mlc.selectItemsAndKeysInRange({key: 'list1', item: 'b'}, {key: 'non-existent-key', item: 'c'})
      }, 'key "non-existent-key" not found')

      assert.throws(() => {
        mlc.selectItemsAndKeysInRange({key: 'list1', item: 'x'}, {key: 'list1', item: 'c'})
      }, 'item "x" not found')

      assert.throws(() => {
        mlc.selectItemsAndKeysInRange({key: 'list1', item: 'b'}, {key: 'list1', item: 'x'})
      }, 'item "x" not found')
    })
  })
})
