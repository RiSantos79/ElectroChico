"use client";

import { useRef, useState, type ReactNode } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { aiGenerateAction } from "@/lib/ai-actions";
import { readProductContext } from "./ai-button";
import type { AiFeatureKey } from "@/lib/api";

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm font-medium ${
        active ? "bg-accent text-accent-foreground" : "text-muted hover:bg-surface hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  function addLink() {
    const url = window.prompt("URL do link:", editor.getAttributes("link").href ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface p-1.5">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="Negrito">
        <span className="font-bold">N</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="Itálico">
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} label="Sublinhado">
        <span className="underline">S</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} label="Rasurado">
        <span className="line-through">R</span>
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive("paragraph")}
        label="Texto normal"
      >
        ¶
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        label="Título grande"
      >
        T1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        label="Título pequeno"
      >
        T2
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="Lista"
      >
        •—
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="Lista numerada"
      >
        1.
      </ToolbarButton>
      <ToolbarButton onClick={addLink} active={editor.isActive("link")} label="Link">
        🔗
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} label="Limpar formatação">
        ✕
      </ToolbarButton>
    </div>
  );
}

// Cola texto de outros sites com a formatação (negrito, listas, links, etc.)
// preservada — o TipTap interpreta o HTML da área de transferência por
// omissão, não é preciso código extra para isso.
export function RichTextEditor({
  name,
  defaultValue = "",
  ai = false,
}: {
  name: string;
  defaultValue?: string;
  /** Mostra as ações de IA por cima do editor (só quando a IA está ligada). */
  ai?: boolean;
}) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false, autolink: true })],
    content: defaultValue,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "input-field min-h-40 rounded-t-none border-0 focus:outline-none prose-sm max-w-none [&_a]:text-accent [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
      },
    },
  });

  return (
    <div>
      {ai && editor && (
        <AiEditorActions
          editor={editor}
          onApply={(text) => {
            editor.commands.setContent(text);
            setHtml(editor.getHTML());
          }}
        />
      )}
      <div className="overflow-hidden rounded-lg border border-border">
        {editor ? <Toolbar editor={editor} /> : <div className="h-[41px] border-b border-border bg-surface" />}
        <EditorContent editor={editor} />
        <input type="hidden" name={name} value={html} />
      </div>
    </div>
  );
}

// As ações de IA vivem aqui dentro (e não no AiButton genérico) porque o
// conteúdo do TipTap não se escreve num input — tem de passar pelo editor.
function AiEditorActions({ editor, onApply }: { editor: Editor; onApply: (text: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions: { feature: AiFeatureKey; label: string; needsText: boolean }[] = [
    { feature: "PRODUCT_LONG_DESCRIPTION", label: "Gerar descrição", needsText: false },
    { feature: "TEXT_IMPROVE", label: "Melhorar", needsText: true },
    { feature: "TEXT_SPELLCHECK", label: "Corrigir ortografia", needsText: true },
    { feature: "TEXT_REWRITE", label: "Reescrever", needsText: true },
  ];

  async function run(feature: AiFeatureKey, needsText: boolean) {
    const form = ref.current?.closest("form");
    if (!form) return;

    const currentText = editor.getText().trim();
    if (needsText && !currentText) {
      setError("Escreva algo primeiro.");
      return;
    }

    setBusy(feature);
    setError(null);
    const context = readProductContext(form);
    if (needsText) context.text = editor.getHTML();

    const result = await aiGenerateAction(feature, context);
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onApply(result.text);
  }

  return (
    <div ref={ref} className="mb-2 flex flex-wrap items-center gap-2">
      {actions.map((a) => (
        <button
          key={a.feature}
          type="button"
          onClick={() => run(a.feature, a.needsText)}
          disabled={busy !== null}
          className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
        >
          {busy === a.feature ? "A gerar..." : `✨ ${a.label}`}
        </button>
      ))}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
