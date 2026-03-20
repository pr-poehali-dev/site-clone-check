import { useRef, useState } from "react";
import { lkFiles, FileType, UploadedFile } from "@/lib/lkApi";
import Icon from "@/components/ui/icon";

interface FileUploaderProps {
  fileType: FileType;
  label?: string;
  hint?: string;
  requestId?: string;
  offerId?: string;
  onUploaded?: (file: UploadedFile) => void;
  multiple?: boolean;
  uploaded?: UploadedFile[];
  onDelete?: (id: string) => void;
  accept?: string;
}

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/jpg": "JPG",
  "image/png": "PNG",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default function FileUploader({
  fileType,
  label = "Загрузить файл",
  hint = "PDF, JPG, PNG до 20 МБ",
  requestId,
  offerId,
  onUploaded,
  multiple = false,
  uploaded = [],
  onDelete,
  accept = ".pdf,.jpg,.jpeg,.png",
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);

    const toUpload = multiple ? Array.from(files) : [files[0]];
    for (const file of toUpload) {
      try {
        const result = await lkFiles.upload(file, fileType, {
          request_id: requestId,
          offer_id: offerId,
        });
        onUploaded?.(result);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
        break;
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (id: string) => {
    try {
      await lkFiles.delete(id);
      onDelete?.(id);
    } catch (_e) { /* noop */ }
  };

  const isImage = (mime: string) => mime?.startsWith("image/");

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? "#2563eb" : "#cbd5e1"}`,
          borderRadius: 10,
          padding: "20px 16px",
          textAlign: "center",
          cursor: uploading ? "not-allowed" : "pointer",
          background: dragOver ? "#eff6ff" : uploading ? "#f8fafc" : "#fafafa",
          transition: "all 0.15s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: "none" }}
          onChange={e => handleFiles(e.target.files)}
        />

        {uploading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, border: "3px solid #dbeafe",
              borderTopColor: "#2563eb", borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Загрузка...</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Icon name="Upload" size={24} style={{ color: dragOver ? "#2563eb" : "#94a3b8" }} />
            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: dragOver ? "#2563eb" : "#374151" }}>
              {label}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{hint}</div>
            <div style={{ fontSize: "0.72rem", color: "#2563eb", marginTop: 2 }}>или перетащите файл сюда</div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: "#dc2626", fontSize: "0.82rem" }}>
          <Icon name="AlertCircle" size={14} />
          {error}
        </div>
      )}

      {/* Uploaded files list */}
      {uploaded.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {uploaded.map(f => (
            <div key={f.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 8, padding: "8px 12px",
            }}>
              {/* Preview / icon */}
              {isImage(f.mime) ? (
                <img
                  src={f.file_url}
                  alt={f.filename}
                  style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 36, height: 36, background: "#eff6ff", borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon name="FileText" size={18} style={{ color: "#2563eb" }} />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "0.82rem", fontWeight: 600, color: "#1e293b",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {f.filename}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  {MIME_LABELS[f.mime] || f.mime} · {formatSize(f.size)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <a
                  href={f.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid #e2e8f0", borderRadius: 6, color: "#2563eb", textDecoration: "none",
                  }}
                  title="Открыть"
                >
                  <Icon name="ExternalLink" size={13} />
                </a>
                {onDelete && (
                  <button
                    onClick={() => handleDelete(f.id)}
                    style={{
                      width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1px solid #fecaca", background: "none", borderRadius: 6,
                      cursor: "pointer", color: "#ef4444",
                    }}
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
