// PATCH-21
"use client"

import { useCallback, useMemo, useState } from "react"

type FeeSaverStatus =
    | "idle"
    | "buying"
    | "success"
    | "failed"

type FeeSaverPurchase = {
    provider: "feesaver"
    energyAmount: number
    priceTrx: number
    txId: string
}

type BuyEnergyArgs = {
    walletAddress: string
    energyAmount: number
}

export function useFeeSaver() {
    const [status, setStatus] = useState<FeeSaverStatus>("idle")
    const [purchase, setPurchase] = useState<FeeSaverPurchase | null>(null)
    const [error, setError] = useState("")

    const buyEnergy = useCallback(
        async ({ walletAddress, energyAmount }: BuyEnergyArgs) => {
            setStatus("buying")
            setError("")
            setPurchase(null)

            try {
                const response = await fetch("/api/feesaver", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action: "buy",
                        walletAddress,
                        energyAmount,
                    }),
                })

                const data = await response.json()

                if (!response.ok || !data.ok) {
                    throw new Error(data.error || "FeeSaver request failed.")
                }

                const result: FeeSaverPurchase = {
                    provider: "feesaver",
                    energyAmount: Number(data.energyAmount ?? energyAmount),
                    priceTrx: Number(data.priceTrx ?? 0),
                    txId: String(data.txId ?? ""),
                }

                setPurchase(result)
                setStatus("success")
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "FeeSaver energy purchase failed."
                )
                setStatus("failed")
            }
        },
        []
    )

    const resetFeeSaver = useCallback(() => {
        setStatus("idle")
        setPurchase(null)
        setError("")
    }, [])

    return useMemo(
        () => ({
            status,
            purchase,
            error,
            isBuying: status === "buying",
            isSuccess: status === "success",
            isFailed: status === "failed",
            buyEnergy,
            resetFeeSaver,
        }),
        [status, purchase, error, buyEnergy, resetFeeSaver]
    )
}