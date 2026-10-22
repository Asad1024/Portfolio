/* Anything on the site can open the guide, or open it with a question
   already asked: the command palette, a case study's "Ask about this"
   button. One event, so none of them needs to know where the guide lives. */

export const OPEN_EVENT = "assistant:open";

export type OpenDetail = { prompt?: string };

export function openAssistant(prompt?: string) {
  window.dispatchEvent(new CustomEvent<OpenDetail>(OPEN_EVENT, { detail: { prompt } }));
}

/** What the guide is called everywhere it names itself. Here rather than in
 *  the panel so the launcher can say it without loading the whole console. */
export const NAME = "Asad's Assistant";
