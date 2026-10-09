import { Directory, File, Paths } from 'expo-file-system';

/** Belgeler uygulamanın kendi klasöründe saklanır; yedeklenir, silinmez. */
export const DOCUMENTS_FOLDER = 'belgeler';

const SAFE_EXTENSION = /^\.[A-Za-z0-9]{1,5}$/;

/** Seçilen dosyanın uzantısını korur; tanınmayan uzantı yok sayılır. */
export function documentFileName(id: string, originalName: string): string {
  const dot = originalName.lastIndexOf('.');
  const extension = dot > 0 ? originalName.slice(dot).toLowerCase() : '';
  return SAFE_EXTENSION.test(extension) ? `${id}${extension}` : id;
}

function documentsDirectory(): Directory {
  const directory = new Directory(Paths.document, DOCUMENTS_FOLDER);
  if (!directory.exists) directory.create({ intermediates: true });
  return directory;
}

export function documentFile(fileName: string): File {
  return new File(Paths.document, DOCUMENTS_FOLDER, fileName);
}

/** Seçilen dosyayı uygulama klasörüne kopyalar; geçici kopya silinse de kalır. */
export function saveDocumentFile(sourceUri: string, fileName: string): { sizeBytes: number | null } {
  documentsDirectory();
  const target = documentFile(fileName);
  if (target.exists) target.delete();
  new File(sourceUri).copy(target);
  return { sizeBytes: target.size ?? null };
}

export function deleteDocumentFile(fileName: string): void {
  const file = documentFile(fileName);
  if (file.exists) file.delete();
}
