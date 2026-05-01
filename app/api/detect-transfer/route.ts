import { NextResponse } from "next/server"
import { detectTransfer } from "@/lib/tron/detect-transfer"

export async function POST(req: Request) {
    const body = await req.json()

    const destination = String(body.destination ?? "")
    const asset = String(body.asset ?? "USDT")

    const data = detectTransfer(destination, asset)

    return NextResponse.json({
        ok: true,
        data,
    })
}