import {execFile} from 'child_process';
import path from 'path';
import fs from 'fs';

if (typeof atom === 'undefined') {
  global.atom = {
    inSpecMode() { return !!process.env.ATOM_GITHUB_SPEC_MODE; },
    inDevMode() { return false; },
  };
}

export const UNAUTHENTICATED = Symbol('UNAUTHENTICATED');

export class KeytarStrategy {
  static get keytar() {
    return require('keytar');
  }

  static async isValid() {
    // Allow for disabling Keytar on problematic CI environments
    if (process.env.ATOM_GITHUB_DISABLE_KEYTAR) {
      return false;
    }

    const keytar = this.keytar;

    try {
      const rand = Math.floor(Math.random() * 10e20).toString(16);
      await keytar.setPassword('atom-test-service', rand, rand);
      const pass = await keytar.getPassword('atom-test-service', rand);
      const success = pass === rand;
      keytar.deletePassword('atom-test-service', rand);
      return success;
    } catch (err) {
      return false;
    }
  }

  getPassword(service, account) {
    return this.constructor.keytar.getPassword(service, account);
  }

  replacePassword(service, account, password) {
    return this.constructor.keytar.setPassword(service, account, password);
  }

  deletePassword(service, account) {
    return this.constructor.keytar.deletePassword(service, account);
  }
}

export class SecurityBinaryStrategy {
  static isValid() {
    return process.platform === 'darwin';
  }

  async getPassword(service, account) {
    try {
      const password = await this.exec(['find-generic-password', '-s', service, '-a', account, '-w']);
      return password.trim() || UNAUTHENTICATED;
    } catch (err) {
      return UNAUTHENTICATED;
    }
  }

  replacePassword(service, account, newPassword) {
    return this.exec(['add-generic-password', '-s', service, '-a', account, '-w', newPassword, '-U']);
  }

  deletePassword(service, account) {
    return this.exec(['delete-generic-password', '-s', service, '-a', account]);
  }

  exec(securityArgs, {binary} = {binary: 'security'}) {
    return new Promise((resolve, reject) => {
      execFile(binary, securityArgs, (error, stdout) => {
        if (error) { return reject(error); }
        return resolve(stdout);
      });
    });
  }
}

export class InMemoryStrategy {
  static isValid() {
    return true;
  }

  constructor() {
    if (!atom.inSpecMode()) {
      // eslint-disable-next-line no-console
      console.warn(
        'Using an InMemoryStrategy strategy for storing tokens. ' +
        'The tokens will only be stored for the current window.',
      );
    }
    this.passwordsByService = new Map();
  }

  getPassword(service, account) {
    const passwords = this.passwordsByService.get(service) || new Map();
    const password = passwords.get(account);
    return password || UNAUTHENTICATED;
  }

  replacePassword(service, account, newPassword) {
    const passwords = this.passwordsByService.get(service) || new Map();
    passwords.set(account, newPassword);
    this.passwordsByService.set(service, passwords);
  }

  deletePassword(service, account) {
    const passwords = this.passwordsByService.get(service);
    if (passwords) {
      passwords.delete(account);
    }
  }
}

export class FileStrategy {
  static isValid() {
    if (!atom.inSpecMode() && !atom.inDevMode()) {
      return false;
    }

    return Boolean(process.env.ATOM_GITHUB_KEYTAR_FILE);
  }

  constructor() {
    this.filePath = process.env.ATOM_GITHUB_KEYTAR_FILE;

    if (!atom.inSpecMode()) {
      // eslint-disable-next-line no-console
      console.warn(
        'Using a FileStrategy strategy for storing tokens. ' +
        'The tokens will be stored %cin the clear%c in a file at %s. ' +
        "You probably shouldn't use real credentials while this strategy is in use. " +
        'Unset ATOM_GITHUB_KEYTAR_FILE_STRATEGY to disable it.',
        'color: red; font-weight: bold; font-style: italic',
        'color: black; font-weight: normal; font-style: normal',
        this.filePath,
      );
    }
  }

  async getPassword(service, account) {
    process.stderr.write('getPassword()');
    const payload = await this.load();
    process.stderr.write(`payload = ${require('util').inspect(payload)}\n`);
    const forService = payload[service];
    if (forService === undefined) {
      return UNAUTHENTICATED;
    }
    const passwd = forService[account];
    if (passwd === undefined) {
      return UNAUTHENTICATED;
    }
    return passwd;
  }

  replacePassword(service, account, password) {
    return this.modify(payload => {
      let forService = payload[service];
      if (forService === undefined) {
        forService = {};
        payload[service] = forService;
      }
      forService[account] = password;
    });
  }

  deletePassword(service, account) {
    return this.modify(payload => {
      const forService = payload[service];
      if (forService === undefined) {
        return;
      }
      delete forService[account];
      if (Object.keys(forService).length === 0) {
        delete payload[service];
      }
    });
  }

  load() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filePath, 'utf8', (err, content) => {
        if (err && err.code === 'ENOENT') {
          return resolve({});
        }
        if (err) {
          return reject(err);
        }
        return resolve(JSON.parse(content));
      });
    });
  }

  save(payload) {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.filePath, JSON.stringify(payload), 'utf8', err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async modify(callback) {
    const payload = await this.load();
    callback(payload);
    await this.save(payload);
  }
}

const strategies = [FileStrategy, KeytarStrategy, SecurityBinaryStrategy, InMemoryStrategy];
let ValidStrategy = null;

export async function createStrategy() {
  if (ValidStrategy) {
    return new ValidStrategy();
  }

  for (let i = 0; i < strategies.length; i++) {
    const strat = strategies[i];
    const isValid = await strat.isValid();
    if (isValid) {
      ValidStrategy = strat;
      break;
    }
  }
  if (!ValidStrategy) {
    throw new Error('None of the listed keytar strategies returned true for `isValid`');
  }
  return new ValidStrategy();
}
