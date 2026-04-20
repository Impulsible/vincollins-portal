'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Sparkles, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const WHATSAPP_NUMBER = '+2349121155554'
const DEFAULT_MESSAGE = 'Hello Vincollins College, I have a question and would appreciate your assistance.'

// ✅ RECOMMENDED PROFESSIONAL QUICK REPLIES
const QUICK_REPLIES = [
  { 
    text: '📋 Admission Inquiry', 
    message: 'Hello Vincollins College, I am interested in admission for my child. Please provide details on requirements, application process, and school fees.' 
  },
  { 
    text: '🏫 Schedule a Tour', 
    message: 'Hello Vincollins College, I would like to schedule a school tour. Please let me know the available dates and times.' 
  },
  { 
    text: '📚 Academic Programs', 
    message: 'Hello Vincollins College, I would like information about your academic programs (Nursery, Primary, and College sections).' 
  },
  { 
    text: '💰 Fees Structure', 
    message: 'Hello Vincollins College, please provide the current school fees structure including tuition and other charges.' 
  },
  { 
    text: '🎓 Entrance Exam', 
    message: 'Hello Vincollins College, I would like to know about the entrance examination dates and registration process.' 
  },
  { 
    text: '💬 General Inquiry', 
    message: 'Hello Vincollins College, I have a general question and would appreciate your assistance.' 
  },
]

export function WhatsAppWidget() {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [hasInteracted, setHasInteracted] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const interacted = localStorage.getItem('whatsapp_interacted')
    if (interacted) {
      setHasInteracted(true)
    }
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(message || DEFAULT_MESSAGE)
    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank')
    setIsOpen(false)
    setMessage('')
    localStorage.setItem('whatsapp_interacted', 'true')
    setHasInteracted(true)
  }

  const handleQuickReply = (replyMessage: string) => {
    setMessage(replyMessage)
    inputRef.current?.focus()
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Simple overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Modal Dialog - Centered on all screens */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          >
            <div 
              className="w-full max-w-md max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Vincollins College</h3>
                      <p className="text-xs text-green-100">Online • Usually replies within minutes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-white/20 rounded-full p-1.5 transition-colors"
                    aria-label="Close chat"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Content - Scrollable */}
              <div className="p-4 bg-gray-50 overflow-y-auto flex-1">
                {/* Welcome message */}
                <div className="bg-white rounded-xl p-3 mb-4 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-800">
                    👋 <span className="font-medium">Welcome to Vincollins College!</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    How can we help you today? Choose a quick reply or type your message below.
                  </p>
                </div>
                
                {/* Quick replies - Recommended Professional Set */}
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Frequently Asked
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_REPLIES.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(reply.message)}
                        className="text-left text-sm bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-green-300"
                      >
                        {reply.text}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Message input */}
                <div className="relative">
                  <label className="text-xs text-gray-500 font-medium mb-1.5 block">
                    Your Message
                  </label>
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full px-4 py-3 pr-12 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none shadow-sm"
                    rows={3}
                  />
                  <button
                    onClick={handleWhatsAppClick}
                    className={cn(
                      "absolute right-2 bottom-2 p-2 rounded-full transition-all",
                      message.trim() 
                        ? "bg-green-600 text-white hover:bg-green-700 shadow-md" 
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                    disabled={!message.trim()}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Press the send button to open WhatsApp
                </p>
              </div>
              
              {/* Footer */}
              <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/')
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 py-1.5 transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 md:bottom-6 md:right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={!hasInteracted ? {
            boxShadow: [
              '0 4px 12px rgba(34, 197, 94, 0.3)',
              '0 8px 24px rgba(34, 197, 94, 0.5)',
              '0 4px 12px rgba(34, 197, 94, 0.3)',
            ]
          } : {}}
          transition={!hasInteracted ? { duration: 2, repeat: 2 } : { duration: 0.2 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-full shadow-lg transition-all duration-200 flex items-center gap-2",
            isOpen ? "p-2" : "p-3 sm:px-5 sm:py-3"
          )}
          aria-label={isOpen ? "Close chat" : "Chat with us on WhatsApp"}
        >
          {isOpen ? (
            <X className="h-5 w-5 sm:h-5 sm:w-5" />
          ) : (
            <>
              <MessageCircle className="h-5 w-5 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline text-sm font-medium">
                Chat with us
              </span>
            </>
          )}
        </motion.button>
      </div>
    </>
  )
}