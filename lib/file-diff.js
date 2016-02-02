/** @babel */

import path from 'path'
import DiffHunk from './diff-hunk'
import HunkLine from './hunk-line'
import {createObjectsFromString} from './common'

// FileDiff contains diff information for a single file. It holds a list of
// DiffHunk objects.
export default class FileDiff {
  constructor(options) {
    this.hunks = []
    this.setOldPathName('unknown')
    this.setNewPathName('unknown')
    this.setChangeStatus('modified')
  }

  getHunks() { return this.hunks }

  getOldFileName() { return path.basename(this.getOldPathName()) }

  getOldPathName() { return this.oldPathName }

  setOldPathName(oldPathName) {
    this.oldPathName = oldPathName
  }

  getNewFileName() { return path.basename(this.getNewPathName()) }

  getNewPathName() { return this.newPathName }

  setNewPathName(newPathName) {
    this.newPathName = newPathName
  }

  size() { return this.size }

  getChangeStatus() {
    if (this.isAdded())
      return 'added'
    else if (this.isDeleted())
      return 'deleted'
    else if (this.isRenamed())
      return 'renamed'
    else
      return 'modified'
  }

  setChangeStatus(changeStatus) {
    switch (changeStatus) {
      case 'added':
        this.added = true
        this.renamed = false
        this.deleted = false
        break;
      case 'deleted':
        this.added = false
        this.renamed = false
        this.deleted = true
        break;
      case 'reamed':
        this.added = false
        this.renamed = true
        this.deleted = false
        break;
      case 'modified':
        this.added = false
        this.renamed = false
        this.deleted = false
        break;
    }
  }

  stage() {
    for (let hunk of this.hunks)
      hunk.stage()
  }

  unstage() {
    for (let hunk of this.hunks)
      hunk.unstage()
  }

  getStageStatus() {
    // staged, unstaged, partial
    let hasStaged = false
    let hasUnstaged = false
    for (let hunk of this.hunks) {
      let stageStatus = hunk.getStageStatus()
      if (stageStatus == 'partial')
        return 'partial'
      else if (stageStatus == 'staged')
        hasStaged = true
      else
        hasUnstaged = true
    }

    if (hasStaged && hasUnstaged)
      return 'partial'
    else if (hasStaged)
      return 'staged'
    return 'unstaged'
  }

  isRenamed() { return this.renamed }

  isAdded() { return this.added }

  isUntracked() { return this.untracked }

  isDeleted() { return this.deleted }

  toString() {
    let hunks = this.hunks.map((hunk) => { return hunk.toString() }).join('\n');
    return `FILE ${this.getNewPathName()} - ${this.getChangeStatus()} - ${this.getStageStatus()}\n${hunks}`
  }

  static fromString(diffStr) {
    let metadata = /FILE (.+) - (.+) - (.+)/.exec(diffStr.trim().split('\n')[0])
    if (!metadata) return null;

    let [__, pathName, changeStatus, stagedStatus] = metadata
    let hunks = createObjectsFromString(diffStr, 'HUNK', DiffHunk)

    let fileDiff = new FileDiff()
    fileDiff.setNewPathName(pathName)
    fileDiff.setOldPathName(pathName)
    fileDiff.setChangeStatus(changeStatus)
    fileDiff.hunks = hunks

    return fileDiff
  }

  async calculateHunks(hunks, stagedLines) {
    const resultHunks = []
    let lineIndex = 0
    let lineOffset = 0
    for (const hunk of hunks) {
      const containedLines = []
      if (lineIndex < stagedLines.length) {
        const line = stagedLines[lineIndex]
        // We need to translate the line number from the staged diff to the
        // unified diff.
        const adjustedLineNumber = (line.isAddition() ? line.getNewLineNumber() : line.getOldLineNumber()) + lineOffset
        const lineStart = hunk.hunk.newStart()
        const lineEnd = hunk.hunk.newStart() + hunk.hunk.newLines()
        console.log(`${adjustedLineNumber}: ${lineStart} - ${lineEnd}`)
        if (adjustedLineNumber >= lineStart && adjustedLineNumber <= lineEnd) {
          if (line.isAddition()) {
            line.newLineNumber = adjustedLineNumber
          } else {
            line.oldLineNumber = adjustedLineNumber
          }

          containedLines.push(line)
          lineIndex++
        }

        lineOffset += hunk.hunk.newLines() - hunk.hunk.oldLines()
      }

      const diffHunk = new DiffHunk()
      await diffHunk.fromGitUtilsObject({hunk, stagedLines: containedLines, diff: this})
      resultHunks.push(diffHunk)
    }

    return resultHunks
  }

  async fromGitUtilsObject({diff, stagedDiff}) {
    if (!diff) return;

    this.oldPathName = diff.oldFile().path()
    this.newPathName = diff.newFile().path()
    this.size = diff.size()
    this.renamed = diff.isRenamed()
    this.added = diff.isAdded()
    this.untracked = diff.isUntracked()
    this.deleted = diff.isDeleted()

    let stagedLines = []
    if (stagedDiff) {
      // TODO: This all happens sequentially which is a bit of a bummer.
      const hunks = await stagedDiff.hunks()
      for (const hunk of hunks) {
        const lines = await hunk.lines()
        stagedLines = stagedLines.concat(lines)
      }
    }

    stagedLines = stagedLines
      .map(line => HunkLine.fromGitUtilsObject({line}))
      .filter(line => line.isChanged())

    const hunks = await diff.hunks()
    this.hunks = await this.calculateHunks(hunks, stagedLines)
  }
}
