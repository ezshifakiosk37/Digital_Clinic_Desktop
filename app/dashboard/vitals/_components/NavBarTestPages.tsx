// _components/NavBarTestPages.tsx
'use client'
import React from 'react'

interface NavBarTestPagesProps {
    title: string
    sessionName?: string
    sessionPhone?: string
    sessionToken?: string
    rightSlot?: React.ReactNode
}

const NavBarTestPages: React.FC<NavBarTestPagesProps> = ({
    title,
    sessionName = '',
    sessionPhone = '',
    sessionToken = '',
    rightSlot,
}) => {
    return (
        <nav className="w-full bg-[#0297d6] text-white px-4 py-4 shadow-md shrink-0 sticky top-0 z-10">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-2xl font-bold tracking-tight whitespace-nowrap">EZShifa</span>
                        <span className="opacity-40 text-lg shrink-0">|</span>
                        <span className="text-lg font-semibold whitespace-nowrap">Digital Health Clinic</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5 leading-none">{title}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {(sessionToken || sessionName || sessionPhone) && (
                        <div className="grid gap-x-2 gap-y-0.5 text-white text-xs font-medium" style={{ gridTemplateColumns: 'auto 1fr' }}>
                            {sessionName && (
                                <>
                                    <span className="uppercase tracking-wider text-[10px] md:text-sm font-normal opacity-90">NAME:</span>
                                    <span className="font-bold md:text-sm">{sessionName}</span>
                                </>
                            )}
                            {sessionPhone && (
                                <>
                                    <span className="uppercase tracking-wider text-[10px] md:text-sm font-normal opacity-90">PHONE:</span>
                                    <span className="font-bold md:text-sm">{sessionPhone}</span>
                                </>
                            )}
                            {sessionToken && (
                                <>
                                    <span className="uppercase tracking-wider text-[10px] md:text-sm font-normal opacity-90">TOKEN:</span>
                                    <span className="font-bold md:text-sm">#{sessionToken}</span>
                                </>
                            )}
                        </div>
                    )}
                    {rightSlot}
                </div>
            </div>
        </nav>
    )
}

export default NavBarTestPages