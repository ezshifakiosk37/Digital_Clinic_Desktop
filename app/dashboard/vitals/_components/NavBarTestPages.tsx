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
                        <div className="flex flex-col items-end gap-0.5">
                            {sessionToken && (
                                <span className="text-white text-xs font-medium">
                                    <span className="text-white uppercase tracking-wider text-[10px] md:text-lg lg:text-sm mr-1">TOKEN:</span>
                                    <span className="font-bold md:text-lg lg:text-sm">#{sessionToken}</span>
                                </span>
                            )}
                            {sessionName && (
                                <span className="text-white text-xs font-medium">
                                    <span className="text-white uppercase tracking-wider text-[10px] md:text-lg lg:text-sm mr-1">NAME:</span>
                                    <span className="font-bold md:text-lg lg:text-sm">{sessionName}</span>
                                </span>
                            )}
                            {sessionPhone && (
                                <span className="text-white text-xs font-medium">
                                    <span className="text-white uppercase tracking-wider text-[10px] mr-1 md:text-lg lg:text-sm">PHONE:</span>
                                    <span className="font-bold md:text-lg lg:text-sm">{sessionPhone}</span>
                                </span>
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