import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

const ImageUpload = ({ value, onChange }: ImageUploadProps) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Product Image</Label>
      
      {/* Preview */}
      {value && (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border bg-muted">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-1 bg-muted rounded-md p-0.5">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 text-xs py-1.5 px-2 rounded flex items-center justify-center gap-1 transition-colors ${
            mode === 'upload' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
          }`}
        >
          <Upload size={12} /> Gallery
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 text-xs py-1.5 px-2 rounded flex items-center justify-center gap-1 transition-colors ${
            mode === 'url' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
          }`}
        >
          <LinkIcon size={12} /> URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Choose from Gallery</>}
          </Button>
        </div>
      ) : (
        <Input
          placeholder="https://example.com/image.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};

export default ImageUpload;
