// PATCH-05
import { NextResponse } from "next/server"
import { detectTransfer } from "@/lib/tron/detect-transfer"
import { estimateEnergy } from "@/lib/tron/estimate-energy"
import { buildTransferDecision } from "@/lib/tron/decision-engine"
import type { QuoteResult } from "@/lib/types/transfer"

export async function POST(req: Request) {
    const body = await req.json()

    const destination = String(body.destination ?? "")
    const asset = String(body.asset ?? "USDT")
    const amount = Number(body.amount ?? 0)

    const quoteInput = body.quote ?? null

    const detect = detectTransfer(destination, asset)
    const energy = estimateEnergy(destination, asset, amount)

    const quote: QuoteResult | null =
        quoteInput &&
            typeof quoteInput === "object" &&
            typeof quoteInput.provider === "string" &&
            typeof quoteInput.quoteStatus === "string" &&
            typeof quoteInput.quotePrice === "string" &&
            typeof quoteInput.expiresInSec === "number"
            ? {
                provider: quoteInput.provider,
                quoteStatus: quoteInput.quoteStatus,
                quotePrice: quoteInput.quotePrice,
                expiresInSec: quoteInput.expiresInSec,
            }
            : null

    const data = buildTransferDecision({
        detect,
        energy,
        quote,
    })

    return NextResponse.json({
        ok: true,
        data,
    })
}