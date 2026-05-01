// PATCH-22
"use client"

import { useCallback, useMemo, useState } from "react"

type TronExecutionStatus =
    | "idle"
    | "preparing"
    | "waiting_wallet"
    | "success"
    | "failed"

type ExecuteTransferArgs = {
    asset: "TRX" | "USDT"
    fromAddress: string
    toAddress: string
    amount: number
}

type TronExecutionResult = {
    txId: string
    asset: "TRX" | "USDT"
    amount: number
    toAddress: string
}

export function useTronExecution() {
    const [status, setStatus] = useState<TronExecutionStatus>("idle")
    const [result, setResult] = useState<TronExecutionResult | null>(null)
    const [error, setError] = useState("")
    // PATCH-25
    const USDT_TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
    const USDT_DECIMALS = 6
    // PATCH-23
    // PATCH-25
    const executeTransfer = useCallback(async (args: ExecuteTransferArgs) => {
        setStatus("preparing")
        setResult(null)
        setError("")

        try {
            if (!args.fromAddress || !args.toAddress || !args.amount) {
                throw new Error("Missing transfer execution inputs.")
            }

            if (typeof window === "undefined" || !window.tronWeb) {
                throw new Error("TronLink wallet is not available.")
            }

            const tronWeb = window.tronWeb

            if (!tronWeb.isAddress(args.toAddress)) {
                throw new Error("Invalid TRON destination address.")
            }

            setStatus("waiting_wallet")

            if (args.asset === "TRX") {
                const amountSun = Math.floor(args.amount * 1_000_000)

                const unsignedTx = await tronWeb.transactionBuilder.sendTrx(
                    args.toAddress,
                    amountSun,
                    args.fromAddress
                )

                const signedTx = await tronWeb.trx.sign(unsignedTx)
                const broadcast = await tronWeb.trx.sendRawTransaction(signedTx)

                if (!broadcast?.result) {
                    throw new Error("TRX transaction broadcast failed.")
                }

                const txId = broadcast.txid || signedTx.txID || `trx-${Date.now()}`

                setResult({
                    txId,
                    asset: "TRX",
                    amount: args.amount,
                    toAddress: args.toAddress,
                })

                setStatus("success")
                return
            }

            if (args.asset === "USDT") {
                const amountInSmallestUnit = Math.floor(
                    args.amount * Math.pow(10, USDT_DECIMALS)
                )

                const contract = await tronWeb.contract().at(USDT_TRC20_CONTRACT)

                const txId = await contract
                    .transfer(args.toAddress, amountInSmallestUnit)
                    .send({
                        feeLimit: 100_000_000,
                        callValue: 0,
                        shouldPollResponse: false,
                    })

                if (!txId) {
                    throw new Error("USDT transaction did not return a tx id.")
                }

                setResult({
                    txId: String(txId),
                    asset: "USDT",
                    amount: args.amount,
                    toAddress: args.toAddress,
                })

                setStatus("success")
                return
            }

            throw new Error("Unsupported asset.")
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "TRON transfer execution failed."
            )
            setStatus("failed")
        }
    }, [])

    const resetExecution = useCallback(() => {
        setStatus("idle")
        setResult(null)
        setError("")
    }, [])

    return useMemo(
        () => ({
            status,
            result,
            error,
            isPreparing: status === "preparing",
            isWaitingWallet: status === "waiting_wallet",
            isSuccess: status === "success",
            isFailed: status === "failed",
            executeTransfer,
            resetExecution,
        }),
        [status, result, error, executeTransfer, resetExecution]
    )
}