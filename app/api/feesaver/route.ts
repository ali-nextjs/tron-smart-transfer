// PATCH-21
import { NextResponse } from "next/server"

type FeeSaverAction = "quote" | "buy"

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const action = String(body.action ?? "") as FeeSaverAction
        const walletAddress = String(body.walletAddress ?? "")
        const energyAmount = Number(body.energyAmount ?? 0)

        if (!walletAddress || !walletAddress.startsWith("T")) {
            return NextResponse.json(
                { ok: false, error: "Valid TRON wallet address is required." },
                { status: 400 }
            )
        }

        if (!energyAmount || energyAmount <= 0) {
            return NextResponse.json(
                { ok: false, error: "Valid energy amount is required." },
                { status: 400 }
            )
        }

        if (action === "quote") {
            return NextResponse.json({
                ok: true,
                provider: "feesaver",
                mode: "mock",
                energyAmount,
                priceTrx: Number((energyAmount / 10000).toFixed(2)),
                expiresInSeconds: 120,
            })
        }

        if (action === "buy") {
            return NextResponse.json({
                ok: true,
                provider: "feesaver",
                mode: "mock",
                energyAmount,
                priceTrx: Number((energyAmount / 10000).toFixed(2)),
                txId: `mock-feesaver-buy-${Date.now()}`,
                status: "success",
            })
        }

        return NextResponse.json(
            { ok: false, error: "Unsupported FeeSaver action." },
            { status: 400 }
        )
    } catch {
        return NextResponse.json(
            { ok: false, error: "FeeSaver request failed." },
            { status: 500 }
        )
    }
}