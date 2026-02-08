type Props = {
  text: string;
  onWordClick: (word: string) => void;
};

export default function PoetryText({ text, onWordClick }: Props) {
  return (
    <div className="text-2xl leading-loose text-right">
      {text.split(/\s+/).map((word, i) => (
        <span
          key={i}
          onClick={() => onWordClick(word)}
          className="cursor-pointer hover:text-blue-400 transition"
        >
          {word}{" "}
        </span>
      ))}
    </div>
  );
}
