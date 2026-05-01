import type { AddressValidationResult } from "@/lib/types/transfer"

export function validateTronAddress(value: string): AddressValidationResult {
    const normalized = value.trim()

    if (!normalized) {
        return {
            isValid: false,
            message: "Destination wallet is required",
            normalized,
        }
    }

    if (!normalized.startsWith("T")) {
        return {
            isValid: false,
            message: "TRON address must start with T",
            normalized,
        }
    }

    if (normalized.length !== 34) {
        return {
            isValid: false,
            message: "TRON address must be 34 characters",
            normalized,
        }
    }

    const tronLikePattern = /^T[1-9A-HJ-NP-Za-km-z]{33}$/

    if (!tronLikePattern.test(normalized)) {
        return {
            isValid: false,
            message: "Address format looks invalid",
            normalized,
        }
    }

    return {
        isValid: true,
        message: "Address format valid",
        normalized,
    }
}