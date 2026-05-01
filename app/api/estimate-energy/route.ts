import { NextResponse } from "next/server"
import { estimateEnergy } from "@/lib/tron/estimate-energy"

export async function POST(req: Request) {
    const body = await req.json()

    const destination = String(body.destination ?? "")
    const asset = String(body.asset ?? "USDT")
    const amount = Number(body.amount ?? 0)

    const data = estimateEnergy(destination, asset, amount)

    return NextResponse.json({
        ok: true,
        data,
    })
}