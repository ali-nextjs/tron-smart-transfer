import { validateTronAddress } from "@/lib/tron/validate-address"
import type { EstimateEnergyResult } from "@/lib/types/transfer"

export function estimateEnergy(
    destination: string,
    asset: string,
    amountInput: number
): EstimateEnergyResult {
    const validation = validateTronAddress(destination)
    const normalizedAsset = asset.toUpperCase()
    const hasValidAmount = Number.isFinite(amountInput) && amountInput > 0

    if (!validation.isValid || !hasValidAmount) {
        return {
            estimatedEnergy: 0,
            energyToBuy: 0,
            confidence: "Low",
            estimateProfile: "Pending",
            estimateState: !validation.isValid ? "Blocked" : "Waiting for valid amount",
            fallbackBurn:
                normalizedAsset === "TRX"
                    ? "No energy purchase needed for native send"
                    : "TRX burn likely if energy unavailable",
        }
    }

    if (normalizedAsset === "TRX") {
        return {
            estimatedEnergy: 0,
            energyToBuy: 0,
            confidence: "High",
            estimateProfile: "Native path",
            estimateState: "Ready",
            fallbackBurn: "No energy purchase needed for native send",
        }
    }

    let estimatedEnergy = 0
    let estimateProfile = "Standard"

    if (amountInput < 10) {
        estimatedEnergy = 65000
        estimateProfile = "Light load"
    } else if (amountInput < 100) {
        estimatedEnergy = 91500
        estimateProfile = "Standard"
    } else {
        estimatedEnergy = 108000
        estimateProfile = "Congested"
    }

    return {
        estimatedEnergy,
        energyToBuy: Math.ceil(estimatedEnergy * 1.04),
        confidence: estimateProfile === "Congested" ? "Medium" : "High",
        estimateProfile,
        estimateState: "Ready",
        fallbackBurn: "TRX burn likely if energy unavailable",
    }
}