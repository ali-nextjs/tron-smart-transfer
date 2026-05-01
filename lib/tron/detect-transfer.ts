import { validateTronAddress } from "@/lib/tron/validate-address"
import type { DetectTransferResult } from "@/lib/types/transfer"

export function detectTransfer(
    destination: string,
    asset: string
): DetectTransferResult {
    const validation = validateTronAddress(destination)
    const normalizedAsset = asset.toUpperCase()

    const transferType = normalizedAsset === "TRX" ? "TRX Native" : "USDT TRC20"
    const executionPath =
        normalizedAsset === "TRX" ? "Native transfer" : "Smart contract transfer"
    const contractRoute =
        normalizedAsset === "TRX"
            ? "Native TRON transfer"
            : "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"

    return {
        transferType,
        executionPath,
        contractRoute,
        validation,
    }
}