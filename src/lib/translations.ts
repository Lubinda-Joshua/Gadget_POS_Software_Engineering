import messages from "../../messages/en.json";

type Values = Record<string, string | number>;
type MessageGroup = Record<string, string>;

function translator(namespace: string) {
  const group = (messages as Record<string, MessageGroup>)[namespace] ?? {};

  return (key: string, values: Values = {}): string => {
    const template = group[key] ?? key;
    return Object.entries(values).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template
    );
  };
}

/** English-only presentation helper kept deliberately small for the course project. */
export function useTranslations(namespace: string) {
  return translator(namespace);
}

export async function getTranslations(namespace: string) {
  return translator(namespace);
}
