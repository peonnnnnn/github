/** @babel */

import compareSets from 'compare-sets'

import MultiList from './multi-list'

export default class MultiListCollection {
  constructor (lists, didChangeSelection) {
    this.list = new MultiList(lists, (item, key) => {
      // QUESTION: remove this and just rely on multi-list item and key
      // this.lastSelectedItem = item
      // this.lastSelectedKey = key
      didChangeSelection && didChangeSelection(item, key)
    })
    const key = this.list.getSelectedListKey()
    const item = this.list.getSelectedItem()
    this.tail = {item, key}
    // QUESTION: remove this and just rely on multi-list item and key
    // this.lastSelectedItem = selectedItem
    // this.lastSelectedKey = selectedKey
    this.selectedKeys = new Set(key ? [key] : [])
    this.selectedItems = new Set(item ? [item] : [])
  }

  updateLists (lists, {suppressCallback} = {}) {
    this.list.updateLists(lists, {suppressCallback})
    this.updateSelections()
  }

  clearSelectedItems () {
    this.selectedItems = new Set()
  }

  clearSelectedKeys () {
    this.selectedKeys = new Set()
  }

  getTail () {
    return this.tail
  }

  getSelectedItems () {
    return this.selectedItems
  }

  getSelectedKeys () {
    return this.selectedKeys
  }

  getItemsForKey (key) {
    return this.list.getItemsForKey(key)
  }

  getLastSelectedListKey () {
    // return this.lastSelectedKey
    return this.list.getSelectedKey()
  }

  getLastSelectedItem () {
    // return this.lastSelectedItem
    return this.list.getSelectedItem()
  }

  selectNextList ({wrap, addToExisting} = {}) {
    this.list.selectNextList({wrap})
    this.updateSelections({addToExisting})
  }

  selectPreviousList ({wrap, addToExisting} = {}) {
    this.list.selectPreviousList({wrap})
    this.updateSelections({addToExisting})
  }

  selectNextItem ({addToExisting, stopAtBounds} = {}) {
    this.list.selectNextItem({stopAtBounds})
    this.updateSelections({addToExisting})
  }

  selectPreviousItem ({addToExisting, stopAtBounds} = {}) {
    this.list.selectPreviousItem({stopAtBounds})
    this.updateSelections({addToExisting})
  }

  updateSelections ({addToExisting} = {}) {
    const selectedKey = this.getLastSelectedListKey()
    const selectedItem = this.getLastSelectedItem()
    this.selectItem(selectedItem, {tail: true, addToExisting, suppressCallback: true})
    this.selectKey(selectedKey, {addToExisting, suppressCallback: true})
  }

  selectItems (items, {addToExisting} = {}) {
    if (!addToExisting) this.clearSelectedItems()
    items.forEach(item => this.selectedItems.add(item))
    this.list.selectItem(items[items.length - 1], {suppressCallback: this.selectedItems.size === 1})
  }

  selectKeys (keys, {addToExisting, suppressCallback} = {}) {
    if (!addToExisting) this.clearSelectedKeys()
    keys.forEach(key => this.selectedKeys.add(key))
    this.list.selectListForKey(keys[keys.length - 1], {suppressCallback})
  }

  foo (item) {
    if (this.selectedItems.has(item)) {
      toggleItemForKey()
    } else {

    }
    selectItemForKey()
  }

  selectItemForKey (item, key, {tail, addToExisting} = {}) {
    if (!this.getItemsForKey(key).includes(item)) throw new Error(`item ${item} not found for key ${key}`)
    if (!addToExisting) {
      this.clearSelectedItems()
      this.clearSelectedKeys()
      this.tail = null
    }
    if (tail || !this.tail) this.tail = {key, item}
    this.selectItemsAndKeysInRange(this.tail, {key, item})
  }

  toggleItemForKey (item, key) {
    const itemsForKey = this.getItemsForKey(key)
    if (!itemsForKey.includes(item)) throw new Error(`item ${item} not found for key ${key}`)
    const intersection = compareSets(this.selectedItems, new Set(itemsForKey))
    if (intersection.has(item)) {
      this.selectedItems.delete(item)
      if (intersection.size === 1) this.selectedKeys.delete(key)
    } else {
      this.selectItems([item], {addToExisting: true})
      this.selectKeys([key], {addToExisting: true})
    }
    if (this.selectedItems.size === 0) this.tail = null
  }

  selectAllItemsForKey (key, addToExisting) {
    this.selectKeys([key], {addToExisting})
    this.selectItems(this.list.getItemsForKey(key), {addToExisting})
  }

  selectFirstItemForKey (key, {addToExisting} = {}) {
    this.selectKeys([key], {addToExisting})
    this.selectItems([this.list.getItemsForKey(key)[0]], {addToExisting})
  }

  selectItemsAndKeysInRange (endPoint1, endPoint2) {
    // TODO: optimize
    const listKeys = this.list.getListKeys()
    const index1 = listKeys.indexOf(endPoint1.key)
    const index2 = listKeys.indexOf(endPoint2.key)

    if (index1 < 0) throw new Error(`key "${endPoint1.key}" not found`)
    if (index2 < 0) throw new Error(`key "${endPoint2.key}" not found`)
    let startPoint, endPoint, startKeyIndex, endKeyIndex
    if (index1 < index2) {
      startPoint = endPoint1
      endPoint = endPoint2
      startKeyIndex = index1
      endKeyIndex = index2
    } else {
      startPoint = endPoint2
      endPoint = endPoint1
      startKeyIndex = index2
      endKeyIndex = index1
    }
    const startItemIndex = this.list.getItemIndexForKey(startPoint.key, startPoint.item)
    const endItemIndex = this.list.getItemIndexForKey(endPoint.key, endPoint.item)
    if (startItemIndex < 0) throw new Error(`item "${startPoint.item}" not found`)
    if (endItemIndex < 0) throw new Error(`item "${endPoint.item}" not found`)

    if (startKeyIndex === endKeyIndex) {
      const items = this.list.getItemsForKey(listKeys[startKeyIndex])
      const indexes = [startItemIndex, endItemIndex].sort()
      this.selectKeys([startPoint.key], {addToExisting: true, suppressCallback: true})
      this.selectItems(items.slice(indexes[0], indexes[1] + 1), {addToExisting: true})
      return
    }

    for (let i = startKeyIndex; i <= endKeyIndex; i++) {
      const key = listKeys[i]
      this.selectKeys([key], {addToExisting: true, suppressCallback: true})
      const items = this.list.getItemsForKey(key)
      if (i === startKeyIndex) {
        this.selectItems(items.slice(startItemIndex), {addToExisting: true})
      } else if (i === endKeyIndex) {
        this.selectItems(items.slice(0, endItemIndex + 1), {addToExisting: true})
      } else {
        this.selectItems(items, {addToExisting: true})
      }
    }
  }
}
