interface OptionButtonProps {
  text: string;
  score: number;
  selected: boolean;
  onClick: () => void;
}

function OptionButton({ text, selected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      className={`option-button ${selected ? "option-button-selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {text}
    </button>
  );
}

export default OptionButton;
