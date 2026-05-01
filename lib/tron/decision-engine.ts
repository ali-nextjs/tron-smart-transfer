// PATCH-04
// PATCH-10
import type {
    DetectTransferResult,
    EstimateEnergyResult,
    QuoteResult,
    TransferDecisionResult,
} from "@/lib/types/transfer"

export function buildTransferDecision(params: {
    detect: DetectTransferResult
    energy: EstimateEnergyResult
    quote?: QuoteResult | null
}): TransferDecisionResult {
    const { detect, energy, quote } = params

    const warnings: string[] = []
    const reasons: string[] = []

    const quoteStatus = quote?.quoteStatus ?? "Missing"
    const provider = quote?.provider ?? "Not selected"

    if (!detect.validation.isValid) {
        return {
            action: "reject",
            canProceed: false,
            nextStep: "Fix destination address first.",
            warnings: ["Destination address is invalid."],
            reasons: ["Transfer path should not continue until address validation passes."],
            summary: {
                transferType: detect.transferType,
                executionPath: detect.executionPath,
                estimatedEnergy: energy.estimatedEnergy,
                energyToBuy: energy.energyToBuy,
                quoteStatus,
                provider,
            },
        }
    }

    if (energy.estimateState !== "Ready") {
        return {
            action: "reject",
            canProceed: false,
            nextStep: "Enter a valid amount before continuing.",
            warnings: ["Energy estimate is not ready."],
            reasons: [
                `Current estimate state: ${energy.estimateState}.`,
                "Transfer decision should wait until estimation becomes ready.",
            ],
            summary: {
                transferType: detect.transferType,
                executionPath: detect.executionPath,
                estimatedEnergy: energy.estimatedEnergy,
                energyToBuy: energy.energyToBuy,
                quoteStatus,
                provider,
            },
        }
    }

    if (detect.transferType === "TRX Native") {
        return {
            action: "direct_transfer",
            canProceed: true,
            nextStep: "Native TRX transfer can proceed without energy purchase.",
            warnings,
            reasons: [
                "TRX native transfer does not require TRC20 energy purchase.",
                energy.fallbackBurn,
            ],
            summary: {
                transferType: detect.transferType,
                executionPath: detect.executionPath,
                estimatedEnergy: energy.estimatedEnergy,
                energyToBuy: energy.energyToBuy,
                quoteStatus,
                provider,
            },
        }
    }

    if (energy.energyToBuy <= 0) {
        warnings.push("USDT transfer path detected but energy purchase amount is zero.")

        return {
            action: "reject",
            canProceed: false,
            nextStep: "Review estimate inputs before requesting a quote.",
            warnings,
            reasons: [
                "USDT TRC20 transfer normally expects a positive energy purchase target.",
            ],
            summary: {
                transferType: detect.transferType,
                executionPath: detect.executionPath,
                estimatedEnergy: energy.estimatedEnergy,
                energyToBuy: energy.energyToBuy,
                quoteStatus,
                provider,
            },
        }
    }

    if (!quote) {
        return {
            action: "request_quote",
            canProceed: false,
            nextStep: "Request provider quote for the required energy amount.",
            warnings: energy.confidence === "Medium"
                ? ["Energy estimate confidence is medium. Review quote carefully."]
                : warnings,
            reasons: [
                "USDT transfer requires an energy purchase flow in the current logic.",
                `Estimated energy to buy: ${energy.energyToBuy}.`,
            ],
            summary: {
                transferType: detect.transferType,
                executionPath: detect.executionPath,
                estimatedEnergy: energy.estimatedEnergy,
                energyToBuy: energy.energyToBuy,
                quoteStatus,
                provider,
            },
        }
    }

    if (quote.quoteStatus === "Not ready") {
        return {
            action: "wait_for_quote",
            canProceed: false,
            nextStep: "Quote is not ready yet. Refresh or request again.",
            warnings,
            reasons: [
                "Quote provider has not returned a usable quote yet.",
            ],
            summary: {
                transferType: detect.transferType,
                executionPath: detect.executionPath,
                estimatedEnergy: energy.estimatedEnergy,
                energyToBuy: energy.energyToBuy,
                quoteStatus,
                provider,
            },
        }
    }

    if (quote.quoteStatus === "Mock quote ready") {
        return {
            action: "direct_transfer",
            canProceed: true,
            nextStep: "Quote is ready. Continue to final confirmation flow.",
            warnings: energy.confidence === "Medium"
                ? ["Quote is ready, but estimate confidence is medium."]
                : warnings,
            reasons: [
                "Energy quote is available.",
                `Provider selected: ${provider}.`,
                `Quoted price: ${quote.quotePrice}.`,
            ],
            summary: {
                transferType: detect.transferType,
                executionPath: detect.executionPath,
                estimatedEnergy: energy.estimatedEnergy,
                energyToBuy: energy.energyToBuy,
                quoteStatus,
                provider,
            },
        }
    }

    return {
        action: "wait_for_quote",
        canProceed: false,
        nextStep: "Unhandled quote state. Review provider response.",
        warnings: ["Quote returned an unknown status."],
        reasons: [`Unhandled quote status: ${quote.quoteStatus}`],
        summary: {
            transferType: detect.transferType,
            executionPath: detect.executionPath,
            estimatedEnergy: energy.estimatedEnergy,
            energyToBuy: energy.energyToBuy,
            quoteStatus,
            provider,
        },
    }
}