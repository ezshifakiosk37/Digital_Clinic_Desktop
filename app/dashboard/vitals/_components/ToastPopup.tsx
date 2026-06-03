// components/ToastPopup.tsx
'use client'
import { useEffect } from 'react'

interface ToastPopupProps {
  message: string
  visible: boolean
  onHide: () => void
  duration?: number // milliseconds
}

export default function ToastPopup({ message, visible, onHide, duration = 2000 }: ToastPopupProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onHide])

  if (!visible) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-green-600 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {message}
      </div>
    </div>
  )
}