"use client";

import { useActionState, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/actions/state";
import { updateProjectEmojiAction } from "@/lib/actions/projects";

export const PROJECT_EMOJIS = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😋","😎","🤩","🥳","😏","😴","🤔","🫡","🤗","🤭","🤫","🤥","😶","🙄","😬","🤐","🥱","😮","😯","😲","😳","🥺","😭","😤","😡","🤯","🥶","🥵","🤠","🥸","😈","👻","💀","🤖","👽","🎃",
  "👋","🤚","✋","🖖","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","👇","☝️","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🙏","💪","🦾","🖐️","✍️","💅","🫶",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","💌","💋","💯","💢","💥","💫","💦","💨","🕳️","💤",
  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🫎","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪽","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🪿","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔",
  "🌵","🎄","🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎍","🪴","🎋","🍃","🍂","🍁","🍄","🐚","🪨","🌾","💐","🌷","🌹","🥀","🪻","🪷","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜","🌚","🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","🌙","🌎","🌍","🌏","🪐","💫","⭐","🌟","✨","⚡","☄️","💥","🔥","🌪️","🌈","☀️","🌤️","⛅","🌥️","☁️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","☃️","⛄","🌬️","💨","💧","💦","☔","☂️",
  "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠","🫘","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮","🌯","🫔","🥗","🥘","🫕","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯",
  "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","⛹️","🤺","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎗️",
  "🎮","🕹️","🎲","♟️","🎯","🎳","🎭","🎨","🧩","🧸","🪅","🪩","🪆","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🪗","🎸","🪕","🎻","🪇","🪈","🎬","🎞️","📷","📸","📹","🎥","📽️","🎙️","📺","📻","📱","☎️","📞","💻","🖥️","🖨️","⌨️","🖱️","🖲️","💽","💾","💿","📀","🧮","🎛️","🎚️","🔋","🪫","🔌","💡","🔦","🕯️","🪔","🧯","🛢️","🛠️","⚙️","🔩","⚖️","🦯","🔧","🔨","⚒️","🛡️","🔑","🗝️","🔒","🔓","🔏","🔐","🪛","🪜","🧰","🧲","🪝","🧪","🧫","🧬","🔬","🔭","📡","💉","🩹","🩺","🩻","🧻","🧼","🪥","🧽","🧴",
  "🚀","🛸","🚁","✈️","🛩️","🛫","🛬","🪂","💺","🚂","🚆","🚄","🚅","🚈","🚇","🚊","🚉","🚝","🚞","🚋","🚌","🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖","🚗","🚘","🚙","🛻","🚚","🚛","🚜","🏎️","🏍️","🛵","🛺","🚲","🛴","🛹","🛼","🚏","🛣️","🛤️","⛽","🛞","🚨","🚥","🚦","🛑","🚧","⚓","🛟","⛵","🛶","🚤","🛥️","🛳️","⛴️","🚢",
  "🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌","🛕","🕍","⛩️","🕋","⛲","⛺","🌁","🌃","🏙️","🌄","🌅","🌆","🌇","🌉","♨️","🎠","🎡","🎢","💈","🎪",
  "📔","📕","📖","📗","📘","📙","📚","📓","📒","📃","📜","📄","📰","🗞️","📑","🔖","🏷️","💰","🪙","💴","💵","💶","💷","💸","💳","🧾","💹","✉️","📧","📨","📩","📤","📥","📦","📫","📪","📬","📭","📮","🗳️","✏️","✒️","🖋️","🖊️","🖌️","🖍️","📝","💼","📁","📂","🗂️","📅","📆","🗒️","📇","📈","📉","📊","📋","📌","📍","📎","🖇️","📏","📐","✂️","🗃️","🗄️","🗑️",
  "🔍","🔎","🔒","🔓","🔔","🔕","📣","📢","💬","💭","🗯️","💤","♠️","♥️","♦️","♣️","🃏","🎴","🀄","🎁","🎀","🎊","🎉","🎈","🎂","🎄","🎆","🎇","🧨","✨","🎐","🎏","🎎","🎍","🎑","🧧","🎃","🎗️","🎟️","🎫","🎖️","🏆","🥇","🥈","🥉","⚽","🏀","🏈","⚾","🎾","🎯","🎮","♟️","🧩","🪄","🪬","🔮","🧿","🪬","🕉️","☯️","✝️","☪️","✡️","🔯","🕎","☮️","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","⛎","🔱","⚜️","〽️","✳️","❇️","❎","✅","❌","⭕","🚫","💠","🔰","♻️","⚕️","⚛️","🆔","🆕","🆙","🆒","🆓","🆗","🆘","🆚","🈁","🈯","🈳","㊗️","㊙️","🈴","🈵","🈹","🈲","🉐","🈶","🈚","🈸","🈺","🈷️","🆖","🆑","🆙","🆕","🆒","🆓","🆗","🆘",
] as const;

export function ProjectEmojiEditor({
  projectId,
  currentEmoji,
}: {
  projectId: string;
  currentEmoji: string;
}) {
  const [emoji, setEmoji] = useState(currentEmoji || "🚀");
  const [query, setQuery] = useState("");
  const [state, formAction, pending] = useActionState(
    updateProjectEmojiAction,
    initialFormState,
  );
  const emojis = useMemo(
    () => [...new Set(PROJECT_EMOJIS)].filter((item) => item.includes(query.trim())),
    [query],
  );
  const customEmoji = query.trim();
  const canUseCustomEmoji = customEmoji.length > 0 && customEmoji.length <= 8 && /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u.test(customEmoji);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="emoji" value={emoji} />
      <FormMessage
        status={state.status === "error" ? "error" : "success"}
        message={state.message}
      />
      <label className="relative block">
        <span className="sr-only">Buscar emoji</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por emoji (cole ou digite um)"
          className="h-10 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20"
        />
      </label>
      <div className="grid max-h-56 grid-cols-8 gap-2 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-10 md:grid-cols-12" role="group" aria-label="Escolha um emoji para o projeto">
        {emojis.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setEmoji(item)}
            aria-pressed={emoji === item}
            aria-label={`Usar ${item}`}
            className={`grid size-10 place-items-center rounded-lg border text-xl transition-colors ${emoji === item ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-border bg-surface hover:bg-surface-2"}`}
          >
            {item}
          </button>
        ))}
        {emojis.length === 0 && !canUseCustomEmoji ? <p className="col-span-full py-5 text-center text-sm text-muted">Nenhum emoji encontrado. Você também pode colar qualquer emoji do teclado do celular.</p> : null}
      </div>
      {canUseCustomEmoji ? (
        <button type="button" onClick={() => setEmoji(customEmoji)} className="min-h-10 justify-self-start rounded-md border border-border px-3 text-[12px] font-semibold text-brand hover:bg-surface-2">
          Usar este emoji: {customEmoji}
        </button>
      ) : null}
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">{emoji}</span>
        <SubmitButton pending={pending} pendingLabel="Salvando…">
          Salvar emoji
        </SubmitButton>
        <span className="text-[11.5px] text-faint">Atual: {emoji}</span>
      </div>
    </form>
  );
}
