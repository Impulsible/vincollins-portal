"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    const ho = () => { setIsOnline(true); toast.success("Network restored!") }
    const hf = () => { setIsOnline(false); toast.warning("Network disconnected!") }
    setIsOnline(navigator.onLine)
    window.addEventListener("online", ho)
    window.addEventListener("offline", hf)
    return () => { window.removeEventListener("online", ho); window.removeEventListener("offline", hf) }
  }, [])
  return isOnline
}