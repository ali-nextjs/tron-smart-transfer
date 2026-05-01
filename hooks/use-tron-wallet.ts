// PATCH-18
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type TronWalletStatus =
    | "checking"
    | "not_installed"
    | "disconnected"
    | "connected"

type TronWalletState = {
    status: TronWalletStatus
    address: string
    network: string
    isInstalled: boolean
    isConnected: boolean
    connect: () => Promise<void>
    disconnect: () => void
}

declare global {
    interface Window {
        tronWeb?: any
        tronLink?: {
            request?: (args: { method: string }) => Promise<any>
        }
    }
}

export function useTronWallet(): TronWalletState {
    const [status, setStatus] = useState<TronWalletStatus>("checking")
    const [address, setAddress] = useState("")
    const [network, setNetwork] = useState("unknown")
    // PATCH-24A
    const [isManuallyDisconnected, setIsManuallyDisconnected] = useState(false)

    const disconnect = useCallback(() => {
        setIsManuallyDisconnected(true)
        setAddress("")
        setStatus("disconnected")
        setNetwork("unknown")
    }, [])

    const detectWallet = useCallback(() => {
        const installed = typeof window !== "undefined" && !!window.tronLink

        if (!installed) {
            setStatus("not_installed")
            setAddress("")
            setNetwork("unknown")
            return
        }
        // PATCH-24A
        if (isManuallyDisconnected) {
            setStatus("disconnected")
            setAddress("")
            setNetwork("unknown")
            return
        }
        const currentAddress =
            window.tronWeb?.defaultAddress?.base58 ||
            window.tronWeb?.defaultAddress?.hex ||
            ""

        const currentNetwork =
            window.tronWeb?.fullNode?.host ||
            window.tronWeb?.eventServer?.host ||
            "unknown"

        setNetwork(currentNetwork)

        if (currentAddress) {
            setAddress(currentAddress)
            setStatus("connected")
        } else {
            setAddress("")
            setStatus("disconnected")
        }
    }, [isManuallyDisconnected])

    useEffect(() => {
        detectWallet()

        const timer = window.setInterval(() => {
            detectWallet()
        }, 1500)

        return () => window.clearInterval(timer)
    }, [detectWallet])

    const connect = useCallback(async () => {
        if (!window.tronLink?.request) {
            setStatus("not_installed")
            return
        }

        try {
            const result = await window.tronLink.request({
                method: "tron_requestAccounts",
            })

            if (result?.code === 200 || result === true) {
                detectWallet()
            } else {
                setStatus("disconnected")
            }
        } catch {
            setStatus("disconnected")
        }
    }, [detectWallet])


    return useMemo(
        () => ({
            status,
            address,
            network,
            isInstalled: status !== "not_installed",
            isConnected: status === "connected" && !!address,
            connect,
            disconnect,
        }),
        [status, address, network, connect, disconnect]
    )
}