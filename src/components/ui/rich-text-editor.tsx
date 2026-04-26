'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Color } from '@tiptap/extension-color'
import {TextStyle} from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  Table as TableIcon, Undo, Redo, Heading1, Heading2, Heading3,
  Palette, Upload, Quote, Code, Minus, Eraser, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
  minHeight?: string
  maxHeight?: string
  className?: string
  onImageUpload?: (file: File) => Promise<string>
  bucketName?: string
  folderPath?: string
}

const COLORS = [
  '#000000', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', 
  '#ffffff', '#6b7280', '#78716c', '#a1a1aa'
] as const

const TABLE_ROWS_DEFAULT = 3
const TABLE_COLS_DEFAULT = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const FONT_FAMILIES = [
  { name: 'Default', value: '' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
]

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write something...',
  editable = true,
  minHeight = '200px',
  maxHeight = '500px',
  className,
  onImageUpload,
  bucketName = 'exam-images',
  folderPath = 'uploads'
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [tableRows, setTableRows] = useState(TABLE_ROWS_DEFAULT)
  const [tableCols, setTableCols] = useState(TABLE_COLS_DEFAULT)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Image.configure({
      inline: true,
      allowBase64: false,
      HTMLAttributes: {
        class: 'rounded-lg max-w-full h-auto my-2',
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse w-full my-2',
      },
    }),
    TableRow,
    TableCell.configure({
      HTMLAttributes: {
        class: 'border border-gray-300 dark:border-gray-700 p-2 align-top',
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: 'border border-gray-300 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800 font-bold align-top',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 dark:text-blue-400 underline cursor-pointer',
      },
      validate: href => /^https?:\/\//.test(href),
    }),
    Placeholder.configure({
      placeholder,
      emptyEditorClass: 'is-editor-empty',
    }),
    TextStyle,
    Color,
    FontFamily.configure({
      types: ['textStyle'],
    }),
  ], [placeholder])

  // Only create editor when mounted on client
  const editor = useEditor({
    immediatelyRender: true, // Changed from false to true
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          'p-4 rounded-lg border border-gray-200 dark:border-gray-700',
          'bg-white dark:bg-gray-900',
          minHeight ? `min-h-[${minHeight}]` : 'min-h-[200px]',
          maxHeight ? `max-h-[${maxHeight}]` : '',
          'overflow-y-auto',
          className
        ),
      },
    },
  }, [isMounted]) // Re-create editor when mounted changes

  const handleImageUpload = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed')
      return
    }

    setUploading(true)
    try {
      if (onImageUpload) {
        const url = await onImageUpload(file)
        editor?.chain().focus().setImage({ src: url, alt: file.name }).run()
        toast.success('Image uploaded successfully!')
      } else {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const filePath = `${folderPath}/${fileName}`
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath)

        editor?.chain().focus().setImage({ src: publicUrl, alt: file.name }).run()
        toast.success('Image uploaded successfully!')
      }
      handleCloseImageDialog()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [editor, onImageUpload, bucketName, folderPath])

  const handleInsertImage = useCallback(() => {
    if (imageUrl && imageUrl.trim()) {
      editor?.chain().focus().setImage({ src: imageUrl.trim() }).run()
      handleCloseImageDialog()
    }
  }, [editor, imageUrl])

  const handleInsertLink = useCallback(() => {
    if (linkUrl && linkUrl.trim()) {
      const url = linkUrl.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        toast.error('URL must start with http:// or https://')
        return
      }
      
      if (editor?.state.selection.empty) {
        editor?.chain().focus().insertContent(`<a href="${url}" target="_blank">${linkText || url}</a>`).run()
      } else {
        editor?.chain().focus().setLink({ href: url }).run()
      }
      handleCloseLinkDialog()
    }
  }, [editor, linkUrl, linkText])

  const handleInsertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ 
      rows: tableRows, 
      cols: tableCols, 
      withHeaderRow: true 
    }).run()
    handleCloseTableDialog()
  }, [editor, tableRows, tableCols])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
    e.target.value = ''
  }, [handleImageUpload])

  const handleCloseImageDialog = useCallback(() => {
    setShowImageDialog(false)
    setImageUrl('')
  }, [])

  const handleCloseLinkDialog = useCallback(() => {
    setShowLinkDialog(false)
    setLinkUrl('')
    setLinkText('')
  }, [])

  const handleCloseTableDialog = useCallback(() => {
    setShowTableDialog(false)
    setTableRows(TABLE_ROWS_DEFAULT)
    setTableCols(TABLE_COLS_DEFAULT)
  }, [])

  const handleOpenLinkDialog = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    setLinkUrl(previousUrl || '')
    
    if (editor?.state.selection.empty) {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from, 
        editor.state.selection.to
      ) || ''
      setLinkText(selectedText)
    }
    
    setShowLinkDialog(true)
  }, [editor])

  const addColumn = useCallback(() => {
    editor?.chain().focus().addColumnAfter().run()
  }, [editor])

  const addRow = useCallback(() => {
    editor?.chain().focus().addRowAfter().run()
  }, [editor])

  const deleteColumn = useCallback(() => {
    editor?.chain().focus().deleteColumn().run()
  }, [editor])

  const deleteRow = useCallback(() => {
    editor?.chain().focus().deleteRow().run()
  }, [editor])

  const deleteTable = useCallback(() => {
    editor?.chain().focus().deleteTable().run()
  }, [editor])

  const ShortcutHint = ({ keys }: { keys: string[] }) => (
    <span className="text-xs text-muted-foreground ml-auto">
      {keys.join(' + ')}
    </span>
  )

  // Show loading skeleton until client-side hydration is complete
  if (!isMounted) {
    return (
      <div className={cn(
        "p-4 border border-gray-200 dark:border-gray-700 rounded-lg",
        "bg-gray-50 dark:bg-gray-800 animate-pulse",
        minHeight ? `min-h-[${minHeight}]` : 'min-h-[200px]',
        className
      )}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading editor...</span>
        </div>
      </div>
    )
  }

  if (!editor) return null

  return (
    <TooltipProvider>
      <div className="rich-text-editor border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        {editable && (
          <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {/* Undo/Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().undo().run()} 
                  disabled={!editor.can().undo()}
                  aria-label="Undo"
                >
                  <Undo className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Undo</span>
                  <ShortcutHint keys={['Ctrl', 'Z']} />
                </div>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().redo().run()} 
                  disabled={!editor.can().redo()}
                  aria-label="Redo"
                >
                  <Redo className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Redo</span>
                  <ShortcutHint keys={['Ctrl', 'Shift', 'Z']} />
                </div>
              </TooltipContent>
            </Tooltip>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5" role="separator" />
            
            {/* Clear Formatting */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                  aria-label="Clear formatting"
                >
                  <Eraser className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear Formatting</TooltipContent>
            </Tooltip>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5" role="separator" />
            
            {/* Headings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Heading styles">
                  <Heading1 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                  <Heading1 className="h-4 w-4 mr-2" aria-hidden="true" /> Heading 1
                  <ShortcutHint keys={['Ctrl', 'Alt', '1']} />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                  <Heading2 className="h-4 w-4 mr-2" aria-hidden="true" /> Heading 2
                  <ShortcutHint keys={['Ctrl', 'Alt', '2']} />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                  <Heading3 className="h-4 w-4 mr-2" aria-hidden="true" /> Heading 3
                  <ShortcutHint keys={['Ctrl', 'Alt', '3']} />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                  Paragraph
                  <ShortcutHint keys={['Ctrl', 'Alt', '0']} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5" role="separator" />
            
            {/* Text Formatting */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().toggleBold().run()} 
                  className={cn(editor.isActive('bold') && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Bold"
                  aria-pressed={editor.isActive('bold')}
                >
                  <Bold className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Bold</span>
                  <ShortcutHint keys={['Ctrl', 'B']} />
                </div>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().toggleItalic().run()} 
                  className={cn(editor.isActive('italic') && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Italic"
                  aria-pressed={editor.isActive('italic')}
                >
                  <Italic className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Italic</span>
                  <ShortcutHint keys={['Ctrl', 'I']} />
                </div>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().toggleUnderline().run()} 
                  className={cn(editor.isActive('underline') && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Underline"
                  aria-pressed={editor.isActive('underline')}
                >
                  <UnderlineIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Underline</span>
                  <ShortcutHint keys={['Ctrl', 'U']} />
                </div>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().toggleStrike().run()} 
                  className={cn(editor.isActive('strike') && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Strikethrough"
                  aria-pressed={editor.isActive('strike')}
                >
                  <Strikethrough className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Strikethrough</span>
                  <ShortcutHint keys={['Ctrl', 'Shift', 'X']} />
                </div>
              </TooltipContent>
            </Tooltip>
            
            {/* Color Picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  aria-label="Text color"
                  className={cn(editor.isActive('textStyle') && 'bg-gray-200 dark:bg-gray-700')}
                >
                  <Palette className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-2">
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {COLORS.map(color => (
                    <Tooltip key={color}>
                      <TooltipTrigger asChild>
                        <button 
                          className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          style={{ backgroundColor: color }}
                          onClick={() => editor.chain().focus().setColor(color).run()}
                          aria-label={`Apply color ${color}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>{color}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().unsetColor().run()}
                  className="text-center text-sm"
                >
                  Reset Color
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Font Family */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Font family">
                  <span className="text-xs font-medium">Font</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {FONT_FAMILIES.map(font => (
                  <DropdownMenuItem 
                    key={font.value}
                    onClick={() => {
                      if (font.value === '') {
                        editor.chain().focus().unsetFontFamily().run()
                      } else {
                        editor.chain().focus().setFontFamily(font.value).run()
                      }
                    }}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5" role="separator" />
            
            {/* Text Alignment */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().setTextAlign('left').run()} 
                  className={cn(editor.isActive({ textAlign: 'left' }) && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Align left"
                  aria-pressed={editor.isActive({ textAlign: 'left' })}
                >
                  <AlignLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Left</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().setTextAlign('center').run()} 
                  className={cn(editor.isActive({ textAlign: 'center' }) && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Align center"
                  aria-pressed={editor.isActive({ textAlign: 'center' })}
                >
                  <AlignCenter className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Center</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().setTextAlign('right').run()} 
                  className={cn(editor.isActive({ textAlign: 'right' }) && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Align right"
                  aria-pressed={editor.isActive({ textAlign: 'right' })}
                >
                  <AlignRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Right</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
                  className={cn(editor.isActive({ textAlign: 'justify' }) && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Justify"
                  aria-pressed={editor.isActive({ textAlign: 'justify' })}
                >
                  <AlignJustify className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Justify</TooltipContent>
            </Tooltip>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5" role="separator" />
            
            {/* Lists & Blocks */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().toggleBulletList().run()} 
                  className={cn(editor.isActive('bulletList') && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Bullet list"
                  aria-pressed={editor.isActive('bulletList')}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Bullet List</span>
                  <ShortcutHint keys={['Ctrl', 'Shift', '8']} />
                </div>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                  className={cn(editor.isActive('orderedList') && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Numbered list"
                  aria-pressed={editor.isActive('orderedList')}
                >
                  <ListOrdered className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Numbered List</span>
                  <ShortcutHint keys={['Ctrl', 'Shift', '7']} />
                </div>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().toggleBlockquote().run()} 
                  className={cn(editor.isActive('blockquote') && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Blockquote"
                  aria-pressed={editor.isActive('blockquote')}
                >
                  <Quote className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Quote</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
                  className={cn(editor.isActive('codeBlock') && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Code block"
                  aria-pressed={editor.isActive('codeBlock')}
                >
                  <Code className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Code Block</TooltipContent>
            </Tooltip>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5" role="separator" />
            
            {/* Insert Elements */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                  aria-label="Horizontal line"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Horizontal Line</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleOpenLinkDialog}
                  className={cn(editor.isActive('link') && 'bg-gray-200 dark:bg-gray-700')}
                  aria-label="Insert link"
                  aria-pressed={editor.isActive('link')}
                >
                  <LinkIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Insert Link</span>
                  <ShortcutHint keys={['Ctrl', 'K']} />
                </div>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowImageDialog(true)}
                  aria-label="Insert image"
                >
                  <ImageIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Image</TooltipContent>
            </Tooltip>
            
            {/* Table Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  aria-label="Table options"
                  className={cn(editor.isActive('table') && 'bg-gray-200 dark:bg-gray-700')}
                >
                  <TableIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowTableDialog(true)}>
                  Insert Table
                </DropdownMenuItem>
                {editor.isActive('table') && (
                  <>
                    <DropdownMenuItem onClick={addColumn}>
                      Add Column After
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={addRow}>
                      Add Row After
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={deleteColumn}>
                      Delete Column
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={deleteRow}>
                      Delete Row
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={deleteTable} 
                      className="text-red-600 dark:text-red-400"
                    >
                      Delete Table
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <EditorContent editor={editor} />

        {/* Image Dialog */}
        <Dialog open={showImageDialog} onOpenChange={handleCloseImageDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Insert Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="image-url">Image URL</Label>
                <Input 
                  id="image-url"
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://example.com/image.jpg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && imageUrl.trim()) {
                      e.preventDefault()
                      handleInsertImage()
                    }
                  }}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <div>
                <Label>Upload from device</Label>
                <div className="mt-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    id="image-upload" 
                    aria-label="Upload image from device"
                  />
                  <label htmlFor="image-upload">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      type="button" 
                      asChild
                      disabled={uploading}
                    >
                      <span>
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                            Choose Image
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseImageDialog}>
                Cancel
              </Button>
              <Button 
                onClick={handleInsertImage} 
                disabled={!imageUrl.trim() || uploading}
              >
                Insert Image
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Link Dialog */}
        <Dialog open={showLinkDialog} onOpenChange={handleCloseLinkDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editor?.isActive('link') ? 'Edit Link' : 'Insert Link'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="link-url">URL</Label>
                <Input 
                  id="link-url"
                  value={linkUrl} 
                  onChange={(e) => setLinkUrl(e.target.value)} 
                  placeholder="https://example.com"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && linkUrl.trim()) {
                      e.preventDefault()
                      handleInsertLink()
                    }
                  }}
                />
              </div>
              {editor?.state.selection.empty && (
                <div>
                  <Label htmlFor="link-text">Link Text (Optional)</Label>
                  <Input 
                    id="link-text"
                    value={linkText} 
                    onChange={(e) => setLinkText(e.target.value)} 
                    placeholder="Click here"
                  />
                </div>
              )}
              {editor?.isActive('link') && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => { 
                    editor.chain().focus().unsetLink().run()
                    handleCloseLinkDialog()
                  }}
                  aria-label="Remove link"
                >
                  Remove Link
                </Button>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseLinkDialog}>
                Cancel
              </Button>
              <Button 
                onClick={handleInsertLink} 
                disabled={!linkUrl.trim()}
              >
                {editor?.isActive('link') ? 'Update Link' : 'Insert Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Table Dialog */}
        <Dialog open={showTableDialog} onOpenChange={handleCloseTableDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Insert Table</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="table-rows">Rows</Label>
                <Input 
                  id="table-rows"
                  type="number" 
                  min={1} 
                  max={20} 
                  value={tableRows} 
                  onChange={(e) => setTableRows(Math.min(20, Math.max(1, parseInt(e.target.value) || TABLE_ROWS_DEFAULT)))} 
                />
              </div>
              <div>
                <Label htmlFor="table-cols">Columns</Label>
                <Input 
                  id="table-cols"
                  type="number" 
                  min={1} 
                  max={10} 
                  value={tableCols} 
                  onChange={(e) => setTableCols(Math.min(10, Math.max(1, parseInt(e.target.value) || TABLE_COLS_DEFAULT)))} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseTableDialog}>
                Cancel
              </Button>
              <Button onClick={handleInsertTable}>
                Insert Table
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default RichTextEditor