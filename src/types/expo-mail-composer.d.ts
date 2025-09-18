declare module "expo-mail-composer" {
  export type MailComposerAttachment = string;

  export type MailComposerOptions = {
    attachments?: MailComposerAttachment[];
    body?: string;
    ccRecipients?: string[];
    isHtml?: boolean;
    recipients?: string[];
    subject?: string;
  };

  export type MailComposerStatusType =
    | "cancelled"
    | "saved"
    | "sent"
    | "undetermined";

  export type MailComposerResult = {
    status: MailComposerStatusType;
  };

  export const MailComposerStatus: {
    readonly CANCELLED: "cancelled";
    readonly SAVED: "saved";
    readonly SENT: "sent";
    readonly UNDETERMINED: "undetermined";
  };

  export function isAvailableAsync(): Promise<boolean>;
  export function composeAsync(
    options: MailComposerOptions,
  ): Promise<MailComposerResult>;
}
