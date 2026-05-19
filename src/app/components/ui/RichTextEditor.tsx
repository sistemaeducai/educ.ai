import { useRef, useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
  readOnly?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, title, active, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors
        ${active
          ? 'bg-primary/20 text-primary font-bold'
          : 'hover:bg-muted text-foreground'
        }`}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <div className="w-px h-5 bg-border mx-1" />;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Digite o conteúdo aqui...',
  minHeight = 200,
  className = '',
  readOnly = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastValueRef.current) {
      editorRef.current.innerHTML = value;
      lastValueRef.current = value;
    }
  }, [value]);

  const exec = useCallback((command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleInput();
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastValueRef.current = html;
    onChange(html === '<br>' ? '' : html);
  }, [onChange]);

  const isActive = (command: string) => {
    try { return document.queryCommandState(command); } catch { return false; }
  };

  const insertLink = () => {
    const url = window.prompt('URL do link:', 'https://');
    if (url) exec('createLink', url);
  };

  const insertHR = () => exec('insertHorizontalRule');

  return (
    <div className={`border border-border rounded-lg overflow-hidden bg-background ${className}`}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
          {/* Formatação de texto */}
          <ToolbarButton onClick={() => exec('bold')} title="Negrito (Ctrl+B)" active={isActive('bold')}>
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('italic')} title="Itálico (Ctrl+I)" active={isActive('italic')}>
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('underline')} title="Sublinhado (Ctrl+U)" active={isActive('underline')}>
            <span className="underline">U</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('strikeThrough')} title="Tachado">
            <span className="line-through">S</span>
          </ToolbarButton>

          <ToolbarSep />

          {/* Títulos */}
          <ToolbarButton onClick={() => exec('formatBlock', 'H2')} title="Título">
            <span className="font-bold text-xs">H2</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('formatBlock', 'H3')} title="Subtítulo">
            <span className="font-bold text-xs">H3</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('formatBlock', 'P')} title="Parágrafo">
            <span className="text-xs">P</span>
          </ToolbarButton>

          <ToolbarSep />

          {/* Listas */}
          <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Lista com marcadores" active={isActive('insertUnorderedList')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('insertOrderedList')} title="Lista numerada" active={isActive('insertOrderedList')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </ToolbarButton>

          <ToolbarSep />

          {/* Alinhamento */}
          <ToolbarButton onClick={() => exec('justifyLeft')} title="Alinhar à esquerda">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('justifyCenter')} title="Centralizar">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
            </svg>
          </ToolbarButton>

          <ToolbarSep />

          {/* Extras */}
          <ToolbarButton onClick={insertLink} title="Inserir link">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('blockquote')} title="Citação">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={insertHR} title="Linha horizontal">
            <span className="text-xs font-mono">—</span>
          </ToolbarButton>

          <ToolbarSep />

          <ToolbarButton onClick={() => exec('removeFormat')} title="Remover formatação">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </ToolbarButton>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="p-3 outline-none text-sm text-foreground leading-relaxed
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
          [&_a]:text-primary [&_a]:underline
          [&_hr]:border-border [&_hr]:my-3
          empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none"
        style={{ minHeight }}
        dangerouslySetInnerHTML={undefined}
      />

      {/* Contador de caracteres */}
      {!readOnly && (
        <div className="px-3 py-1.5 border-t border-border bg-muted/20 text-xs text-muted-foreground text-right">
          {editorRef.current?.innerText?.length ?? 0} caracteres
        </div>
      )}
    </div>
  );
}
