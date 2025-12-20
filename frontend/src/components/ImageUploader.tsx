// src/components/ImageUploader.tsx
import React, { useEffect, useRef, useState } from 'react';
import axios, { CancelTokenSource } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

type Props = {
  /** Optional existing image url to show as initial preview */
  value?: string | null;
  /** Called when upload finishes with uploaded URL */
  onUploadSuccess?: (url: string) => void;
  onError?: (err: any) => void;
  onProgress?: (percent: number) => void;
  /** If provided, the component will automatically upload when file is picked */
  autoUpload?: boolean;
  /** Upload endpoint (defaults to /api/uploads) */
  uploadUrl?: string;
  /** Maximum allowed file size in bytes (default 2MB) */
  maxSizeBytes?: number;
  /** Accept attribute string (default image/*) */
  accept?: string;
  /** Extra form field name for the file (default "file") */
  fieldName?: string;
  /** Optional className for container */
  className?: string;
};

export default function ImageUploader({
  value = null,
  onUploadSuccess,
  onError,
  onProgress,
  autoUpload = true,
  uploadUrl = '/api/uploads',
  maxSizeBytes = 10 * 1024 * 1024,
  accept = 'image/*',
  fieldName = 'file',
  className = '',
}: Props) {
  const [preview, setPreview] = useState<string | null>(value);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState<number>(0);
  const cancelRef = useRef<CancelTokenSource | null>(null);

  useEffect(() => {
    setPreview(value ?? null);
  }, [value]);

  useEffect(() => {
    if (file && autoUpload) {
      doUpload(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      const err = new Error('Please select an image file');
      onError?.(err);
      return;
    }
    if (f.size > maxSizeBytes) {
      const err = new Error(`File too large. Max ${Math.round(maxSizeBytes / 1024)} KB`);
      onError?.(err);
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(String(reader.result));
    };
    reader.readAsDataURL(f);
  }

  async function doUpload(f: File) {
    setUploading(true);
    setPercent(0);
    const fd = new FormData();
    fd.append(fieldName, f);

    const source = axios.CancelToken.source();
    cancelRef.current = source;

    try {
      const token = localStorage.getItem('qm_token');
      const res = await axios.post(baseURL + uploadUrl, fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        cancelToken: source.token,
        onUploadProgress: (ev) => {
          if (ev.total) {
            const p = Math.round((ev.loaded * 100) / ev.total);
            setPercent(p);
            onProgress?.(p);
          }
        },
      });
      const url = res.data?.url ?? res.data;
      if (!url) {
        throw new Error('Upload succeeded but server did not return URL');
      }
      setUploading(false);
      setPercent(100);
      onUploadSuccess?.(url);
    } catch (err: any) {
      if (axios.isCancel(err)) {
        // cancelled - don't call onError for normal cancel
        setUploading(false);
        setPercent(0);
        return;
      }
      console.error('upload error', err);
      setUploading(false);
      setPercent(0);
      onError?.(err);
    } finally {
      cancelRef.current = null;
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f) {
      if (!f.type.startsWith('image/')) {
        onError?.(new Error('Please drop an image file'));
        return;
      }
      if (f.size > maxSizeBytes) {
        onError?.(new Error(`File too large. Max ${Math.round(maxSizeBytes / 1024)} KB`));
        return;
      }
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => setPreview(String(reader.result));
      reader.readAsDataURL(f);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function cancelUpload() {
    if (cancelRef.current) {
      cancelRef.current.cancel('User cancelled upload');
    }
  }

  return (
    <div className={`image-uploader ${className}`}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="p-3 border border-dashed rounded flex flex-col sm:flex-row items-center gap-3"
        style={{ minHeight: 96 }}
      >
        <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
          {preview ? (
            <img
              src={preview}
              alt="preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div className="text-xs text-gray-500 text-center p-2">Preview</div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-2">
              <input type="file" accept={accept} onChange={handleFileInput} className="hidden" />
              <span className="px-3 py-1 bg-gray-200 rounded text-sm">Choose image</span>
            </label>

            <span className="text-sm text-gray-500">or drag & drop here</span>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {file
              ? `${file.name} — ${Math.round(file.size / 1024)} KB`
              : `Max size ${Math.round(maxSizeBytes / 1024)} KB`}
          </div>

          {uploading && (
            <div className="mt-2">
              <div className="w-full bg-gray-100 rounded h-2 overflow-hidden">
                <div style={{ width: `${percent}%` }} className="h-2 bg-blue-500"></div>
              </div>
              <div className="mt-1 text-xs flex items-center gap-2">
                <span>{percent}%</span>
                <button onClick={cancelUpload} className="text-xs text-red-600">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
