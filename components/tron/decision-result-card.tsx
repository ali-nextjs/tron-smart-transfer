{/* PATCH-06 */ }
// PATCH-10
import type {
    TransferDecisionAction,
    TransferDecisionResult,
} from "@/lib/types/transfer"

function getActionTone(action: TransferDecisionAction) {
    if (action === "direct_transfer") {
        return "bg-emerald-500/15 text-emerald-300 border-emerald-400/20"
    }

    if (action === "request_quote" || action === "wait_for_quote") {
        return "bg-amber-500/15 text-amber-300 border-amber-400/20"
    }

    return "bg-rose-500/15 text-rose-300 border-rose-400/20"
}

function getReadableAction(action: TransferDecisionAction) {
    if (action === "direct_transfer") return "Direct Transfer"
    if (action === "request_quote") return "Request Quote"
    if (action === "wait_for_quote") return "Wait For Quote"
    return "Reject"
}

export function DecisionResultCard({
    data,
}: {
    data: TransferDecisionResult | null
}) {
    if (!data) {
        return (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-medium text-white">Decision Result</div>
                <div className="mt-2 text-sm text-white/50">
                    No decision has been generated yet.
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                    <div className="text-sm font-medium text-white">Decision Result</div>
                    <div className="text-sm text-white/60">
                        Final logic state based on detect, estimate, and quote flow.
                    </div>
                </div>

                <div
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getActionTone(
                        data.action
                    )}`}
                >
                    {getReadableAction(data.action)}
                </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-wide text-white/40">
                        Can Proceed
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                        {data.canProceed ? "Yes" : "No"}
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-wide text-white/40">
                        Transfer Type
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                        {data.summary.transferType}
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-wide text-white/40">
                        Execution Path
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                        {data.summary.executionPath}
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-wide text-white/40">
                        Estimated Energy
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                        {data.summary.estimatedEnergy.toLocaleString()}
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-wide text-white/40">
                        Energy To Buy
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                        {data.summary.energyToBuy.toLocaleString()}
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-wide text-white/40">
                        Quote Status
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                        {data.summary.quoteStatus}
                    </div>
                    <div className="mt-1 text-xs text-white/45">
                        Provider: {data.summary.provider}
                    </div>
                </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-wide text-white/40">
                    Next Step
                </div>
                <div className="mt-2 text-sm font-medium text-white">
                    {data.nextStep}
                </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-medium text-white">Reasons</div>

                    {data.reasons.length > 0 ? (
                        <div className="mt-3 space-y-2">
                            {data.reasons.map((reason, index) => (
                                <div
                                    key={`${reason}-${index}`}
                                    className="rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-white/70"
                                >
                                    {reason}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-3 text-sm text-white/45">No reasons available.</div>
                    )}
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-medium text-white">Warnings</div>

                    {data.warnings.length > 0 ? (
                        <div className="mt-3 space-y-2">
                            {data.warnings.map((warning, index) => (
                                <div
                                    key={`${warning}-${index}`}
                                    className="rounded-lg border border-amber-400/15 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
                                >
                                    {warning}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-3 text-sm text-white/45">No warnings.</div>
                    )}
                </div>
            </div>
        </div>
    )
}