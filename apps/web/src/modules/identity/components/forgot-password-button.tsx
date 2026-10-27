type ForgotPasswordButtonProps = {
  onClick: () => void;
};

export function ForgotPasswordButton({ onClick }: ForgotPasswordButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm text-[13.5px] font-medium text-primary-text outline-none hover:underline focus-visible:ring-2 focus-visible:ring-cta/40"
    >
      Esqueci minha senha
    </button>
  );
}
