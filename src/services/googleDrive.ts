export interface DriveBackupFile {
  id: string;
  name: string;
  size?: string;
  modifiedTime?: string;
}

export async function listAppDriveFiles(accessToken: string): Promise<DriveBackupFile[]> {
  const params = new URLSearchParams({
    q: "trashed = false and mimeType = 'application/json'",
    fields: 'files(id,name,size,modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: '25',
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Không thể tải danh sách tệp Google Drive (${res.status}). ${errText}`.trim());
  }
  const data = (await res.json()) as { files?: DriveBackupFile[] };
  return data.files ?? [];
}

export async function saveBackupToDrive(
  accessToken: string,
  fileName: string,
  jsonContent: string,
  existingFileId?: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<DriveBackupFile> {
  const boundary = `novelbook_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const metadata = existingFileId
    ? { name: fileName }
    : { name: fileName, mimeType: 'application/json' };

  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${jsonContent}\r\n` +
    `--${boundary}--`;

  const endpoint = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingFileId)}?uploadType=multipart&fields=id,name,size,modifiedTime`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,modifiedTime`;
  const method = existingFileId ? 'PATCH' : 'POST';

  if (onProgress) {
    const totalBytes = new Blob([body]).size;
    onProgress(0, totalBytes);
    return new Promise<DriveBackupFile>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, endpoint, true);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);

      xhr.upload.onprogress = (ev) => {
        const total = ev.lengthComputable && ev.total > 0 ? ev.total : totalBytes;
        const loaded = Math.min(total, ev.loaded);
        onProgress(loaded, total);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(totalBytes, totalBytes);
          try {
            resolve(JSON.parse(xhr.responseText) as DriveBackupFile);
          } catch {
            reject(new Error('Phản hồi Google Drive không hợp lệ.'));
          }
        } else {
          reject(new Error(`Không thể lưu tệp lên Google Drive (${xhr.status}). ${xhr.responseText || ''}`.trim()));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Lỗi kết nối khi tải tệp lên Google Drive.'));
      };

      xhr.send(body);
    });
  }

  const res = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Không thể lưu tệp lên Google Drive (${res.status}). ${errText}`.trim());
  }
  return (await res.json()) as DriveBackupFile;
}

export async function downloadDriveFile(accessToken: string, fileId: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Không thể tải tệp từ Google Drive (${res.status}).`);
  }
  return res.text();
}

export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Không thể xoá tệp trên Google Drive (${res.status}).`);
  }
}
