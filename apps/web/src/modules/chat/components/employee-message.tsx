type EmployeeMessageProps = {
  text: string;
};

export function EmployeeMessage({ text }: EmployeeMessageProps) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[88%] rounded-[12px_12px_4px_12px] bg-ink px-4 py-[11px] text-[14.5px] break-words whitespace-pre-wrap text-white sm:max-w-[520px]">
        {text}
      </p>
    </div>
  );
}
