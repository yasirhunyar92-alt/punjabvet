import { useState, useRef } from 'react';
import { Upload, X, Loader2, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MultiImageUploadProps {
  mainImage: string;
  images: string[];
  onMainImageChange: (url: string) => void;
  onImagesChange: (urls: string[]) => void;
  onAiGenerate?: (imageUrl: string) => void;
}

const MultiImageUpload = ({ mainImage, images, onMainImageChange, onImagesChange, onAiGenerate }: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [enhancing, setEnhancing] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5MB)`); continue; }

        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const filePath = `products/${fileName}`;

        const { error } = await supabase.storage.from('product-images').upload(filePath, file);
        if (error) { toast.error(error.message); continue; }

        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }

      if (newUrls.length > 0) {
        if (!mainImage) onMainImageChange(newUrls[0]);
        onImagesChange([...images, ...newUrls]);
        toast.success(`${newUrls.length} image(s) uploaded`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const url = images[index];
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
    if (url === mainImage) onMainImageChange(updated[0] || '');
  };

  const setAsMain = (url: string) => onMainImageChange(url);

  const handleEnhance = async (index: number) => {
    const url = images[index];
    setEnhancing(index);
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-analyze', {
        body: { imageUrl: url, action: 'remove-bg' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.editedImage) {
        // Upload the enhanced image to storage
        const base64 = data.editedImage.replace(/^data:image\/\w+;base64,/, '');
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const fileName = `products/ai-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

        const { error: uploadErr } = await supabase.storage.from('product-images').upload(fileName, bytes, { contentType: 'image/png' });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        const newUrl = urlData.publicUrl;

        // Replace the old image with enhanced one
        const updated = [...images];
        updated[index] = newUrl;
        onImagesChange(updated);
        if (url === mainImage) onMainImageChange(newUrl);
        toast.success('Image enhanced with AI!');
      } else {
        toast.error('AI could not process the image');
      }
    } catch (err: any) {
      toast.error(err.message || 'Enhancement failed');
    } finally {
      setEnhancing(null);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Product Images</Label>
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={i} className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${url === mainImage ? 'border-primary' : 'border-border'} cursor-pointer group`}>
            <img src={url} alt="" className="w-full h-full object-cover" onClick={() => setAsMain(url)} />
            <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={10} />
            </button>
            {/* AI Enhance button */}
            <button type="button" onClick={() => handleEnhance(i)} disabled={enhancing === i}
              className="absolute bottom-0.5 left-0.5 bg-primary text-primary-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">
              {enhancing === i ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
            </button>
            {url === mainImage && <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[8px] text-center py-0.5">Main</span>}
          </div>
        ))}
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /><span className="text-[9px] mt-0.5">Add</span></>}
        </button>
      </div>
      {/* AI Generate button */}
      {images.length > 0 && onAiGenerate && (
        <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 text-primary border-primary/30 hover:bg-primary/10" onClick={() => onAiGenerate(mainImage || images[0])}>
          <Sparkles size={14} /> AI Generate — Auto-fill form & enhance image
        </Button>
      )}
      <p className="text-[10px] text-muted-foreground">Click image to set as main. Hover for ✨ to remove BG. Max 5MB each.</p>
    </div>
  );
};

export default MultiImageUpload;
