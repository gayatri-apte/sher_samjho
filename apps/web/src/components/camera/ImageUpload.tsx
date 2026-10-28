import { Upload } from "lucide-react";

type Props = {
  onSelect: (file: File) => void;
};

export default function ImageUpload({ onSelect }: Props) {
  return (
    <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#c26a3b] text-[#a9552a] hover:bg-[#fff2e5] font-semibold focus-within:ring-2 focus-within:ring-[#c26a3b]/40">
      <Upload size={18} /> Upload a photo
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}
