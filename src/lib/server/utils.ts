import util from 'util';
import { exec } from 'child_process';

/**
 * Promisified version of child_process.exec
 * This should only be used in server-side code
 */
export const execPromise = util.promisify(exec); 