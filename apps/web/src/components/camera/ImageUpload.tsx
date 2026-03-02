type Props = {
  onSelect: (file: File) => void;
};

export default function ImageUpload({onSelect}: Props) {
  return (
    <label className="cursor-pointer inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#c26a3b] text-[#c26a3b] hover:bg-[#fff2e5] text-sm font-semibold">
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
