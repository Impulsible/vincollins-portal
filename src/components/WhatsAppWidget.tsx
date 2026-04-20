// components/WhatsAppWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const WHATSAPP_NUMBER = '+2349121155554'
const WHATSAPP_MESSAGE = 'Hello Vincollins College, I am interested in applying for admission...'

export function WhatsAppWidget() {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(message || WHATSAPP_MESSAGE)
    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank')
    setIsOpen(false)
    setMessage('')
  }

  // Don't render anything on the server
  if (!mounted) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-2xl shadow-2xl border overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <h3 className="font-semibold text-sm sm:text-base">Chat on WhatsApp</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-green-100 mt-1">Response: Usually within minutes</p>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-3">
              Have questions about admission? Chat with our team on WhatsApp.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={3}
            />
            <Button
              onClick={handleWhatsAppClick}
              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Start Chat
            </Button>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 duration-200 flex items-center gap-2 group"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="hidden sm:inline max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          Chat with us
        </span>
      </button>
    </div>
  )
}