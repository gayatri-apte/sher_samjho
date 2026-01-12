type Props = {
    onSelect: (file: File) => void;
  };
  
  export default function ImageUpload({ onSelect }: Props) {
    return (
      <label className="cursor-pointer px-4 py-2 rounded border border-neutral-700 hover:bg-neutral-800">
        Upload Image
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onSelect(e.target.files[0]);
            }
          }}
        />
      </label>
    );
  }
  