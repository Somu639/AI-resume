"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TipTapEditorProps = {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  className?: string;
  showToolbar?: boolean;
};

export function TipTapEditor({
  content,
  onChange,
  editable = true,
  className,
  showToolbar = true,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Start editing your optimized resume…",
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[420px] focus:outline-none px-4 py-3",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      {showToolbar && editable ? (
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5">
          <ToolbarButton
            label="Undo"
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Ordered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={label}
      className={cn("h-8 w-8", active && "bg-accent text-accent-foreground")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
