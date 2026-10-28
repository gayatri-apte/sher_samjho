type Props = {
  text: string;
  onWordClick: (word: string) => void;
  small?: boolean;
};

/** Renders poetry line by line; every word is a tappable button. */
export default function PoetryText({ text, onWordClick, small = false }: Props) {
  return (
    <div className={`${small ? "text-lg" : "text-2xl sm:text-3xl"} leading-loose`}>
      {text.split(/\n+/).map((line, li) => (
        <p key={li}>
          {line
            .split(/\s+/)
            .filter(Boolean)
            .map((word, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onWordClick(word)}
                className="px-0.5 rounded hover:bg-[#f6e2cf] hover:text-[#a9552a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c26a3b]/50 transition-colors"
              >
                {word}
              </button>
            ))
            .reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, " ", el] : [el]), [])}
        </p>
      ))}
    </div>
  );
}
