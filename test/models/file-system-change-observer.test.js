/** @babel */

import fs from 'fs';
import path from 'path';
import sinon from 'sinon';

import {cloneRepository, buildRepository, setUpLocalAndRemoteRepositories} from '../helpers';

import FileSystemChangeObserver from '../../lib/models/file-system-change-observer';

describe('FileSystemChangeObserver', () => {
  beforeEach(function() {
    this.timeout(5000); // increase the timeout because we're interacting with file system events.
  });

  it('does not allow overlapping starts/stops (thus leaking watchers)', async () => {
    const workdirPath1 = await cloneRepository('three-files');
    const repository1 = await buildRepository(workdirPath1);
    const workdirPath2 = await cloneRepository('three-files');
    const repository2 = await buildRepository(workdirPath2);
    const workdirPath3 = await cloneRepository('three-files');
    const repository3 = await buildRepository(workdirPath3);
    const changeObserver = new FileSystemChangeObserver();

    const startWatch = changeObserver.watchActiveRepository.bind(changeObserver)
    const stopWatch = changeObserver.stopCurrentFileWatcher.bind(changeObserver)

    const events = []
    const wrap = (fn, event, getRepo) => (...args) => {
      events.push(event)
      return fn(...args)
    };

    changeObserver.watchActiveRepository = wrap(startWatch, 'start', (co) => co.activeRepository)
    changeObserver.stopCurrentFileWatcher = wrap(stopWatch, 'stop', (co) => co.currentFileWatcher && co.currentFileWatcher.activeRepository)

    const p1 = changeObserver.setActiveRepository(repository1)
    const p2 = changeObserver.setActiveRepository(repository2)
    const p3 = changeObserver.setActiveRepository(repository3)
    await Promise.all([p1, p2, p3])

    assert.equal(changeObserver.activeRepository, repository3)

    let nextExpected = 'stop'
    for (idx in events) {
      const event = events[idx]
      if (nextExpected === event) {
        nextExpected = event === 'start' ? 'stop' : 'start'
      } else {
        throw new Error(`Expected event at index ${idx} to be ${nextExpected} but it was ${event}`)
      }
    }
  })

  it('emits an event when the currently active directory changes', async () => {
    const workdirPath1 = await cloneRepository('three-files');
    const repository1 = await buildRepository(workdirPath1);
    const workdirPath2 = await cloneRepository('three-files');
    const repository2 = await buildRepository(workdirPath2);
    const changeSpy = sinon.spy();
    const changeObserver = new FileSystemChangeObserver();
    changeObserver.onDidChange(changeSpy);

    await changeObserver.setActiveRepository(repository1);
    fs.writeFileSync(path.join(workdirPath1, 'a.txt'), 'a change\n');
    fs.writeFileSync(path.join(workdirPath2, 'a.txt'), 'a change\n');
    await changeObserver.lastFileChangePromise;
    assert.isTrue(changeSpy.calledOnce);

    changeSpy.reset();
    await changeObserver.setActiveRepository(repository2);
    fs.writeFileSync(path.join(workdirPath1, 'b.txt'), 'a change\n');
    fs.writeFileSync(path.join(workdirPath2, 'b.txt'), 'a change\n');
    await changeObserver.lastFileChangePromise;
    assert.isTrue(changeSpy.calledOnce);

    changeSpy.reset();
    await changeObserver.setActiveRepository(null);
    fs.writeFileSync(path.join(workdirPath1, 'c.txt'), 'a change\n');
    fs.writeFileSync(path.join(workdirPath2, 'c.txt'), 'a change\n');
    await Promise.race([changeObserver.lastFileChangePromise, timeout(500)]);
    assert.isTrue(!changeSpy.called);

    changeSpy.reset();
    await changeObserver.setActiveRepository(repository1);
    await changeObserver.stopCurrentFileWatcher();
    fs.writeFileSync(path.join(workdirPath1, 'd.txt'), 'a change\n');
    await Promise.race([changeObserver.lastFileChangePromise, timeout(500)]);
    assert.isTrue(!changeSpy.called);
  });

  it('emits an event when a project file is modified, created, or deleted', async () => {
    const workdirPath = await cloneRepository('three-files');
    const repository = await buildRepository(workdirPath);
    const changeSpy = sinon.spy();
    const changeObserver = new FileSystemChangeObserver();
    changeObserver.onDidChange(changeSpy);

    await changeObserver.setActiveRepository(repository);
    fs.writeFileSync(path.join(workdirPath, 'a.txt'), 'a change\n');
    await changeObserver.lastFileChangePromise;
    assert.isTrue(changeSpy.calledOnce);

    changeSpy.reset();
    fs.writeFileSync(path.join(workdirPath, 'new-file.txt'), 'a change\n');
    await changeObserver.lastFileChangePromise;
    assert.isTrue(changeSpy.calledOnce);

    changeSpy.reset();
    fs.unlinkSync(path.join(workdirPath, 'a.txt'));
    await changeObserver.lastFileChangePromise;
    assert.isTrue(changeSpy.calledOnce);
  });

  it('emits an event when a file is staged or unstaged', async () => {
    const workdirPath = await cloneRepository('three-files');
    const repository = await buildRepository(workdirPath);
    const changeSpy = sinon.spy();
    const changeObserver = new FileSystemChangeObserver();
    changeObserver.onDidChange(changeSpy);
    await changeObserver.setActiveRepository(repository);

    fs.writeFileSync(path.join(workdirPath, 'a.txt'), 'a change\n');
    await repository.git.exec(['add', 'a.txt']);
    await changeObserver.lastFileChangePromise;
    assert.isTrue(changeSpy.called);

    changeSpy.reset();
    await repository.git.exec(['reset', 'a.txt']);
    await changeObserver.lastFileChangePromise;
    assert.isTrue(changeSpy.called);
  });

  it('emits an event when a branch is checked out', async () => {
    const workdirPath = await cloneRepository('three-files');
    const repository = await buildRepository(workdirPath);
    const changeSpy = sinon.spy();
    const changeObserver = new FileSystemChangeObserver();
    changeObserver.onDidChange(changeSpy);
    await changeObserver.setActiveRepository(repository);

    await repository.git.exec(['checkout', '-b', 'new-branch']);
    await changeObserver.lastFileChangePromise;
    assert.isTrue(changeSpy.called);
  });

  it('emits an event when commits are pushed', async () => {
    const {localRepoPath} = await setUpLocalAndRemoteRepositories();
    const repository = await buildRepository(localRepoPath);
    const changeSpy = sinon.spy();
    const changeObserver = new FileSystemChangeObserver();
    changeObserver.onDidChange(changeSpy);
    await changeObserver.setActiveRepository(repository);

    await repository.git.exec(['commit', '--allow-empty', '-m', 'new commit']);
    await changeObserver.lastFileChangePromise;

    changeSpy.reset();
    await repository.git.exec(['push', 'origin', 'master']);
    await changeObserver.lastFileChangePromise;
    assert.isTrue(changeSpy.called);
  });

  it('emits an event when a new tracking branch is added after pushing', async () => {
    const {localRepoPath} = await setUpLocalAndRemoteRepositories();
    const repository = await buildRepository(localRepoPath);
    const changeSpy = sinon.spy();
    const changeObserver = new FileSystemChangeObserver();
    changeObserver.onDidChange(changeSpy);
    await changeObserver.setActiveRepository(repository);

    await repository.git.exec(['checkout', '-b', 'new-branch']);
    await changeObserver.lastFileChangePromise;

    changeSpy.reset();
    await repository.git.exec(['push', '--set-upstream', 'origin', 'new-branch']);
    await changeObserver.lastFileChangePromise;
    assert.isTrue(changeSpy.called);
  });

  it('emits an event when commits have been fetched', async () => {
    const {localRepoPath} = await setUpLocalAndRemoteRepositories({remoteAhead: true});
    const repository = await buildRepository(localRepoPath);
    const changeSpy = sinon.spy();
    const changeObserver = new FileSystemChangeObserver();
    changeObserver.onDidChange(changeSpy);
    await changeObserver.setActiveRepository(repository);

    await repository.git.exec(['fetch', 'origin', 'master']);
    await changeObserver.lastFileChangePromise;
    assert.isTrue(changeSpy.called);
  });

  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});
