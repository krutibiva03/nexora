import { auth } from '../firebase';

export type UploadFolder = 'avatars' | 'projects' | 'certificates';

export interface UploadResult {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to encode file.'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadWorkspaceFile(file: File, folder: UploadFolder): Promise<UploadResult> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sign in with Google to upload files to your account.');
  }

  if (file.size > 3 * 1024 * 1024) {
    throw new Error('File exceeds the 3 MB limit.');
  }

  const allowedTypes =
    folder === 'certificates'
      ? ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
      : ['image/png', 'image/jpeg', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      folder === 'certificates'
        ? 'Certificates must be PNG, JPEG, WebP, or PDF files.'
        : 'Images must be PNG, JPEG, or WebP files.'
    );
  }

  const dataBase64 = await readFileAsBase64(file);
  const idToken = await user.getIdToken();

  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      folder,
      mimeType: file.type,
      fileName: file.name,
      dataBase64,
    }),
  });

  const payload = (await res.json()) as UploadResult & { message?: string };
  if (!res.ok) {
    throw new Error(payload.message || 'Upload failed.');
  }
  return payload;
}
