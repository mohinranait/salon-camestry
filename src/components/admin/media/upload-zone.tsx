'use client';

import { useRef, useState } from 'react';
import { CloudUpload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/lib/types';
import { ACCEPT_ATTR, uploadMedia } from './media-client';

export function UploadZone({
  onUploaded,
  className,
  compact = false,
}: {
  onUploaded: (items: MediaItem[]) => void;
  className?: string;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  async function handle(files: FileList | File[] | null) {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setProgress(0);
    try {
      const { items, errors } = await uploadMedia(list, setProgress);
      for (const e of errors) toast.error(e);
      if (items.length) {
        toast.success(`${items.length} file${items.length > 1 ? 's' : ''} uploaded`);
        onUploaded(items);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setProgress(null);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => progress === null && input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handle(e.dataTransfer.files);
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        compact ? 'p-4' : 'p-10',
        dragging ? 'border-amber-500 bg-amber-50' : 'border-border hover:border-foreground/30 hover:bg-muted/40',
        className,
      )}
    >
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => void handle(e.target.files)}
      />
      {progress !== null ? (
        <>
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
          <p className="text-sm font-medium">Uploading… {progress}%</p>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </>
      ) : (
        <>
          <CloudUpload className={cn('text-muted-foreground', compact ? 'size-6' : 'size-9')} />
          <p className="text-sm font-medium">Drop files here or click to upload</p>
          {!compact && (
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP, AVIF, GIF, SVG, MP4, WebM, MOV or PDF · up to 200 MB each</p>
          )}
        </>
      )}
    </div>
  );
}
