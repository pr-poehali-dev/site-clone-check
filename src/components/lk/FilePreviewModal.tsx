import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

interface PreviewFile {
  filename: string;
  file_url: string;
  mime: string;
}

interface FilePreviewModalProps {
  file: PreviewFile | null;
  onClose: () => void;
}

const isImage = (mime: string) => mime?.startsWith("image/");
const isPdf = (mime: string) => mime === "application/pdf";

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [imgZoom, setImgZoom] = useState(1);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "+" || e.key === "=") setImgZoom(z => Math.min(4, +(z + 0.25).toFixed(2)));
    if (e.key === "-") setImgZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)));
    if (e.key === "0") setImgZoom(1);
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!file) return;
    document.body.style.overflow = "hidden";
    setImgZoom(1);
    setIframeLoaded(false);
    return () => { document.body.style.overflow = ""; };
  }, [file?.file_url]);

  if (!file) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const showImage = isImage(file.mime);
  const showPdf = isPdf(file.mime);
  const canPreview = showImage || showPdf;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(2,6,23,0.92)",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px",
        background: "rgba(15,23,42,0.97)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0, flexWrap: "wrap",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: showPdf ? "#1e3a5f" : "#1a3a1a",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={showImage ? "Image" : "FileText"} size={14}
            style={{ color: showPdf ? "#60a5fa" : "#4ade80" }} />
        </div>

        <div style={{
          flex: 1, fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0,
        }}>
          {file.filename}
        </div>

        {showImage && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <button onClick={() => setImgZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))}
              disabled={imgZoom <= 0.25} style={tbtnStyle(imgZoom <= 0.25)}>
              <Icon name="ZoomOut" size={13} />
            </button>
            <button onClick={() => setImgZoom(1)} style={tbtnStyle(false)}>
              <span style={{ fontSize: "0.73rem", minWidth: 38, textAlign: "center", display: "block", color: "#94a3b8" }}>
                {Math.round(imgZoom * 100)}%
              </span>
            </button>
            <button onClick={() => setImgZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}
              disabled={imgZoom >= 4} style={tbtnStyle(imgZoom >= 4)}>
              <Icon name="ZoomIn" size={13} />
            </button>
          </div>
        )}

        {(showImage || showPdf) && (
          <div style={{ fontSize: "0.68rem", color: "#475569", flexShrink: 0 }}>
            {showImage ? "клавиши +/−/0" : "Esc — закрыть"}
          </div>
        )}

        <a
          href={file.file_url}
          download={file.filename}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 6,
            background: "#1d4ed8", color: "#fff",
            textDecoration: "none", fontSize: "0.78rem", fontWeight: 600, flexShrink: 0,
          }}
        >
          <Icon name="Download" size={13} />Скачать
        </a>

        <button onClick={onClose} style={{
          width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6, cursor: "pointer", color: "#94a3b8", flexShrink: 0,
        }}>
          <Icon name="X" size={15} />
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1, overflow: showPdf ? "hidden" : "auto",
          display: "flex",
          alignItems: showPdf ? "stretch" : "center",
          justifyContent: "center",
          padding: showPdf ? 0 : "20px",
          background: showPdf ? "#525659" : "transparent",
        }}
        onClick={e => e.stopPropagation()}
      >
        {showImage && (
          <div style={{ overflow: "auto", maxWidth: "100%", maxHeight: "100%" }}>
            <img
              src={file.file_url}
              alt={file.filename}
              draggable={false}
              style={{
                display: "block",
                maxWidth: imgZoom === 1 ? "min(100vw - 40px, 1100px)" : "none",
                width: imgZoom !== 1 ? `${imgZoom * 900}px` : undefined,
                height: "auto",
                borderRadius: 8,
                boxShadow: "0 8px 48px rgba(0,0,0,0.7)",
                transition: "width 0.12s",
              }}
            />
          </div>
        )}

        {showPdf && (
          <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {!iframeLoaded && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 1,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: "#525659", gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, border: "3px solid #374151",
                  borderTopColor: "#3b82f6", borderRadius: "50%",
                  animation: "pdf-modal-spin 0.7s linear infinite",
                }} />
                <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Загрузка PDF...</div>
              </div>
            )}
            <iframe
              src={file.file_url + "#toolbar=1&navpanes=1&scrollbar=1&view=FitH"}
              title={file.filename}
              onLoad={() => setIframeLoaded(true)}
              style={{
                flex: 1, width: "100%", border: "none",
                opacity: iframeLoaded ? 1 : 0,
                transition: "opacity 0.2s",
                minHeight: 0,
              }}
            />
          </div>
        )}

        {!canPreview && (
          <div style={{ color: "#94a3b8", textAlign: "center", padding: 60 }}>
            <Icon name="FileQuestion" size={52} style={{ marginBottom: 16, opacity: 0.35 }} />
            <div style={{ fontSize: "0.9rem", color: "#cbd5e1", marginBottom: 12 }}>
              Предпросмотр для этого формата недоступен
            </div>
            <a href={file.file_url} target="_blank" rel="noopener noreferrer"
              style={{ color: "#60a5fa", fontSize: "0.85rem" }}>
              Открыть или скачать →
            </a>
          </div>
        )}
      </div>

      <style>{`@keyframes pdf-modal-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function tbtnStyle(disabled: boolean): React.CSSProperties {
  return {
    height: 28, padding: "0 6px",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 6,
    cursor: disabled ? "default" : "pointer",
    color: "#94a3b8", opacity: disabled ? 0.4 : 1,
  };
}
