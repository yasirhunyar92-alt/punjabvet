import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const SUGGESTED_TAGS = ['Dewormer', 'Antibiotic', 'Vaccine', 'Supplement', 'Injection', 'Oral', 'Topical', 'Cattle', 'Buffalo', 'Goat', 'Sheep', 'Poultry', 'Horse', 'Dog', 'Cat', 'Veterinary Medicine'];

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

const TagInput = ({ label, value, onChange, suggestions = SUGGESTED_TAGS }: TagInputProps) => {
  const [input, setInput] = useState('');

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput('');
  };

  const removeTag = (tag: string) => onChange(value.filter(t => t !== tag));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
  };

  const available = suggestions.filter(s => !value.includes(s));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive"><X size={10} /></button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-1">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type and press Enter" className="flex-1" />
        <button type="button" onClick={() => addTag(input)} className="px-2 text-primary hover:text-primary/80"><Plus size={16} /></button>
      </div>
      {available.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {available.slice(0, 8).map(s => (
            <button key={s} type="button" onClick={() => addTag(s)}
              className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagInput;
