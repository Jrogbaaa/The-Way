import util from 'util';
import { exec } from 'child_process';
/**
 * Promisified version of child_process.exec
 */
export const execPromise = util.promisify(exec);
