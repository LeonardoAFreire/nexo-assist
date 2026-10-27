const BOLD_PATTERN = /\*\*(.+?)\*\*/g;
const BOLD_SEGMENT_PARITY = 1;

type FormattedTextProps = {
  text: string;
};

export function FormattedText({ text }: FormattedTextProps) {
  const segments = text.split(BOLD_PATTERN);
  return (
    <>
      {segments.map((segment, index) =>
        index % 2 === BOLD_SEGMENT_PARITY ? (
          <strong key={`${index}-${segment}`}>{segment}</strong>
        ) : (
          segment
        ),
      )}
    </>
  );
}
