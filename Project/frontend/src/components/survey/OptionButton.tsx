interface OptionButtonProps {
  text: string;
  score: number;
  hotkey: number;
  selected: boolean;
  onClick: () => void;
}

function OptionButton({ text, hotkey, selected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      className={`option-button ${selected ? "option-button-selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="option-key" aria-hidden="true">
        {hotkey}
      </span>
      <span className="option-text">{text}</span>
    </button>
  );
}

export default OptionButton;
