
// PATCH-08
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTransferFlow } from "@/hooks/use-transfer-flow"
import { DecisionResultCard } from "@/components/tron/decision-result-card"
// PATCH-18
import { useTronWallet } from "@/hooks/use-tron-wallet"
// PATCH-20
import { useFeeSaver } from "@/hooks/use-feesaver"
// PATCH-22
import { useTronExecution } from "@/hooks/use-tron-execution"
//const validation = detectData?.validation ?? {
// isValid: false,
// message: "Destination wallet is required",
//}

//const transferType = detectData?.transferType ?? (asset === "TRX" ? "TRX Native" : "USDT TRC20")
//const executionPath =
//detectData?.executionPath ?? (asset === "TRX" ? "Native transfer" : "Smart contract transfer")
//const contractRoute =
//detectData?.contractRoute ??
//(asset === "TRX" ? "Native TRON transfer" : "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t")

//const estimatedEnergy = energyData?.estimatedEnergy ?? 0
//const energyToBuy = energyData?.energyToBuy ?? 0
//const confidence = energyData?.confidence ?? "Low"
//const estimateProfile = energyData?.estimateProfile ?? "Pending"
//const estimateState = energyData?.estimateState ?? "Waiting for valid amount"

//const quoteStatus = quoteData?.quoteStatus
//?? (isQuoteLoading
//? "Requesting mock quote"
//: !validation.isValid || !hasValidAmount
//  ? "Not ready"
//: "Idle")
// PATCH-01
export default function Home() {
  const [destination, setDestination] = useState("TXYZ...DestinationWallet")
  const [amount, setAmount] = useState("25.00")
  const [asset, setAsset] = useState("USDT")
  // PATCH-18
  const tronWallet = useTronWallet()
  // PATCH-18
  const walletReady = tronWallet.isConnected
  // PATCH-19
  const walletBlocked = !walletReady
  // PATCH-20
  const feeSaver = useFeeSaver()
  // PATCH-20B
  const energyReady = feeSaver.isSuccess
  // PATCH-22
  const tronExecution = useTronExecution()
  // PATCH-08
  const {
    detectData,
    energyData,
    quoteData,
    decisionData,
    readinessData,
    isDetectLoading,
    isEnergyLoading,
    isQuoteLoading,
    isDecisionLoading,
    quoteState,
    hasValidAmount,
    normalizedAmount,
    canRunAnalysis,
    getQuote,
    resetQuote,
  } = useTransferFlow({
    destination,
    amount,
    asset,
  })
  // PATCH-22
  const handleConfirmTransfer = useCallback(async () => {
    await tronExecution.executeTransfer({
      asset,
      fromAddress: tronWallet.address,
      toAddress: destination,
      amount: Number(amount),
    })
  }, [
    amount,
    asset,
    destination,
    tronExecution,
    tronWallet.address,
  ])
  const validation = detectData?.validation ?? {
    isValid: readinessData.addressValid,
    message: readinessData.addressValid
      ? "Address format valid"
      : readinessData.message,
  }

  const transferType =
    detectData?.transferType ?? (asset === "TRX" ? "TRX Native" : "USDT TRC20")

  const executionPath =
    detectData?.executionPath ??
    (asset === "TRX" ? "Native transfer" : "Smart contract transfer")

  const contractRoute =
    detectData?.contractRoute ??
    (asset === "TRX"
      ? "Native TRON transfer"
      : "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t")

  const estimatedEnergy = energyData?.estimatedEnergy ?? 0
  const energyToBuy = energyData?.energyToBuy ?? 0
  const confidence = energyData?.confidence ?? "Low"
  const estimateProfile = energyData?.estimateProfile ?? "Pending"
  const estimateState = energyData?.estimateState ?? "Waiting for valid amount"

  const quoteStatus =
    quoteData?.quoteStatus ??
    (isQuoteLoading
      ? "Requesting mock quote"
      : !validation.isValid || !hasValidAmount
        ? "Not ready"
        : "Idle")

  const stepState = useMemo(() => {
    if (!destination.trim() && !amount.trim()) return "Idle"
    if (readinessData.status === "blocked") return "Input Required"
    if (readinessData.status === "warning") return "Low Amount Warning"

    if (!canRunAnalysis) return "Validating"

    if (estimatedEnergy > 0 || asset === "TRX") {
      if (quoteState === "loading") return "Quote Loading"
      if (quoteState === "ready") return "Quote Ready"
      return "Estimated"
    }

    return "Validating"
  }, [
    amount,
    asset,
    canRunAnalysis,
    destination,
    estimatedEnergy,
    quoteState,
    readinessData.status,
  ])

  const progressValue = useMemo(() => {
    switch (stepState) {
      case "Idle":
        return 8
      case "Input Required":
        return 18
      case "Low Amount Warning":
        return 28
      case "Validating":
        return 38
      case "Estimated":
        return 62
      case "Quote Loading":
        return 74
      case "Quote Ready":
        return 86
      default:
        return 8
    }
  }, [stepState])
  // PATCH-11A
  const sessionStatus = useMemo(() => {
    if (readinessData.status === "blocked") return readinessData.title
    if (readinessData.status === "warning") return readinessData.title
    if (quoteState === "ready") return "Ready for prepare phase"
    return "Ready for mock flow"
  }, [quoteState, readinessData.status, readinessData.title])
  // PATCH-12
  const readinessTone = useMemo(() => {
    if (readinessData.status === "ready") {
      return {
        ring: "border-emerald-500/30",
        bg: "bg-emerald-500/10",
        title: "text-emerald-300",
        text: "text-emerald-100/80",
        badge: "Ready",
      }
    }

    if (readinessData.status === "warning") {
      return {
        ring: "border-amber-500/30",
        bg: "bg-amber-500/10",
        title: "text-amber-300",
        text: "text-amber-100/80",
        badge: "Warning",
      }
    }

    return {
      ring: "border-rose-500/30",
      bg: "bg-rose-500/10",
      title: "text-rose-300",
      text: "text-rose-100/80",
      badge: "Blocked",
    }
  }, [readinessData.status])

  // PATCH-12
  const quoteButtonLabel = useMemo(() => {
    if (!canRunAnalysis) return "Request Quote"
    if (isQuoteLoading) return "Requesting Quote..."
    if (quoteState === "ready") return "Refresh Quote"
    return "Request Quote"
  }, [canRunAnalysis, isQuoteLoading, quoteState])



  // PATCH-08
  const canRequestQuote =
    canRunAnalysis &&
    validation.isValid &&
    hasValidAmount &&
    asset === "USDT" &&
    !isQuoteLoading

  // PATCH-21
  const canConfirm =
    canRunAnalysis &&
    validation.isValid &&
    hasValidAmount &&
    (
      asset === "TRX" ||
      (quoteState === "ready" && feeSaver.isSuccess)
    )
  // PATCH-09
  const confirmButtonLabel = useMemo(() => {
    if (!canRunAnalysis) return "Confirmation Locked"
    if (canConfirm) return "Confirm Transfer"
    return "Confirmation Locked"
  }, [canConfirm, canRunAnalysis])  // PATCH-12A
  // PATCH-21
  const primaryAction = useMemo(() => {
    if (!canRunAnalysis) {
      return {
        label: "Input Required",
        onClick: () => { },
        disabled: true,
        tone: "secondary",
      }
    }

    // PATCH-23B
    if (asset === "TRX") {
      return {
        label: tronExecution.isWaitingWallet
          ? "Waiting for Wallet..."
          : tronExecution.isPreparing
            ? "Preparing Transfer..."
            : canConfirm
              ? "Confirm TRX Transfer"
              : "Prepare TRX Transfer",
        onClick: handleConfirmTransfer,
        disabled:
          !canConfirm ||
          tronExecution.isPreparing ||
          tronExecution.isWaitingWallet ||
          tronExecution.isSuccess,
        tone: canConfirm ? "success" : "secondary",

      }
    }

    if (quoteState === "loading") {
      return {
        label: "Requesting Quote...",
        onClick: () => { },
        disabled: true,
        tone: "secondary",
      }
    }

    if (quoteState !== "ready") {
      return {
        label: "Request Quote",
        onClick: handleGetQuote,
        disabled: !canRequestQuote,
        tone: canRequestQuote ? "primary" : "secondary",
      }
    }

    if (!feeSaver.isSuccess) {
      return {
        label: "Buy Energy First",
        onClick: () => { },
        disabled: true,
        tone: "secondary",
      }
    }

    // PATCH-22
    return {
      label: tronExecution.isWaitingWallet
        ? "Waiting for Wallet..."
        : tronExecution.isPreparing
          ? "Preparing Transfer..."
          : canConfirm
            ? "Confirm USDT Transfer"
            : "Ready to Confirm",
      onClick: handleConfirmTransfer,
      disabled:
        !canConfirm ||
        tronExecution.isPreparing ||
        tronExecution.isWaitingWallet ||
        tronExecution.isSuccess,
      tone: canConfirm ? "success" : "primary",
    }
  }, [
    asset,
    canConfirm,
    canRequestQuote,
    canRunAnalysis,
    feeSaver.isSuccess,
    handleGetQuote,
    quoteState,
    handleConfirmTransfer,
    tronExecution.isPreparing,
    tronExecution.isWaitingWallet,
    tronExecution.isSuccess,
  ])
  //const canRequestQuote = validation.isValid && hasValidAmount && asset === "USDT" && quoteState !== "loading"
  //const canConfirm = validation.isValid && hasValidAmount && (asset === "TRX" || quoteState === "ready")
  // PATCH-13
  const destinationFieldTone = useMemo(() => {
    if (!destination.trim()) {
      return {
        ring: "border-white/10",
        hint: "Enter TRON destination wallet.",
        hintClass: "text-white/40",
      }
    }

    if (!readinessData.addressValid) {
      return {
        ring: "border-rose-500/40 focus-within:border-rose-400",
        hint: "Destination must be a valid TRON wallet address.",
        hintClass: "text-rose-300",
      }
    }

    return {
      ring: "border-emerald-500/30 focus-within:border-emerald-400",
      hint: "Destination format looks valid.",
      hintClass: "text-emerald-300",
    }
  }, [destination, readinessData.addressValid])

  // PATCH-13
  const amountFieldTone = useMemo(() => {
    if (!amount.trim()) {
      return {
        ring: "border-white/10",
        hint: "Enter transfer amount.",
        hintClass: "text-white/40",
      }
    }

    if (!readinessData.amountValid) {
      return {
        ring: "border-rose-500/40 focus-within:border-rose-400",
        hint: "Amount must be a positive number.",
        hintClass: "text-rose-300",
      }
    }

    if (readinessData.status === "warning") {
      return {
        ring: "border-amber-500/40 focus-within:border-amber-400",
        hint: "Low transfer amount. Costs may be inefficient.",
        hintClass: "text-amber-300",
      }
    }

    return {
      ring: "border-emerald-500/30 focus-within:border-emerald-400",
      hint: "Amount looks ready for analysis.",
      hintClass: "text-emerald-300",
    }
  }, [amount, readinessData.amountValid, readinessData.status])
  // PATCH-14
  const analysisUnlocked = useMemo(() => {
    return canRunAnalysis
  }, [canRunAnalysis])

  // PATCH-14
  const quoteUnlocked = useMemo(() => {
    return analysisUnlocked && asset === "USDT"
  }, [analysisUnlocked, asset])

  // PATCH-14
  const previewUnlocked = useMemo(() => {
    return (
      destination.trim().length > 0 &&
      hasValidAmount &&
      (readinessData.status === "ready" || readinessData.status === "warning")
    )
  }, [destination, hasValidAmount, readinessData.status])

  // PATCH-14
  const confirmationUnlocked = useMemo(() => {
    return canRunAnalysis
  }, [canRunAnalysis])

  // PATCH-14
  const analysisStatus = useMemo(() => {
    if (!analysisUnlocked) return "Locked"
    if (isDetectLoading || isEnergyLoading) return "Active"
    if (detectData || energyData) return "Ready"
    return "Pending"
  }, [analysisUnlocked, detectData, energyData, isDetectLoading, isEnergyLoading])

  // PATCH-14
  const quoteSectionStatus = useMemo(() => {
    if (!quoteUnlocked) return "Locked"
    if (isQuoteLoading) return "Active"
    if (quoteState === "ready") return "Ready"
    return "Pending"
  }, [isQuoteLoading, quoteState, quoteUnlocked])

  // PATCH-14
  const previewStatus = useMemo(() => {
    if (!previewUnlocked) return "Locked"
    return "Ready"
  }, [previewUnlocked])

  // PATCH-14
  const confirmationStatus = useMemo(() => {
    if (!confirmationUnlocked) return "Locked"
    if (canConfirm) return "Ready"
    return "Pending"
  }, [canConfirm, confirmationUnlocked])
  // PATCH-13
  const analysisRef = useRef<HTMLDivElement | null>(null)
  const energyRef = useRef<HTMLDivElement | null>(null)
  const quoteRef = useRef<HTMLDivElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  // PATCH-02
  const hasAnalysisData = canRunAnalysis || readinessData.status !== "blocked"
  const hasEnergyData =
    estimateState !== "Waiting for valid amount" && estimateState !== "Blocked"
  const hasQuoteData = quoteStatus !== "Not ready" && quoteStatus !== "Idle"
  const hasPreviewData =
    destination.trim().length > 0 &&
    hasValidAmount &&
    (readinessData.status === "ready" || readinessData.status === "warning")
  // PATCH-15C
  const canResetQuote = useMemo(() => {
    return isQuoteLoading || quoteState === "ready" || Boolean(quoteData)
  }, [isQuoteLoading, quoteData, quoteState])
  // PATCH-06 auto stage progression
  const suggestedOpenSection = hasPreviewData
    ? "preview"
    : hasQuoteData
      ? "quote"
      : hasEnergyData
        ? "energy"
        : "analysis"

  // PATCH-03
  const [openSections, setOpenSections] = useState({
    analysis: true,
    energy: false,
    quote: false,
    preview: false,
  })

  // PATCH-04
  const sectionOpen = {
    analysis: openSections.analysis,
    energy: openSections.energy || (!openSections.analysis && hasEnergyData),
    quote: openSections.quote || (!openSections.analysis && !openSections.energy && hasQuoteData),
    preview: openSections.preview || (!openSections.analysis && !openSections.energy && !openSections.quote && hasPreviewData),
  }
  // PATCH-14
  const activeSection = hasPreviewData
    ? "preview"
    : hasQuoteData
      ? "quote"
      : hasEnergyData
        ? "energy"
        : "analysis"
  // PATCH-15
  useEffect(() => {
    setOpenSections({
      analysis: activeSection === "analysis",
      energy: activeSection === "energy",
      quote: activeSection === "quote",
      preview: activeSection === "preview",
    })
  }, [activeSection])
  // PATCH-16
  useEffect(() => {
    const sectionMap = {
      analysis: analysisRef.current,
      energy: energyRef.current,
      quote: quoteRef.current,
      preview: previewRef.current,
    }

    const target = sectionMap[activeSection]

    if (!target) return

    const timer = window.setTimeout(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 180)

    return () => window.clearTimeout(timer)
  }, [activeSection])
  useEffect(() => {
    if (quoteState === "idle" && !quoteData) {
      setOpenSections((prev) => ({
        ...prev,
        quote: false,
        preview: false,
      }))
    }
  }, [quoteData, quoteState])
  // PATCH-05
  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((prev) => ({
      analysis: false,
      energy: false,
      quote: false,
      preview: false,
      [section]: !prev[section],
    }))
  }
  // PATCH-08
  async function handleGetQuote() {
    if (!canRequestQuote) return
    await getQuote()
  }

  // PATCH-15A
  // PATCH-15A
  // PATCH-15A
  // PATCH-15B
  const handleResetQuote = useCallback(async () => {
    await resetQuote()

    setOpenSections((prev) => ({
      ...prev,
      quote: false,
      preview: false,
    }))
  }, [resetQuote])
  // function handleGetQuote() {
  //  if (!canRequestQuote) return


  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="border-r border-white/10 bg-black/20 px-6 py-8">
          <div className="mb-8">
            <div className="text-xs uppercase tracking-[0.28em] text-emerald-400/80">
              Tron Smart Transfer
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Auto Energy Panel
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Personal dashboard for TRON and USDT transfer preparation.
            </p>
          </div>

          <div className="space-y-3">
            <SidebarItem title="New Transfer" subtitle="Start a fresh transfer flow" active />
            <SidebarItem title="Session Status" subtitle="Validation and readiness state" />
            <SidebarItem title="Security Checks" subtitle="Review protection gates" />
            <SidebarItem title="History" subtitle="Coming soon" />
            <SidebarItem title="Settings" subtitle="Coming soon" />
          </div>

          <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="text-sm font-medium text-emerald-300">Security Priority</div>
            <p className="mt-2 text-sm leading-6 text-emerald-100/75">
              Sensitive logic stays server-side. Wallet confirmation remains the final step.
            </p>
          </div>
        </aside>

        <section className="px-5 py-5 lg:px-8 lg:py-8">
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-white/40">
                Phase 1C
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Transfer Preparation Workspace
              </h2>
              <p className="mt-2 text-sm text-white/55">
                Interactive MVP with state engine, progress tracking, and quote loading flow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <HeaderBadge label="Network" value="TRON" />
              <HeaderBadge label="Asset" value={asset} />
              <HeaderBadge label="Mode" value="Interactive+" />
            </div>
          </header>

          <PanelCard title="Flow Progress" subtitle={
            readinessData.status === "blocked"
              ? readinessData.message
              : readinessData.status === "warning"
                ? readinessData.message
                : "Transfer flow is ready to continue through estimation and quote stages."
          }>
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-white/35">Current Step</div>
                  <div className="mt-2 text-xl font-semibold text-white">{stepState}</div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <StatusBadge label="Validation" tone={validation.isValid ? "success" : "warning"} />
                  {/* PATCH-08 */}
                  <StatusBadge
                    label={
                      isDecisionLoading
                        ? "Decision Loading"
                        : quoteState === "ready"
                          ? "Quote Ready"
                          : quoteState === "loading"
                            ? "Quote Loading"
                            : "Quote Idle"
                    }
                    tone={
                      isDecisionLoading
                        ? "info"
                        : quoteState === "ready"
                          ? "success"
                          : quoteState === "loading"
                            ? "info"
                            : "neutral"
                    }
                  />
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${progressValue}%` }}
                />
              </div>

              <div className="grid gap-3 text-sm text-white/60 lg:grid-cols-4">
                <StepMini title="Input" active={progressValue >= 20} />
                <StepMini title="Estimate" active={progressValue >= 55} />
                <StepMini title="Quote" active={progressValue >= 78} />
                <StepMini title="Confirm" active={canConfirm} />
              </div>
            </div>
          </PanelCard>

          <div className="space-y-5">
            {/* PATCH-18 */}
            <PanelCard
              title="Wallet Connection"
              subtitle="Connect TronLink before buying energy or confirming transfer."
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2 text-sm">
                  <div className="text-white/70">
                    Status:{" "}
                    <span className="font-medium text-white">
                      {tronWallet.status}
                    </span>
                  </div>

                  <div className="text-white/70">
                    Address:{" "}
                    <span className="font-mono text-xs text-white">
                      {tronWallet.address || "-"}
                    </span>
                  </div>

                  <div className="text-white/70">
                    Network:{" "}
                    <span className="font-mono text-xs text-white">
                      {tronWallet.network}
                    </span>
                  </div>
                </div>

                {/* PATCH-24B */}
                <button
                  type="button"
                  onClick={
                    tronWallet.isConnected
                      ? tronWallet.disconnect
                      : tronWallet.connect
                  }
                  disabled={tronWallet.status === "checking"}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {tronWallet.isConnected
                    ? "Disconnect Wallet"
                    : "Connect TronLink"}
                </button>
              </div>

              {!tronWallet.isInstalled ? (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                  TronLink is not detected. Install TronLink to continue.
                </div>
              ) : null}
            </PanelCard>
            {/* PATCH-19 */}
            {walletBlocked ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                Connect TronLink wallet to unlock energy purchase and transfer execution.
              </div>
            ) : null}
            <PanelCard
              title="Transfer Input"
              subtitle="Enter the destination wallet and transfer amount."
            >
              <div className="grid gap-4 xl:grid-cols-2">
                <FieldBlock label="Destination wallet">
                  <input
                    className={[
                      "w-full rounded-2xl border bg-black/20 px-4 py-3 text-sm text-white outline-none transition",
                      destinationFieldTone.ring,
                    ].join(" ")}
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value)
                    }}
                    placeholder="Enter TRON wallet address"
                  />
                  {/* PATCH-13 */}
                  <div className={["mt-2 text-xs", destinationFieldTone.hintClass].join(" ")}>
                    {destinationFieldTone.hint}
                  </div>
                </FieldBlock>

                <FieldBlock label="Amount">
                  <input
                    className={[
                      "w-full rounded-2xl border bg-black/20 px-4 py-3 text-sm text-white outline-none transition",
                      amountFieldTone.ring,
                    ].join(" ")} value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value)
                    }}
                    placeholder="Enter amount"
                  />
                  {/* PATCH-13 */}
                  <div className={["mt-2 text-xs", amountFieldTone.hintClass].join(" ")}>
                    {amountFieldTone.hint}
                  </div>
                </FieldBlock>
                {/* PATCH-12 */}
                <div
                  className={[
                    "rounded-2xl border p-4 transition-colors",
                    readinessTone.ring,
                    readinessTone.bg,
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className={["text-sm font-semibold", readinessTone.title].join(" ")}>
                        {readinessData.title}
                      </div>
                      <div className={["text-sm", readinessTone.text].join(" ")}>
                        {readinessData.message}
                      </div>
                    </div>

                    <div
                      className={[
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        readinessTone.ring,
                        readinessTone.title,
                      ].join(" ")}
                    >
                      {readinessTone.badge}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs text-white/60 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      Address: {readinessData.addressValid ? "Valid" : "Pending"}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      Amount: {readinessData.amountValid ? "Valid" : "Pending"}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      Analysis: {canRunAnalysis ? "Unlocked" : "Locked"}
                    </div>
                  </div>
                </div>
                <FieldBlock label="Asset">
                  <select
                    value={asset}
                    onChange={(e) => {
                      setAsset(e.target.value)
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-white/20"                  >
                    <option>USDT</option>
                    <option>TRX</option>
                  </select>
                </FieldBlock>

                <FieldBlock label="Network">
                  <div className="flex h-12 items-center rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white/80">
                    TRON Mainnet
                  </div>
                </FieldBlock>
              </div>
            </PanelCard>

            <div className="space-y-4">
              <div ref={analysisRef}>
                <PanelCard
                  title="Transfer Analysis"
                  subtitle="Server-verified transfer route and wallet readiness."
                  isCollapsible
                  isOpen={sectionOpen.analysis}
                  onToggle={() => toggleSection("analysis")}
                  status={hasAnalysisData ? "Ready" : "Waiting"}
                  stepNumber="01"
                >
                  <div className="grid gap-3 text-sm">
                    <InfoRow label="Transfer Type" value={transferType} />
                    <InfoRow label="Transfer Method" value={contractRoute} />
                    <InfoRow
                      label="Wallet Check"
                      value={validation.message}
                      valueClassName={validation.isValid ? "text-emerald-300" : "text-amber-300"}
                    />
                    <InfoRow label="Execution Mode" value={executionPath} />
                  </div>
                </PanelCard>
              </div>

              <div ref={energyRef}>
                <PanelCard
                  title="Energy Analysis"
                  subtitle={
                    analysisUnlocked
                      ? "Estimated network resources required for this transfer."
                      : "Unlocks after valid destination and amount inputs."
                  }
                  status={analysisStatus}
                >
                  {analysisUnlocked ? (
                    <div className="grid gap-3 text-sm">
                      <InfoRow
                        label="Estimate State"
                        value={energyData?.estimateState ?? (isEnergyLoading ? "Loading..." : "Waiting")}
                      />
                      <InfoRow
                        label="Confidence"
                        value={energyData?.confidence ?? "Pending"}
                      />
                      <InfoRow
                        label="Estimated Energy"
                        value={String(energyData?.estimatedEnergy ?? 0)}
                      />
                      <InfoRow
                        label="Energy To Buy"
                        value={String(energyData?.energyToBuy ?? 0)}
                      />
                      <InfoRow
                        label="Fallback Burn"
                        value={
                          asset === "TRX"
                            ? "No energy required for native transfer"
                            : energyData?.fallbackBurn ?? "Unknown"
                        }
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-white/45">
                      Complete a valid destination and amount to unlock energy analysis.
                    </div>
                  )}
                </PanelCard>
              </div>
              <div ref={quoteRef}>
                <PanelCard
                  title="Energy Quote"
                  subtitle={
                    quoteUnlocked
                      ? "Preview estimated provider pricing before execution."
                      : asset === "TRX"
                        ? "TRX native transfer does not require an energy quote."
                        : "Unlocks after analysis becomes available."
                  }
                  status={quoteSectionStatus}
                >
                  {quoteUnlocked ? (
                    <div className="grid gap-3 text-sm">
                      <InfoRow label="Quote Status" value={quoteStatus} />
                      <InfoRow label="Provider" value={quoteData?.provider ?? "Not selected"} />
                      <InfoRow label="Price" value={quoteData?.quotePrice ?? "Not available"} />
                      <InfoRow
                        label="Expiry"
                        value={
                          quoteData?.expiresInSec
                            ? `${quoteData.expiresInSec}s`
                            : "Not available"
                        }
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-white/45">
                      {asset === "TRX"
                        ? "Quote stage is skipped for direct TRX transfer."
                        : "Quote will unlock after analysis is ready."}
                    </div>
                  )}
                  {/* PATCH-08 */}
                  <InfoRow
                    label="Quote Status"
                    value={quoteStatus}
                    valueClassName={
                      quoteState === "ready"
                        ? "text-emerald-300"
                        : quoteState === "loading"
                          ? "text-sky-300"
                          : quoteStatus === "Not ready"
                            ? "text-white"
                            : "text-amber-300"
                    }
                  />

                  <div className="mt-2 flex flex-wrap gap-3">
                    {/* PATCH-09 */}
                    {/* PATCH-12 */}
                    {/* PATCH-19 */}
                    {/* PATCH-21B */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">

                      <ActionButton
                        label={quoteState === "ready" ? "Refresh Quote" : "Request Quote"}
                        onClick={handleGetQuote}
                        disabled={!canRequestQuote}
                        tone="secondary"
                      />

                      <ActionButton
                        label="Reset Quote"
                        onClick={handleResetQuote}
                        disabled={!canResetQuote}
                        tone="secondary"
                      />

                      {feeSaver.isSuccess ? (
                        <ActionButton
                          label="Energy Purchased"
                          onClick={() => { }}
                          disabled={true}
                          tone="success"
                        />
                      ) : null}

                    </div>
                  </div>
                  {/* PATCH-20 */}
                  {/* PATCH-20 */}
                  {quoteState === "ready" ? (
                    <ActionButton
                      label={
                        walletBlocked
                          ? "Connect Wallet First"
                          : feeSaver.isBuying
                            ? "Buying Energy..."
                            : feeSaver.isSuccess
                              ? "Energy Purchased"
                              : "Buy Energy"
                      }
                      onClick={() =>
                        feeSaver.buyEnergy({
                          walletAddress: tronWallet.address,
                          energyAmount: Number(energyToBuy ?? 65000),
                        })
                      }
                      disabled={
                        walletBlocked ||
                        feeSaver.isBuying ||
                        feeSaver.isSuccess
                      }
                      tone="primary"
                    />
                  ) : null}
                  {/* PATCH-20 */}
                  {feeSaver.isSuccess ? (
                    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                      FeeSaver energy purchased successfully. Energy:{" "}
                      {feeSaver.purchase?.energyAmount.toLocaleString()} | Price:{" "}
                      {feeSaver.purchase?.priceTrx} TRX | TX: {feeSaver.purchase?.txId}
                    </div>
                  ) : null}

                  {feeSaver.isFailed ? (
                    <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                      {feeSaver.error}
                    </div>
                  ) : null}
                </PanelCard>
              </div>

              <div ref={previewRef}>
                <PanelCard
                  title="Transfer Preview"
                  subtitle={
                    previewUnlocked
                      ? "Final review before wallet approval."
                      : "Preview unlocks after valid input and route readiness."
                  }
                  status={previewStatus}
                >
                  {previewUnlocked ? (
                    <div className="grid gap-3 text-sm">
                      <InfoRow label="Destination" value={destination || "-"} />
                      <InfoRow label="Transfer amount" value={`${amount || "0"} ${asset}`} />
                      <InfoRow label="Transfer type" value={detectData?.transferType ?? "Pending"} />
                      <InfoRow label="Execution path" value={detectData?.executionPath ?? "Pending"} />
                    </div>
                  ) : (
                    <div className="text-sm text-white/45">
                      Complete valid transfer inputs to unlock preview.
                    </div>
                  )}
                </PanelCard>
              </div >
            </div >
            {/* PATCH-08 */}
            < DecisionResultCard data={decisionData} />
            <PanelCard
              title="Final Confirmation"
              subtitle={
                confirmationUnlocked
                  ? "Final logic state based on detect, estimate, and quote flow."
                  : "Final confirmation unlocks after valid transfer input."
              } status={confirmationStatus}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* PATCH-09 */}
                <div className="space-y-2 text-sm text-white/60">
                  <div>• Destination reviewed</div>
                  <div>• Amount reviewed</div>
                  <div>• Transfer route reviewed</div>
                  <div>
                    • {decisionData?.nextStep ?? "Awaiting next transfer action"}
                  </div>
                </div>

                {/* PATCH-09 */}
                {/* PATCH-12B */}
                <div className="space-y-3 lg:min-w-[420px]">
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {/* PATCH-19 */}
                    {/* PATCH-20B */}
                    {/* PATCH-23A */}
                    <ActionButton
                      label={
                        walletBlocked
                          ? "Connect Wallet First"
                          : asset === "TRX"
                            ? primaryAction.label
                            : !feeSaver.isSuccess
                              ? "Buy Energy First"
                              : primaryAction.label
                      }
                      onClick={primaryAction.onClick}
                      disabled={
                        walletBlocked ||
                        primaryAction.disabled ||
                        (asset !== "TRX" && !feeSaver.isSuccess)
                      }
                      tone={primaryAction.tone}
                    />

                    {/* PATCH-21B */}
                    <ActionButton
                      label="Reset Quote"
                      onClick={handleResetQuote}
                      disabled={!canResetQuote}
                      tone="secondary"
                    />
                  </div>
                  {/* PATCH-22 */}
                  {tronExecution.isSuccess ? (
                    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                      Transfer prepared successfully. TX: {tronExecution.result?.txId}
                    </div>
                  ) : null}

                  {tronExecution.isFailed ? (
                    <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                      {tronExecution.error}
                    </div>
                  ) : null}
                  <div className="text-right text-xs text-white/50">
                    {canRunAnalysis
                      ? canConfirm
                        ? "All required checks passed for this mock flow."
                        : "Complete the required transfer steps before final confirmation."
                      : readinessData.message}
                  </div>
                </div>              </div>
            </PanelCard>
          </div >
        </section >

        <aside className="border-l border-white/10 bg-white/[0.02] px-5 py-5 lg:px-6 lg:py-8">
          <div className="space-y-5">
            <RailCard title="Session Summary">
              <RailRow label="Status" value={sessionStatus} />
              {/* PATCH-12 */}
              <RailRow label="Readiness" value={readinessTone.badge} />
              <RailRow label="Step" value={stepState} />
              <RailRow label="Environment" value="Local dev" />
            </RailCard>

            <RailCard title="Transfer Summary">
              <RailRow label="Asset" value={asset} />
              <RailRow label="Amount" value={amount || "0"} />
              <RailRow label="Route" value={asset === "TRX" ? "Native" : "TRC20"} />
            </RailCard>

            <RailCard title="Cost Preview">
              <RailRow label="Energy need" value={formatNumber(estimatedEnergy)} />
              <RailRow label="Provider" value="FeeSaver" />
              {/* PATCH-08 */}
              <RailRow
                label="Price"
                value={
                  quoteData?.quotePrice
                    ? quoteData.quotePrice
                    : energyToBuy > 0
                      ? "Pending"
                      : "Not required"
                }
              />            </RailCard>

            <RailCard title="Security State">
              <RailRow label="Private key" value="Not stored" />
              <RailRow label="Provider secret" value="Server-side only" />
              <RailRow label="Wallet confirm" value="Required" />
            </RailCard>

            <RailCard title="Action Timeline">
              <div className="space-y-3 text-sm text-white/60">
                <div>1. Input transfer data</div>
                <div>2. Detect route</div>
                <div>3. Estimate energy</div>
                <div>4. Request provider quote</div>
                <div>5. Prepare transfer</div>
                <div>6. Confirm in wallet</div>
              </div>
            </RailCard>
          </div>
        </aside>
      </div >
    </main >
  )
}

//function validateTronAddress(value: string) {
//const trimmed = value.trim()

// if (!trimmed) {
// return {
//   isValid: false,
//   message: "Destination wallet is required",
//  }
// }

// if (!trimmed.startsWith("T")) {
//  return {
//    isValid: false,
//    message: "TRON address must start with T",
//   }
// }
//(
// if (trimmed.length !== 34) {
// return {
//  isValid: false,
//  message: "TRON address must be 34 characters",
// }
// }

//const tronLikePattern = /^T[1-9A-HJ-NP-Za-km-z]{33}$/

//if (!tronLikePattern.test(trimmed)) {
//  return {
//   isValid: false,
//   message: "Address format looks invalid",
//}
// }

//return {
// isValid: true,
//  message: "Address format valid",
// }
//}

function formatNumber(value: number) {
  if (!value) return "0"
  return new Intl.NumberFormat("en-US").format(value)
}

type SidebarItemProps = {
  title: string
  subtitle: string
  active?: boolean
}

function SidebarItem({ title, subtitle, active = false }: SidebarItemProps) {
  return (
    <div
      className={`rounded-2xl border p-4 transition ${active
        ? "border-emerald-500/30 bg-emerald-500/10"
        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
        }`}
    >
      <div className="text-sm font-medium text-white">{title}</div>
      <div className="mt-1 text-xs leading-5 text-white/50">{subtitle}</div>
    </div>
  )
}

type HeaderBadgeProps = {
  label: string
  value: string
}

function HeaderBadge({ label, value }: HeaderBadgeProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.2em] text-white/35">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  )
}

// PATCH-07
type PanelCardProps = {
  title: string
  subtitle: string
  children: React.ReactNode
  isCollapsible?: boolean
  isOpen?: boolean
  onToggle?: () => void
  status?: "Ready" | "Pending" | "Waiting" | "Locked" | "Complete"
  stepNumber?: string
}

// PATCH-08
function PanelCard({
  title,
  subtitle,
  children,
  isCollapsible = false,
  isOpen = true,
  onToggle,
  status,
  stepNumber,
}: PanelCardProps) {
  const statusClassName =
    status === "Complete" || status === "Ready"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : status === "Waiting"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
        : status === "Locked"
          ? "border-white/10 bg-white/[0.04] text-white/55"
          : "border-amber-500/25 bg-amber-500/10 text-amber-300"

  if (isCollapsible) {
    return (
      <section
        className={`rounded-3xl border bg-white/[0.03] p-5 backdrop-blur transition-all duration-200 ${isOpen
          ? "border-emerald-400/25 shadow-[0_0_0_1px_rgba(16,185,129,0.10),0_18px_40px_rgba(0,0,0,0.38),0_0_32px_rgba(16,185,129,0.08)]"
          : "border-white/10 hover:border-white/15"
          }`}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start justify-between gap-4 text-left"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {stepNumber ? (
                <div className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/50">
                  {stepNumber}
                </div>
              ) : null}

              <div className="text-lg font-semibold tracking-tight text-white">
                {title}
              </div>
            </div>

            <div className="mt-2 text-sm leading-6 text-white/60">
              {subtitle}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {status ? (
              <div className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClassName}`}>
                {status}
              </div>
            ) : null}

            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-lg transition ${isOpen
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-black/20 text-white/50"
                }`}
            >
              {isOpen ? "−" : "+"}
            </div>
          </div>
        </button>

        <div
          className={`grid transition-all duration-300 ${isOpen
            ? "mt-6 grid-rows-[1fr] opacity-100"
            : "mt-0 grid-rows-[0fr] opacity-100"
            }`}
        >
          <div className="overflow-hidden">{children}</div>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <div className="mb-5">
        <div className="text-lg font-semibold tracking-tight text-white">{title}</div>
        <div className="mt-1 text-sm text-white/50">{subtitle}</div>
      </div>
      {children}
    </section>
  )
}

type FieldBlockProps = {
  label: string
  children: React.ReactNode
}

function FieldBlock({ label, children }: FieldBlockProps) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-white/75">{label}</div>
      {children}
    </label>
  )
}

type InfoRowProps = {
  label: string
  value: string
  valueClassName?: string
}

function InfoRow({ label, value, valueClassName = "text-white" }: InfoRowProps) {
  return (
    <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 lg:grid-cols-[140px_minmax(0,1fr)]">
      <div className="text-white/45">{label}</div>
      <div className={`break-all ${valueClassName}`}>{value}</div>
    </div>
  )
}

type RailCardProps = {
  title: string
  children: React.ReactNode
}

function RailCard({ title, children }: RailCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="mb-4 text-sm font-semibold text-white">{title}</div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

type RailRowProps = {
  label: string
  value: string
}

function RailRow({ label, value }: RailRowProps) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
      <div className="text-white/40">{label}</div>
      <div className="break-words text-white/80">{value}</div>
    </div>
  )
}

type StatusBadgeProps = {
  label: string
  tone: "success" | "warning" | "info" | "neutral"
}

function StatusBadge({ label, tone }: StatusBadgeProps) {
  const toneClassName = {
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    info: "border-sky-500/25 bg-sky-500/10 text-sky-300",
    neutral: "border-white/10 bg-white/[0.03] text-white/65",
  }[tone]

  return <div className={`rounded-2xl border px-3 py-2 text-sm ${toneClassName}`}>{label}</div>
}

type StepMiniProps = {
  title: string
  active?: boolean
}

function StepMini({ title, active = false }: StepMiniProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 transition ${active ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-black/20 text-white/45"}`}>
      {title}
    </div>
  )
}
// PATCH-09
type ActionButtonProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: "primary" | "secondary"
}

function ActionButton({
  label,
  onClick,
  disabled = false,
  tone = "secondary",
}: ActionButtonProps) {
  const className =
    tone === "primary"
      ? "rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
      : "rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}
