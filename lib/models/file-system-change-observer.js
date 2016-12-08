/** @babel */

import {Emitter} from 'atom';
import nsfw from 'nsfw';

import path from 'path';

export default class FileSystemChangeObserver {
  constructor() {
    this.emitter = new Emitter();
    this.setLastRepoPromise = Promise.resolve()
  }

  onDidChange(callback) {
    return this.emitter.on('did-change', callback);
  }

  async setActiveRepository(repository) {
    this.nextRepoToWatch = repository
    if (!this.setCurrentRepoPromise) {
      this.setCurrentRepoPromise = (async () => {
        await this.setLastRepoPromise
        await this.stopCurrentFileWatcher();
        this.setLastRepoPromise = this.setCurrentRepoPromise
        delete this.setCurrentRepoPromise
        return this.watchActiveRepository(this.nextRepoToWatch);
      }())
    }

    return this.setCurrentRepoPromise
  }


  getActiveRepository() {
    return this.activeRepository;
  }

  async watchActiveRepository(nextRepo) {
    this.activeRepository = nextRepo
    if (this.activeRepository) {
      this.lastFileChangePromise = new Promise(resolve => { this.resolveLastFileChangePromise = resolve; });
      this.currentFileWatcher = await nsfw(this.activeRepository.getWorkingDirectoryPath(), events => {
        const isNonGitFile = event => !event.directory.split(path.sep).includes('.git') && event.file !== '.git';
        const isWatchedGitFile = event => {
          return ['index', 'HEAD', 'config'].includes(event.file) ||
            event.directory.includes(path.join('.git', 'refs', 'remotes'));
        };
        const filteredEvents = events.filter(e => isNonGitFile(e) || isWatchedGitFile(e));
        if (filteredEvents.length) {
          this.emitter.emit('did-change');
          this.resolveLastFileChangePromise();
          this.lastFileChangePromise = new Promise(resolve => { this.resolveLastFileChangePromise = resolve; });
        }
      });
      await this.currentFileWatcher.start();
    }
  }

  async stopCurrentFileWatcher() {
    if (this.currentFileWatcher) {
      await this.currentFileWatcher.stop();
      this.currentFileWatcher = null;
    }
  }

  async destroy () {
    return this.stopCurrentFileWatcher()
  }
}
