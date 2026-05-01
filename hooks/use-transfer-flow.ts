// PATCH-15
// PATCH-11
// PATCH-07
"use client"

// PATCH-10
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
    DetectTransferResult,
    EstimateEnergyResult,
    QuoteResult,
    TransferDecisionResult,
    TransferReadiness,
} from "@/lib/types/transfer"

interface UseTransferFlowParams {
    destination: string
    amount: string
    asset: string
}

interface UseTransferFlowResult {
    detectData: DetectTransferResult | null
    energyData: EstimateEnergyResult | null
    quoteData: QuoteResult | null
    decisionData: TransferDecisionResult | null
    readinessData: TransferReadiness

    isDetectLoading: boolean
    isEnergyLoading: boolean
    isQuoteLoading: boolean
    isDecisionLoading: boolean

    quoteState: "idle" | "loading" | "ready"

    hasValidAmount: boolean
    normalizedAmount: number
    canRunAnalysis: boolean

    refreshAnalysis: () => Promise<void>
    getQuote: () => Promise<void>
    resetQuote: () => Promise<void>
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error(`Request failed: ${url}`)
    }

    const json = await response.json()
    return json.data as T
}

/* PATCH-11 */
function isValidTronAddress(value: string): boolean {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value.trim())
}

/* PATCH-11 */
function parseNormalizedAmount(value: string): number {
    const normalizedValue = value.replace(",", ".").trim()
    const parsed = Number(normalizedValue)

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 0
    }

    return parsed
}

/* PATCH-11 */
function buildTransferReadiness(params: {
    destination: string
    amount: string
}): TransferReadiness {
    const trimmedDestination = params.destination.trim()
    const trimmedAmount = params.amount.trim()

    const addressValid =
        trimmedDestination.length > 0 ? isValidTronAddress(trimmedDestination) : false

    const normalizedAmount = parseNormalizedAmount(trimmedAmount)
    const amountValid = normalizedAmount > 0

    if (!trimmedDestination && !trimmedAmount) {
        return {
            status: "blocked",
            title: "Transfer input required",
            message: "Enter destination wallet and transfer amount to start analysis.",
            addressValid: false,
            amountValid: false,
            normalizedAmount: 0,
        }
    }

    if (!trimmedDestination) {
        return {
            status: "blocked",
            title: "Destination required",
            message: "Enter a valid TRON destination address.",
            addressValid: false,
            amountValid,
            normalizedAmount,
        }
    }

    if (!addressValid) {
        return {
            status: "blocked",
            title: "Invalid destination",
            message: "Destination must be a valid TRON wallet address.",
            addressValid: false,
            amountValid,
            normalizedAmount,
        }
    }

    if (!trimmedAmount) {
        return {
            status: "blocked",
            title: "Amount required",
            message: "Enter the transfer amount to continue.",
            addressValid: true,
            amountValid: false,
            normalizedAmount: 0,
        }
    }

    if (!amountValid) {
        return {
            status: "blocked",
            title: "Invalid amount",
            message: "Amount must be a positive number.",
            addressValid: true,
            amountValid: false,
            normalizedAmount: 0,
        }
    }

    if (normalizedAmount < 1) {
        return {
            status: "warning",
            title: "Low amount",
            message: "Small transfers may be inefficient relative to network and energy costs.",
            addressValid: true,
            amountValid: true,
            normalizedAmount,
        }
    }

    return {
        status: "ready",
        title: "Ready for analysis",
        message: "Destination and amount passed base validation.",
        addressValid: true,
        amountValid: true,
        normalizedAmount,
    }
}

export function useTransferFlow({
    destination,
    amount,
    asset,
}: UseTransferFlowParams): UseTransferFlowResult {
    const [detectData, setDetectData] = useState<DetectTransferResult | null>(null)
    const [energyData, setEnergyData] = useState<EstimateEnergyResult | null>(null)
    const [quoteData, setQuoteData] = useState<QuoteResult | null>(null)
    const [decisionData, setDecisionData] = useState<TransferDecisionResult | null>(null)

    const [isDetectLoading, setIsDetectLoading] = useState(false)
    const [isEnergyLoading, setIsEnergyLoading] = useState(false)
    const [isQuoteLoading, setIsQuoteLoading] = useState(false)
    const [isDecisionLoading, setIsDecisionLoading] = useState(false)

    /* PATCH-11 */
    const readinessData = useMemo(() => {
        return buildTransferReadiness({
            destination,
            amount,
        })
    }, [destination, amount])

    const normalizedAmount = readinessData.normalizedAmount
    const hasValidAmount = readinessData.amountValid
    const canRunAnalysis =
        readinessData.status === "ready" || readinessData.status === "warning"

    const quoteState: "idle" | "loading" | "ready" = isQuoteLoading
        ? "loading"
        : quoteData
            ? "ready"
            : "idle"

    // PATCH-15
    // PATCH-16B
    const quoteDataRef = useRef<QuoteResult | null>(null)

    useEffect(() => {
        quoteDataRef.current = quoteData
    }, [quoteData])
    // PATCH-16B
    const refreshDecision = useCallback(
        async (nextQuote?: QuoteResult | null) => {
            if (!canRunAnalysis) {
                setDecisionData(null)
                return
            }

            setIsDecisionLoading(true)

            try {
                const resolvedQuote =
                    nextQuote === undefined ? quoteDataRef.current : nextQuote

                const decision = await postJson<TransferDecisionResult>(
                    "/api/build-decision",
                    {
                        destination,
                        asset,
                        amount: normalizedAmount,
                        quote: resolvedQuote,
                    }
                )

                setDecisionData(decision)
            } finally {
                setIsDecisionLoading(false)
            }
        },
        [asset, canRunAnalysis, destination, normalizedAmount]
    )

    const refreshAnalysis = useCallback(async () => {
        if (!canRunAnalysis) {
            setDetectData(null)
            setEnergyData(null)
            setQuoteData(null)
            setDecisionData(null)
            return
        }

        setIsDetectLoading(true)
        setIsEnergyLoading(true)

        try {
            const [detect, energy] = await Promise.all([
                postJson<DetectTransferResult>("/api/detect-transfer", {
                    destination,
                    asset,
                }),
                postJson<EstimateEnergyResult>("/api/estimate-energy", {
                    destination,
                    asset,
                    amount: normalizedAmount,
                }),
            ])

            setDetectData(detect)
            setEnergyData(energy)
            setQuoteData(null)
            await refreshDecision(null)
        } finally {
            setIsDetectLoading(false)
            setIsEnergyLoading(false)
        }
    }, [asset, canRunAnalysis, destination, normalizedAmount, refreshDecision])

    const getQuote = useCallback(async () => {
        if (!canRunAnalysis || !hasValidAmount) return

        setIsQuoteLoading(true)

        try {
            const currentEnergy =
                energyData?.energyToBuy && energyData.energyToBuy > 0
                    ? energyData.energyToBuy
                    : 0

            const quote = await postJson<QuoteResult>("/api/get-quote", {
                asset,
                energyToBuy: currentEnergy,
            })

            setQuoteData(quote)
            // await refreshDecision(quote)
        } finally {
            setIsQuoteLoading(false)
        }
    }, [asset, canRunAnalysis, energyData?.energyToBuy, hasValidAmount])

    // PATCH-15
    const resetQuote = useCallback(async () => {
        setQuoteData(null)
        await refreshDecision(null)
    }, [refreshDecision])

    useEffect(() => {
        const hasInput = destination.trim().length > 0 || amount.trim().length > 0

        if (!hasInput) {
            setDetectData(null)
            setEnergyData(null)
            setQuoteData(null)
            setDecisionData(null)
            return
        }

        if (!canRunAnalysis) {
            setDetectData(null)
            setEnergyData(null)
            setQuoteData(null)
            setDecisionData(null)
            return
        }

        refreshAnalysis()
    }, [amount, asset, canRunAnalysis, destination, refreshAnalysis])

    useEffect(() => {
        if (!canRunAnalysis) return
        if (!detectData || !energyData) return
        refreshDecision()
    }, [canRunAnalysis, detectData, energyData, refreshDecision])

    return {
        detectData,
        energyData,
        quoteData,
        decisionData,
        readinessData,

        isDetectLoading,
        isEnergyLoading,
        isQuoteLoading,
        isDecisionLoading,

        quoteState,

        hasValidAmount,
        normalizedAmount,
        canRunAnalysis,

        refreshAnalysis,
        getQuote,
        resetQuote,
    }
}