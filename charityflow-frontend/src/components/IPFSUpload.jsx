import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { uploadToIPFS, ipfsUrl } from "../utils/ipfs";

/**
 * Reusable IPFS upload component.
 * @param {string|string[]} value - Current IPFS hash (CID) or array of CIDs when multiple
 * @param {function} onChange - Called with (hash) or (hashes[]) when upload completes
 * @param {string} accept - File input accept attr, e.g. "image/*" or "image/*,.pdf"
 * @param {string} label - Field label
 * @param {string} placeholder - Placeholder when empty
 * @param {boolean} showPreview - Show image preview for image files
 * @param {boolean} multiple - When true, value/onChange work with arrays
 */
export default function IPFSUpload({
  value,
  onChange,
  accept = "image/*",
  label = "Upload to IPFS",
  placeholder = "Select file, then click Upload",
  showPreview = true,
  multiple = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const isImage = accept.includes("image");
  const values = multiple ? (Array.isArray(value) ? value : value ? [value] : []) : [];
  const singleValue = multiple ? "" : (value || "");

  async function handleUpload() {
    const files = inputRef.current?.files;
    const file = multiple ? files?.[0] : files?.[0];
    if (!file) {
      setError("Please select a file first");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const cid = await uploadToIPFS(file);
      if (multiple) {
        onChange?.([...values, cid]);
      } else {
        onChange?.(cid);
      }
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleClear() {
    if (multiple) {
      onChange?.([]);
    } else {
      onChange?.("");
    }
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemoveItem(idx) {
    const next = values.filter((_, i) => i !== idx);
    onChange?.(next);
  }

  return (
    <div className="ipfs-upload">
      {label && (
        <label className="form-label" style={{ display: "block", marginBottom: "8px" }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: "1",
            minWidth: "200px",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="input"
            style={{ flex: 1, padding: "8px", fontSize: "13px" }}
            onChange={() => setError(null)}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              "Uploading..."
            ) : (
              <>
                <Upload size={14} /> Upload
              </>
            )}
          </button>
        </div>
        {(multiple ? values.length > 0 : singleValue) && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleClear}
            style={{
              color: "var(--cf-text-muted)",
              border: "1px solid var(--cf-border)",
              padding: "6px 10px",
            }}
            title="Clear all"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: "var(--cf-error)", fontSize: "12px", marginTop: "8px" }}>
          {error}
        </p>
      )}

      {multiple && values.length > 0 && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {values.map((cid, idx) => (
            <div
              key={cid}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px",
                background: "var(--cf-bg-2)",
                borderRadius: "8px",
              }}
            >
              <span className="mono" style={{ fontSize: "11px", wordBreak: "break-all", flex: 1 }}>
                {cid}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveItem(idx)}
                style={{ color: "var(--cf-text-muted)", padding: "4px" }}
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!multiple && singleValue && (
        <div style={{ marginTop: "12px" }}>
          <div
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--cf-text-muted)",
              wordBreak: "break-all",
              marginBottom: "6px",
            }}
          >
            IPFS: {singleValue}
          </div>
          {showPreview && isImage && (
            <a
              href={ipfsUrl(singleValue)}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-block" }}
            >
              <img
                src={ipfsUrl(singleValue)}
                alt="IPFS preview"
                style={{
                  maxWidth: "200px",
                  maxHeight: "120px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid var(--cf-border)",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </a>
          )}
        </div>
      )}

      {((multiple && values.length === 0) || (!multiple && !singleValue)) && !error && (
        <p className="caption" style={{ marginTop: "6px" }}>
          {placeholder}
        </p>
      )}
    </div>
  );
}
