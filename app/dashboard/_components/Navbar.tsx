'use client'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import { useUserProfile } from '@/app/_context/UserProfileContext'
import { AndroidBridge } from '@/app/_utils/AndroidBridges/AndroidBridge'
import { usePathname } from 'next/navigation'

type NavbarVariant = 'demographic' | 'vitals' | 'onlineConsult' | 'pharmacy'

interface NavbarProps {
  variant: NavbarVariant
  onAddToken?: () => void
}

const variantConfig: Record<NavbarVariant, {
  subtitle: string
  showMeta: boolean
  showAddToken: boolean
}> = {
  demographic: { subtitle: '', showMeta: true, showAddToken: false },
  vitals: { subtitle: 'Vitals', showMeta: false, showAddToken: true },
  onlineConsult: { subtitle: 'Online Consultation', showMeta: false, showAddToken: false },
  pharmacy: { subtitle: 'Pharmacy', showMeta: false, showAddToken: false },
}

const Navbar: React.FC<NavbarProps> = ({ variant, onAddToken }) => {
  const config = variantConfig[variant]
  const { profile, loading } = useUserProfile()
  const [isConnecting, setIsConnecting] = useState(false)
  const [showReconnectButton, setShowReconnectButton] = useState(false)
  const pathname = usePathname()

  const isVitalsRoute = pathname?.includes('dashboard/vitals')

  // 1. Detect Android bridge availability
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AndroidNative) {
      setShowReconnectButton(true)
    } else {
      setShowReconnectButton(false)
    }
  }, [])

  // 2. Initialize Hardware Status Listener
  useEffect(() => {
    AndroidBridge.initHardwareListeners(
      (data) => {
        console.log("Sidebar global data received:", data)
      },
      (status) => {
        console.log("Hardware Status Update:", status)
        const finalStatuses = ["CONNECTED", "ERROR", "DEVICE_NOT_FOUND", "ALREADY_CONNECTED", "PERMISSION_REQUESTED", "OPEN_FAILED"]
        if (finalStatuses.includes(status)) {
          setIsConnecting(false)
        }
      }
    )
  }, [])

  // 3. Reconnect Trigger
  const onReconnectPress = () => {
    setIsConnecting(true)
    const success = AndroidBridge.handleReconnect()
    if (!success) {
      setIsConnecting(false)
      console.warn("Bridge not available.")
    }
  }

  return (
    <nav className="w-full bg-[#0297d6] text-white px-4 py-4 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">

        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">

            {/* Row 1: EZShifa | Digital Health Clinic */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-bold tracking-tight whitespace-nowrap">
                EZShifa
              </span>
              <span className="opacity-40 text-lg shrink-0">|</span>
              <span className="text-lg font-semibold whitespace-nowrap">
                Digital Health Clinic
              </span>
            </div>

            {/* Row 2 — vitals / onlineConsult / pharmacy: prominent subtitle */}
            {!config.showMeta && config.subtitle && (
              <p className="text-sm font-bold text-white mt-0.5 leading-none tracking-wide">
                {config.subtitle}
              </p>
            )}

            {/* Row 2 — demographic only: Project & Location from DB */}
            {config.showMeta && (
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                {loading ? (
                  <span className="text-xs text-white/50 italic">Loading...</span>
                ) : (
                  <>
                    {profile?.name && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-black uppercase tracking-widest text-white/100">
                          Project:
                        </span>
                        <span className="text-sm font-bold text-white whitespace-nowrap">
                          {profile.name}
                        </span>
                      </div>
                    )}
                    {profile?.location && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/100">
                          Location:
                        </span>
                        <span className="text-sm font-bold text-white whitespace-nowrap">
                          {profile.location}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right: Buttons */}
        <div className='flex items-center gap-2'>

          {/* Reconnect Button — inline, only on dashboard/vitals route with Android bridge */}
          {showReconnectButton && isVitalsRoute && (
            <Button
              size="sm"
              onClick={onReconnectPress}
              disabled={isConnecting}
              className="bg-white text-[#0297d6] hover:bg-white/90 font-bold text-sm h-9 px-4 shrink-0 disabled:opacity-70 disabled:cursor-wait"
              title="Reconnect to ESP32"
            >
              <RefreshCw
                size={16}
                className={`mr-1.5 transition-transform duration-700 ${isConnecting ? 'animate-spin' : ''}`}
              />
              {isConnecting ? 'Connecting...' : 'Reconnect'}
            </Button>
          )}

          {/* Add Token Button — vitals only */}
          {config.showAddToken && onAddToken && (
            <Button
              size="sm"
              onClick={onAddToken}
              className="bg-white text-[#0297d6] hover:bg-white/90 font-bold text-sm h-9 px-4 shrink-0"
            >
              + Add Token
            </Button>
          )}

        </div>
      </div>
    </nav>
  )
}

export default Navbar