/** @babel */

import {copyRepositoryDir, buildRepository} from '../helpers'
import path from 'path'
import fs from 'fs'
import sinon from 'sinon'

import StagingView, {ListTypes} from '../../lib/views/staging-view'

const getSelectedItemForStagedList = (view) => {
  return view.multiList.getSelectedItemForList(1)
}

const getSelectedItemForUnstagedList = (view) => {
  return view.multiList.getSelectedItemForList(0)
}

describe('StagingView', () => {
  describe('staging and unstaging files', () => {
    it('renders staged and unstaged files', async () => {
      const workdirPath = await copyRepositoryDir(1)
      const repository = await buildRepository(workdirPath)
      fs.writeFileSync(path.join(workdirPath, 'a.txt'), 'a change\n')
      fs.unlinkSync(path.join(workdirPath, 'b.txt'))
      const filePatches = await repository.getUnstagedChanges()
      const view = new StagingView({repository, stagedChanges: [], unstagedChanges: filePatches})
      const {stagedChangesView, unstagedChangesView} = view.refs
      assert.deepEqual(stagedChangesView.props.filePatches, [])
      assert.deepEqual(unstagedChangesView.props.filePatches, filePatches)

      await view.update({repository, stagedChanges: [filePatches[1]], unstagedChanges: [filePatches[0]]})
      assert.deepEqual(stagedChangesView.props.filePatches, [filePatches[1]])
      assert.deepEqual(unstagedChangesView.props.filePatches, [filePatches[0]])

      await view.update({repository, stagedChanges: [], unstagedChanges: filePatches})
      assert.deepEqual(stagedChangesView.props.filePatches, [])
      assert.deepEqual(unstagedChangesView.props.filePatches, filePatches)
    })

    describe('toggleSelectedFilePatchStagingState()', () => {
      it('calls stageFilePatch or unstageFilePatch depending on the current staging state of the toggled file patch', async () => {
        const workdirPath = await copyRepositoryDir(1)
        const repository = await buildRepository(workdirPath)
        fs.writeFileSync(path.join(workdirPath, 'a.txt'), 'a change\n')
        fs.unlinkSync(path.join(workdirPath, 'b.txt'))
        const filePatches = await repository.getUnstagedChanges()
        const stageFilePatch = sinon.spy()
        const unstageFilePatch = sinon.spy()
        const view = new StagingView({repository, stagedChanges: [], unstagedChanges: filePatches, stageFilePatch, unstageFilePatch})
        const {stagedChangesView, unstagedChangesView} = view.refs

        unstagedChangesView.didSelectFilePatch(filePatches[1])
        view.toggleSelectedFilePatchStagingState()
        assert.deepEqual(stageFilePatch.args[0], [filePatches[1]])

        await view.update({repository, stagedChanges: [filePatches[1]], unstagedChanges: [filePatches[0]], stageFilePatch, unstageFilePatch})
        stagedChangesView.didSelectFilePatch(filePatches[1])
        view.toggleSelectedFilePatchStagingState()
        assert.deepEqual(unstageFilePatch.args[0], [filePatches[1]])
      })
    })
  })

  describe('focusing lists', () => {
    describe('when lists are not empty', () => {
      let view
      beforeEach(async () => {
        const workdirPath = await copyRepositoryDir(1)
        const repository = await buildRepository(workdirPath)
        fs.writeFileSync(path.join(workdirPath, 'a.txt'), 'a change\n')
        fs.unlinkSync(path.join(workdirPath, 'b.txt'))
        const filePatches = await repository.getUnstagedChanges()
        view = new StagingView({repository, stagedChanges: [filePatches[0]], unstagedChanges: [filePatches[1]]})
      })

      it('focuses staged and unstaged lists accordingly', async () => {
        await view.selectList(ListTypes.STAGED)
        assert.equal(view.getSelectedList(), ListTypes.STAGED)
        let selectedLists = view.element.querySelectorAll('.git-StagingView-group.is-focused .git-StagingView-header')
        assert.equal(selectedLists.length, 1)
        assert.equal(selectedLists[0].textContent, 'Staged Changes')

        await view.selectList(ListTypes.UNSTAGED)
        assert.equal(view.getSelectedList(), ListTypes.UNSTAGED)
        selectedLists = view.element.querySelectorAll('.git-StagingView-group.is-focused .git-StagingView-header')
        assert.equal(selectedLists.length, 1)
        assert.equal(selectedLists[0].textContent, 'Unstaged Changes')

        await view.selectList(ListTypes.STAGED)
        assert.equal(view.getSelectedList(), ListTypes.STAGED)
        selectedLists = view.element.querySelectorAll('.git-StagingView-group.is-focused .git-StagingView-header')
        assert.equal(selectedLists.length, 1)
        assert.equal(selectedLists[0].textContent, 'Staged Changes')
      })

      describe('git:focus-unstaged-changes', () => {
        it('sets the unstaged list to be focused', () => {
          view.selectList(ListTypes.STAGED)
          assert.equal(view.getSelectedList(), ListTypes.STAGED)

          atom.commands.dispatch(view.element, 'git:focus-unstaged-changes')
          assert.equal(view.getSelectedList(), ListTypes.UNSTAGED)
        })
      })

      describe('git:focus-staged-changes', () => {
        it('sets the unstaged list to be focused', () => {
          view.selectList(ListTypes.UNSTAGED)
          assert.equal(view.getSelectedList(), ListTypes.UNSTAGED)

          atom.commands.dispatch(view.element, 'git:focus-staged-changes')
          assert.equal(view.getSelectedList(), ListTypes.STAGED)
        })
      })
    })

    describe('when list is empty', () => {
      it('doesn\'t select list', async () => {
        const workdirPath = await copyRepositoryDir(1)
        const repository = await buildRepository(workdirPath)
        fs.writeFileSync(path.join(workdirPath, 'a.txt'), 'a change\n')
        const filePatches = await repository.getUnstagedChanges()
        const view = new StagingView({repository, stagedChanges: [], unstagedChanges: filePatches})
        const {stagedChangesView, unstagedChangesView} = view.refs

        await view.selectList(ListTypes.UNSTAGED)
        assert.equal(view.getSelectedList(), ListTypes.UNSTAGED)

        await view.selectList(ListTypes.STAGED)
        assert.notEqual(view.getSelectedList(), ListTypes.STAGED)
        assert.equal(view.getSelectedList(), ListTypes.UNSTAGED)
      })
    })
  })

  describe('selecting files', () => {
    describe('selectNextFilePatch() and selectPreviousFilePatch()', () => {
      it('selects next/previous staged filePatch if there is one, crossing the boundary between the unstaged and staged files if necessary', async () => {
        const workdirPath = await copyRepositoryDir(1)
        const repository = await buildRepository(workdirPath)
        fs.writeFileSync(path.join(workdirPath, 'a.txt'), 'a change\n')
        fs.unlinkSync(path.join(workdirPath, 'b.txt'))
        fs.writeFileSync(path.join(workdirPath, 'c.txt'), 'another change\n')
        fs.writeFileSync(path.join(workdirPath, 'd.txt'), 'new file 1\n')
        fs.writeFileSync(path.join(workdirPath, 'e.txt'), 'new file 2\n')
        fs.writeFileSync(path.join(workdirPath, 'f.txt'), 'new file 3\n')
        const filePatches = await repository.getUnstagedChanges()
        await repository.applyPatchToIndex(filePatches[0])
        await repository.applyPatchToIndex(filePatches[1])
        await repository.applyPatchToIndex(filePatches[2])
        const stagedFilePatches = await repository.getStagedChanges()
        const unstagedFilePatches = await repository.getUnstagedChanges()
        const view = new StagingView({repository, stagedChanges: stagedFilePatches, unstagedChanges: unstagedFilePatches})

        assert.equal(view.getSelectedList(), ListTypes.UNSTAGED)
        assert.equal(getSelectedItemForUnstagedList(view), unstagedFilePatches[0])

        view.selectPreviousFilePatch()
        assert.equal(view.getSelectedList(), ListTypes.UNSTAGED)
        assert.equal(getSelectedItemForUnstagedList(view), unstagedFilePatches[0])

        view.selectNextFilePatch()
        assert.equal(view.getSelectedList(), ListTypes.UNSTAGED)
        assert.deepEqual(getSelectedItemForUnstagedList(view), unstagedFilePatches[1])

        view.selectNextFilePatch()
        assert.equal(view.getSelectedList(), ListTypes.UNSTAGED)
        assert.deepEqual(getSelectedItemForUnstagedList(view), unstagedFilePatches[2])

        view.selectNextFilePatch()
        assert.equal(view.getSelectedList(), ListTypes.STAGED)
        assert.deepEqual(getSelectedItemForStagedList(view), stagedFilePatches[0])

        view.selectNextFilePatch()
        assert.equal(view.getSelectedList(), ListTypes.STAGED)
        assert.deepEqual(getSelectedItemForStagedList(view), stagedFilePatches[1])

        view.selectNextFilePatch()
        assert.equal(view.getSelectedList(), ListTypes.STAGED)
        assert.deepEqual(getSelectedItemForStagedList(view), stagedFilePatches[2])

        view.selectNextFilePatch()
        assert.equal(view.getSelectedList(), ListTypes.STAGED)
        assert.deepEqual(getSelectedItemForStagedList(view), stagedFilePatches[2])

        view.selectPreviousFilePatch()
        assert.equal(view.getSelectedList(), ListTypes.STAGED)
        assert.deepEqual(getSelectedItemForStagedList(view), stagedFilePatches[1])

        view.selectPreviousFilePatch()
        assert.equal(view.getSelectedList(), ListTypes.STAGED)
        assert.deepEqual(getSelectedItemForStagedList(view), stagedFilePatches[0])

        view.selectPreviousFilePatch()
        assert.equal(view.getSelectedList(), ListTypes.UNSTAGED)
        assert.deepEqual(getSelectedItemForUnstagedList(view), unstagedFilePatches[2])
      })
    })

    it('calls didSelectFilePatch when a file patch is selected via the mouse or keyboard', async () => {
      const didSelectFilePatch = sinon.spy()

      const workdirPath = await copyRepositoryDir(1)
      const repository = await buildRepository(workdirPath)
      fs.writeFileSync(path.join(workdirPath, 'a.txt'), 'a change\n')
      fs.unlinkSync(path.join(workdirPath, 'b.txt'))
      fs.writeFileSync(path.join(workdirPath, 'c.txt'), 'another change\n')
      const filePatches = await repository.getUnstagedChanges()
      await repository.applyPatchToIndex(filePatches[0])
      await repository.applyPatchToIndex(filePatches[1])
      const stagedChanges = await repository.getStagedChanges()
      const unstagedChanges = await repository.getUnstagedChanges()

      const view = new StagingView({repository, stagedChanges, unstagedChanges, didSelectFilePatch})
      const {stagedChangesView, unstagedChangesView} = view.refs

      // selection via mouse in unstaged changes
      unstagedChangesView.didSelectFilePatch(unstagedChangesView.props.filePatches[0])
      assert.equal(didSelectFilePatch.callCount, 1)
      assert.deepEqual(didSelectFilePatch.args[0], [unstagedChangesView.props.filePatches[0], 'unstaged'])

      // selection via mouse in staged changes
      stagedChangesView.didSelectFilePatch(stagedChangesView.props.filePatches[0])
      assert.equal(didSelectFilePatch.callCount, 2)
      assert.deepEqual(didSelectFilePatch.args[1], [stagedChangesView.props.filePatches[0], 'staged'])

      // select next via keyboard
      await view.selectNextFilePatch()
      assert.equal(didSelectFilePatch.callCount, 3)
      assert.deepEqual(didSelectFilePatch.args[2], [stagedChangesView.props.filePatches[1], 'staged'])

      // select previous via keyboard
      await view.selectPreviousFilePatch()
      assert.equal(didSelectFilePatch.callCount, 4)
      assert.deepEqual(didSelectFilePatch.args[3], [stagedChangesView.props.filePatches[0], 'staged'])

      // select previous via keyboard, cross boundary
      await view.selectPreviousFilePatch()
      assert.equal(didSelectFilePatch.callCount, 5)
      assert.deepEqual(didSelectFilePatch.args[4], [unstagedChangesView.props.filePatches[0], 'unstaged'])
    })
  })
})
