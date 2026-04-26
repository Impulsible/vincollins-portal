// src/components/student/exam/header/NetworkStatus.tsx
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff } from 'lucide-react'

interface NetworkStatusProps {
  isOnline: boolean
}

export function NetworkStatus({ isOnline }: NetworkStatusProps) {
  return (
    <Badge
      className={`px-2 py-0.5 text-xs ${
        isOnline
          ? 'bg-green-500/20 text-green-400'
          : 'bg-red-500/20 text-red-400'
      }`}
    >
      {isOnline ? (
        <Wifi className="h-3 w-3 mr-1" />
      ) : (
        <WifiOff className="h-3 w-3 mr-1" />
      )}
      {isOnline ? 'Online' : 'Offline'}
    </Badge>
  )
}
