import { withLockSuspended } from "@/features/lock/suspend";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  BACKUP_FILE_PREFIX,
  MAX_BACKUP_BYTES,
  backupFileName,
  type BackupFile,
} from "./format";

export class BackupFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupFileError";
    Object.setPrototypeOf(this, BackupFileError.prototype);
  }
}

/** Best effort: keeps at most one old backup file in the cache. */
function cleanOldBackups(): void {
  try {
    const cache = new Directory(Paths.cache);
    for (const item of cache.list()) {
      if (item instanceof File && item.name.startsWith(BACKUP_FILE_PREFIX)) {
        try {
          item.delete();
        } catch (error) {
          console.warn("Could not remove an old backup file", error);
        }
      }
    }
  } catch (error) {
    console.warn("Could not look for old backup files", error);
  }
}

/** Writes the backup to the app's cache and returns its uri. */
export function writeBackupFile(backup: BackupFile): string {
  cleanOldBackups();
  const file = new File(Paths.cache, backupFileName());
  file.create();
  file.write(JSON.stringify(backup, null, 2));
  return file.uri;
}

/** Opens the system share sheet so the person chooses where the file goes. */
export async function shareBackupFile(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new BackupFileError("Sharing is not available on this device.");
  }
  await withLockSuspended(() =>
    Sharing.shareAsync(uri, {
      mimeType: "application/json",
      dialogTitle: "Save your Gritio backup",
      UTI: "public.json",
    }),
  );
}

/** Lets the person pick a file and returns its text, or null if they cancelled. */
export async function pickBackupText(): Promise<string | null> {
  const result = await withLockSuspended(() =>
    DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: false,
    }),
  );
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (asset.size !== undefined && asset.size > MAX_BACKUP_BYTES) {
    throw new BackupFileError("This file is too large to be a Gritio backup.");
  }
  const text = await new File(asset.uri).text();
  return text.replace(/^\uFEFF/, "");
}
