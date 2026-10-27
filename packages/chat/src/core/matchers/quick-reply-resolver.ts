import type { QuickOption } from '@nexo/contracts';

const OPTION_NUMBER = /^[1-9]\d?$/;

export type ResolveQuickReplyInput = {
  text: string;
  options: readonly QuickOption[];
};

export type QuickReplyResolution = {
  text: string;
  option: QuickOption | null;
};

export class QuickReplyResolver {
  resolve(input: ResolveQuickReplyInput): QuickReplyResolution {
    const typed = input.text.trim();
    if (!OPTION_NUMBER.test(typed)) {
      return { text: input.text, option: null };
    }
    const option = input.options[Number(typed) - 1];
    if (option === undefined) {
      return { text: input.text, option: null };
    }
    return { text: option.label, option };
  }
}
