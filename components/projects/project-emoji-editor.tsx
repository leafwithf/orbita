"use client";

import { useActionState, useMemo, useState } from "react";
import { ImagePlus, Search, X } from "lucide-react";

import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/actions/state";
import { updateProjectEmojiAction, uploadProjectIconAction } from "@/lib/actions/projects";

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
  currentImage,
}: {
  projectId: string;
  currentEmoji: string;
  currentImage: string | null;
}) {
  const [emoji, setEmoji] = useState(currentEmoji || "🚀");
  const [query, setQuery] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [emojiState, emojiAction, emojiPending] = useActionState(updateProjectEmojiAction, initialFormState);
  const [imageState, imageAction, imagePending] = useActionState(uploadProjectIconAction, initialFormState);
  const emojis = useMemo(
    () => [...new Set(PROJECT_EMOJIS)].filter((item) => item.includes(query.trim())),
    [query],
  );
  const customEmoji = query.trim();
  const canUseCustomEmoji = customEmoji.length > 0 && customEmoji.length <= 8 && /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u.test(customEmoji);
  const quickEmojis = ["🚀", "💡", "🎯"];

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-[13px] font-medium text-ink">Escolha como identificar este projeto</p>
        <div className="flex flex-wrap items-center gap-2">
          {quickEmojis.map((item) => (
            <button key={item} type="button" onClick={() => setEmoji(item)} aria-pressed={emoji === item && !preview} className={`grid size-11 place-items-center rounded-xl border text-2xl transition-colors ${emoji === item && !preview ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-border bg-surface hover:bg-surface-2"}`}>
              {item}
            </button>
          ))}
          <button type="button" onClick={() => setLibraryOpen((open) => !open)} aria-expanded={libraryOpen} aria-label="Abrir biblioteca de emojis" className="grid size-11 place-items-center rounded-xl border border-border bg-surface text-xl text-muted hover:bg-surface-2">
            {libraryOpen ? <X className="size-4" /> : "…"}
          </button>
        </div>
        {libraryOpen ? (
          <div role="dialog" aria-label="Biblioteca de emojis" className="grid gap-3 rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-2)]">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ou colar um emoji" className="h-10 w-full rounded-md border border-input bg-surface-2 pl-9 pr-3 text-sm outline-none focus-visible:border-brand" />
            </label>
            <div className="grid max-h-52 grid-cols-8 gap-1.5 overflow-y-auto sm:grid-cols-10 md:grid-cols-12" role="group" aria-label="Emojis disponíveis">
              {emojis.map((item) => (
                <button key={item} type="button" onClick={() => { setEmoji(item); setPreview(null); setLibraryOpen(false); }} aria-label={`Usar ${item}`} aria-pressed={emoji === item && !preview} className={`grid size-9 place-items-center rounded-lg border text-xl ${emoji === item && !preview ? "border-brand bg-brand-soft" : "border-transparent hover:bg-surface-2"}`}>
                  {item}
                </button>
              ))}
              {emojis.length === 0 ? <p className="col-span-full py-3 text-center text-xs text-muted">Não encontrei na lista. Você pode colar o emoji e selecioná-lo abaixo.</p> : null}
            </div>
            {canUseCustomEmoji ? <button type="button" onClick={() => { setEmoji(customEmoji); setPreview(null); setLibraryOpen(false); }} className="min-h-9 justify-self-start rounded-md border border-border px-3 text-xs font-semibold text-brand hover:bg-surface-2">Usar {customEmoji}</button> : null}
          </div>
        ) : null}
        <form action={emojiAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="emoji" value={emoji} />
          <span className="grid size-11 place-items-center rounded-xl border border-border bg-surface-2 text-2xl" aria-label="Prévia do emoji">{preview ? "🖼️" : emoji}</span>
          <SubmitButton pending={emojiPending} pendingLabel="Salvando…">Usar emoji</SubmitButton>
          <span className="text-[11px] text-faint">A imagem e o emoji são alternativas.</span>
        </form>
        <FormMessage status={emojiState.status === "error" ? "error" : "success"} message={emojiState.message} />
      </div>

      <div className="grid gap-2 rounded-xl border border-border bg-surface-2/40 p-3">
        <div className="flex items-center gap-2 text-[13px] font-medium text-ink"><ImagePlus className="size-4 text-brand" /> Ou envie uma imagem</div>
        {preview ? <img src={preview} alt="Prévia da imagem do projeto" className="size-16 rounded-xl border border-border object-cover" /> : null}
        <form action={imageAction} className="grid gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <input name="icon" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required onChange={(event) => { const file = event.target.files?.[0]; if (file) setPreview(URL.createObjectURL(file)); }} className="block w-full text-xs text-muted file:mr-3 file:min-h-10 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:text-xs file:font-semibold file:text-ink" />
          <p className="text-[11px] text-faint">PNG, JPG, WEBP ou GIF · até 4 MB.</p>
          <div><SubmitButton pending={imagePending} pendingLabel="Enviando…">Salvar imagem</SubmitButton></div>
        </form>
        <FormMessage status={imageState.status === "error" ? "error" : "success"} message={imageState.message} />
      </div>
    </div>
  );
}
