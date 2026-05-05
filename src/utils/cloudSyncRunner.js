import { isCloudSyncReady } from './cloudSync';

export function runCloudSync(task, warningMessage) {
  if (!isCloudSyncReady()) return;
  task().catch((err) => console.warn(warningMessage, err));
}
