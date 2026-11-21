"use client";

import { useActionState, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Search, X } from "lucide-react";

import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/actions/state";
import { saveProjectIconAction, updateProjectEmojiAction } from "@/lib/actions/projects";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

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
  const [category, setCategory] = useState("all");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [emojiState, emojiAction, emojiPending] = useActionState(updateProjectEmojiAction, initialFormState);
  const [imageMessage, setImageMessage] = useState<{ status: "error" | "success"; message: string } | null>(null);
  const [imagePending, startImageTransition] = useTransition();
  const router = useRouter();
  const emojiCategories = [
    { id: "all", label: "Todos", items: [] as string[] },
    { id: "faces", label: "Rostos", items: ["😀","😎","🤩","🥳","🤔","😴","😍","🥰","😭","😤","🤯","🤖","👻","💀"] },
    { id: "nature", label: "Natureza", items: ["🐶","🐱","🦊","🐼","🦋","🐢","🐬","🌵","🌲","🌿","🌸","🌻","🌙","⭐","🔥","🌈"] },
    { id: "food", label: "Comida", items: ["🍎","🍊","🍓","🍉","🍕","🍔","🍟","🍣","🍰","☕","🥑","🥗"] },
    { id: "activities", label: "Atividades", items: ["⚽","🏀","🎾","🏆","🎮","🎯","🎨","🎧","🎸","📷","🎬","🧩"] },
    { id: "travel", label: "Viagem", items: ["🚀","🛸","✈️","🚗","🚲","🚢","🏠","🏢","🏰","🗼","⛺","🌍"] },
    { id: "objects", label: "Objetos", items: ["💻","📱","⌨️","💡","🔧","🔬","📚","📁","📅","📈","✏️","💼"] },
    { id: "symbols", label: "Símbolos", items: ["❤️","💛","💚","💙","💜","🖤","✨","⚡","💥","✅","❌","♻️"] },
  ];
  const emojis = useMemo(() => {
    const unique = [...new Set(PROJECT_EMOJIS)];
    const selected = emojiCategories.find((item) => item.id === category);
    const source = query.trim() || category === "all"
      ? unique
      : unique.filter((item) => selected?.items.includes(item));
    return source.filter((item) => item.includes(query.trim()));
  }, [category, query]);
  const customEmoji = query.trim();
  const canUseCustomEmoji = customEmoji.length > 0 && customEmoji.length <= 8 && /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u.test(customEmoji);
  const quickEmojis = ["🚀", "💡", "🎯"];

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-[13px] font-medium text-ink">Escolha como identificar este projeto</p>
        <div className="flex flex-wrap items-center gap-2">
          {quickEmojis.map((item) => (
            <button key={item} type="button" onClick={() => { setEmoji(item); setPreview(null); }} aria-pressed={emoji === item && !preview} className={`grid size-11 place-items-center rounded-xl border text-2xl transition-colors ${emoji === item && !preview ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-border bg-surface hover:bg-surface-2"}`}>
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
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Categorias de emojis">
              {emojiCategories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  aria-pressed={category === item.id}
                  className={`min-h-8 shrink-0 rounded-full border px-3 text-[11px] font-semibold transition-colors ${category === item.id ? "border-brand bg-brand-soft text-brand" : "border-border bg-surface text-muted hover:bg-surface-2"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
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
        <form
          className="grid gap-2"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const input = event.currentTarget.elements.namedItem("icon");
            const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
            if (!file) {
              setImageMessage({ status: "error", message: "Selecione uma imagem antes de enviar." });
              return;
            }
            const extensions: Record<string, string> = {
              "image/png": "png",
              "image/jpeg": "jpg",
              "image/webp": "webp",
              "image/gif": "gif",
            };
            const extension = extensions[file.type];
            if (!extension) {
              setImageMessage({ status: "error", message: "Use uma imagem PNG, JPG, WEBP ou GIF." });
              return;
            }
            if (file.size > 4 * 1024 * 1024) {
              setImageMessage({ status: "error", message: "A imagem deve ter no máximo 4 MB." });
              return;
            }
            setImageMessage(null);
            startImageTransition(async () => {
              let uploadedPath: string | null = null;
              try {
                const supabase = createBrowserClient();
                const { data: authData, error: authError } = await supabase.auth.getUser();
                if (authError || !authData.user) {
                  setImageMessage({ status: "error", message: "Sua sessão expirou. Entre novamente e tente." });
                  return;
                }
                uploadedPath = `${authData.user.id}/${projectId}/${crypto.randomUUID()}.${extension}`;
                const { error: uploadError } = await supabase.storage
                  .from("project-icons")
                  .upload(uploadedPath, file, { contentType: file.type, upsert: false });
                if (uploadError) {
                  setImageMessage({ status: "error", message: "Não foi possível enviar a imagem. Confira as permissões do armazenamento no Supabase." });
                  return;
                }
                const result = await saveProjectIconAction(projectId, uploadedPath);
                if (result.status !== "success") {
                  await supabase.storage.from("project-icons").remove([uploadedPath]);
                  setImageMessage({ status: "error", message: result.message || "Não foi possível salvar a imagem." });
                  return;
                }
                setImageMessage({ status: "success", message: result.message || "Imagem atualizada." });
                router.refresh();
              } catch {
                if (uploadedPath) {
                  try {
                    const supabase = createBrowserClient();
                    await supabase.storage.from("project-icons").remove([uploadedPath]);
                  } catch {
                    // A falha de limpeza não deve ocultar a mensagem principal.
                  }
                }
                setImageMessage({ status: "error", message: "Ocorreu um erro ao enviar a imagem. Tente novamente." });
              }
            });
          }}
        >
          <input name="icon" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required onChange={(event) => { const file = event.target.files?.[0]; if (file) setPreview(URL.createObjectURL(file)); }} className="block w-full text-xs text-muted file:mr-3 file:min-h-10 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:text-xs file:font-semibold file:text-ink" />
          <p className="text-[11px] text-faint">PNG, JPG, WEBP ou GIF · até 4 MB.</p>
          <div><SubmitButton pending={imagePending} pendingLabel="Enviando…">Salvar imagem</SubmitButton></div>
        </form>
        {imageMessage ? <FormMessage status={imageMessage.status} message={imageMessage.message} /> : null}
      </div>
    </div>
  );
}
