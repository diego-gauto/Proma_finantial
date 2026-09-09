import { describe, expect, it } from "vitest";

import { buildDocumentPreviewUrl } from "./document-preview-url";

describe("buildDocumentPreviewUrl", () => {
  it("uses the persisted Drive file id when available", () => {
    expect(
      buildDocumentPreviewUrl({
        driveFileId: "1abc_DEF-234",
        driveUrl: "https://drive.google.com/file/d/ignored/view"
      })
    ).toBe("https://drive.google.com/file/d/1abc_DEF-234/preview");
  });

  it("converts a Google Drive file URL to its preview URL", () => {
    expect(
      buildDocumentPreviewUrl({
        driveFileId: null,
        driveUrl: "https://drive.google.com/file/d/1abc_DEF-234/view?usp=sharing"
      })
    ).toBe("https://drive.google.com/file/d/1abc_DEF-234/preview");
  });

  it("converts a Google Drive open URL to its preview URL", () => {
    expect(
      buildDocumentPreviewUrl({
        driveFileId: null,
        driveUrl: "https://drive.google.com/open?id=1abc_DEF-234"
      })
    ).toBe("https://drive.google.com/file/d/1abc_DEF-234/preview");
  });

  it("keeps non-Drive URLs unchanged", () => {
    expect(
      buildDocumentPreviewUrl({
        driveFileId: null,
        driveUrl: "https://example.com/factura.pdf"
      })
    ).toBe("https://example.com/factura.pdf");
  });

  it("returns null when there is no source to preview", () => {
    expect(
      buildDocumentPreviewUrl({
        driveFileId: null,
        driveUrl: null
      })
    ).toBeNull();
  });
});
