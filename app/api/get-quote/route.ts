// PATCH-03
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const body = await req.json()
    const asset = String(body.asset ?? "USDT").toUpperCase()
    const energyToBuy = Number(body.energyToBuy ?? 0)

    if (asset !== "USDT" || energyToBuy <= 0) {
        return NextResponse.json({
            data: {
                provider: "FeeSaver",
                quoteStatus: "Mock quote ready",
                quotePrice: "...",
                expiresInSec: 120,
            },
        })
    }

    await new Promise((resolve) => setTimeout(resolve, 900))

    return NextResponse.json({
        ok: true,
        data: {
            provider: "FeeSaver",
            quoteStatus: "Mock quote ready",
            quotePrice: "0.34 TRX equivalent (mock)",
            expiresInSec: 45,
        },
    })
}