const googleDrivePreviewBase = "https://drive.google.com/file/d";

export function buildDocumentPreviewUrl({
  driveFileId,
  driveUrl
}: {
  driveFileId: string | null;
  driveUrl: string | null;
}): string | null {
  const fileId = driveFileId ?? getGoogleDriveFileId(driveUrl);

  if (fileId) {
    return `${googleDrivePreviewBase}/${encodeURIComponent(fileId)}/preview`;
  }

  return driveUrl;
}

function getGoogleDriveFileId(driveUrl: string | null): string | null {
  if (!driveUrl) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(driveUrl);
  } catch {
    return null;
  }

  if (!parsedUrl.hostname.endsWith("drive.google.com")) {
    return null;
  }

  const pathMatch = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }

  return parsedUrl.searchParams.get("id");
}
