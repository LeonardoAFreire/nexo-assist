type LoginNoteProps = {
  errorMessage: string | undefined;
  isHelpShown: boolean;
};

export function LoginNote({ errorMessage, isHelpShown }: LoginNoteProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-rule pt-4 text-[13.5px]">
      {errorMessage && (
        <p role="alert" className="font-medium text-destructive">
          {errorMessage}
        </p>
      )}
      <output className="text-ink-3">
        {isHelpShown && 'Para redefinir a senha, ligue para o ramal 4000.'}
      </output>
    </div>
  );
}
