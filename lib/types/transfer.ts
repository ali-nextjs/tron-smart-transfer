// PATCH-11
// PATCH-10
export interface TronAddressValidation {
    isValid: boolean
    message: string
}

export interface TransferReadiness {
    status: "blocked" | "warning" | "ready"
    title: string
    message: string
    addressValid: boolean
    amountValid: boolean
    normalizedAmount: number
}

export interface DetectTransferResult {
    transferType: string
    executionPath: string
    contractRoute: string
    validation: TronAddressValidation
}

export interface EstimateEnergyResult {
    estimatedEnergy: number
    energyToBuy: number
    confidence: "Low" | "Medium" | "High"
    estimateProfile: string
    estimateState: string
    fallbackBurn: string
}

export interface QuoteResult {
    provider: string
    quoteStatus: string
    quotePrice: string
    expiresInSec: number
}

export type TransferDecisionAction =
    | "direct_transfer"
    | "request_quote"
    | "wait_for_quote"
    | "reject"

export interface TransferDecisionSummary {
    transferType: string
    executionPath: string
    estimatedEnergy: number
    energyToBuy: number
    quoteStatus: string
    provider: string
}

export interface TransferDecisionResult {
    action: TransferDecisionAction
    canProceed: boolean
    nextStep: string
    warnings: string[]
    reasons: string[]
    summary: TransferDecisionSummary
}