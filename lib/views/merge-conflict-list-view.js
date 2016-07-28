/** @babel */
/** @jsx etch.dom */

import etch from 'etch'

const statusMap = {
  A: 'added',
  M: 'modified',
  D: 'removed',
  E: 'ignored'
}

export default class MergeConflictListView {
  constructor (props) {
    this.props = props
    etch.initialize(this)
  }

  didClickItem (e, index) {
    const item = this.props.items[index]
    if (e.detail === 1) {
      this.props.didSelectItem(item)
      return etch.update(this)
    } else if (e.detail === 2) {
      this.props.didConfirmItem(item)
    }
  }

  update (props) {
    this.props = props
    return etch.update(this)
  }

  render () {
    return (
      <div className='git-FilePatchListView'>
        {this.props.items.map((item, index) => {
          const status = statusMap[item.getFileStatus()]
          const className = this.props.selectedIndex === index ? 'is-selected' : ''
          return (
            <div className={`git-FilePatchListView-item is-${status} ${className}`} onclick={(e) => this.didClickItem(e, index)}>
              <span className={`git-FilePatchListView-icon icon icon-diff-${status} status-${status}`} />
              <span className='git-FilePatchListView-path'>{item.getPath()}</span>
              <span className={'git-FilePatchListView ours-theirs-info'}> {item.getOursStatus()}{item.getTheirsStatus()} </span>
            </div>
          )
        })}
      </div>
    )
  }

  destroy () {
    etch.destroy(this)
  }
}