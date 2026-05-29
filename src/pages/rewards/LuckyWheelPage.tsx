﻿import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Gift,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { SpinResult } from "@/api/rewardApi";
import {
  REWARDS_KEY,
  SPIN_HISTORY_KEY,
  useMyRewards,
  useSpinWheel,
  useWheelRewards,
} from "@/hooks/useRewards";
import { MY_COUPONS_KEY } from "@/hooks/useCoupons";
import { CoinBadge } from "@/components/rewards/CoinBadge";
import { LuckyWheel } from "@/components/rewards/LuckyWheel";
import { SpinResultDialog } from "@/components/rewards/SpinResultDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RewardShell } from "./RewardsOverviewPage";
import {
  playRewardSound,
  playSpinSound,
  preloadWheelAudio,
  stopAllWheelAudio,
  stopSpinSound,
} from "@/utils/wheelAudio";

const normalizeDegrees = (value: number) => ((value % 360) + 360) % 360;
const SOUND_STORAGE_KEY = "wheelSoundEnabled";
const SPIN_DURATION_MS = 10000;
const FULL_SPINS = 8 * 360;

function getWheelAlignmentOffset(segmentAngle: number) {
  // Single visual alignment correction: after fixing the conic-gradient origin,
  // the wheel still lands about one segment clockwise from the pointer.
  return -segmentAngle;
}

function calculateTargetRotation(
  currentRotation: number,
  targetIndex: number,
  segmentCount: number,
) {
  const segmentAngle = 360 / segmentCount;
  const targetCenterAngle = targetIndex * segmentAngle + segmentAngle / 2;
  const wheelAlignmentOffset = getWheelAlignmentOffset(segmentAngle);
  const currentModulo = normalizeDegrees(currentRotation);
  const rotationToTarget = normalizeDegrees(
    360 - targetCenterAngle + wheelAlignmentOffset,
  );
  return currentRotation + FULL_SPINS + rotationToTarget - currentModulo;
}

function debugWheelSync({
  rewards,
  backendRewardIndex,
  backendRewardLabel,
  targetIndex,
  finalRotation,
}: {
  rewards: Array<{ _id: string; label: string }>;
  backendRewardIndex: number;
  backendRewardLabel: string;
  targetIndex: number;
  finalRotation: number;
}) {
  if (!import.meta.env.DEV || !rewards.length) return;

  const segmentAngle = 360 / rewards.length;
  const targetCenterAngle = targetIndex * segmentAngle + segmentAngle / 2;
  const wheelAlignmentOffset = getWheelAlignmentOffset(segmentAngle);
  const rotationToTarget = normalizeDegrees(
    360 - targetCenterAngle + wheelAlignmentOffset,
  );
  console.table(
    rewards.map((reward, index) => ({
      index,
      label: reward.label,
      startAngle: index * segmentAngle,
      centerAngle: index * segmentAngle + segmentAngle / 2,
    })),
  );
  console.log({
    backendRewardIndex,
    backendRewardLabel,
    targetIndex,
    targetCenterAngle,
    wheelAlignmentOffset,
    rotationToTarget,
    finalRotation,
    normalizedFinalRotation: normalizeDegrees(finalRotation),
  });
}

export default function LuckyWheelPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(SOUND_STORAGE_KEY) !== "false";
  });
  const [pendingReward, setPendingReward] = useState<SpinResult | null>(null);
  const [displayedReward, setDisplayedReward] = useState<SpinResult | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const {
    data: reward,
    isLoading: rewardLoading,
    refetch: refetchReward,
  } = useMyRewards();
  const {
    data: rawRewards = [],
    isLoading,
    isError,
    refetch,
  } = useWheelRewards();
  const rewards = useMemo(() => rawRewards, [rawRewards]);
  const spinMutation = useSpinWheel();
  const spinBalance = reward?.spinBalance ?? 0;
  const isBusy = spinMutation.isPending || isAnimating;
  const debugRewardIndexParam =
    searchParams.get("debugTargetIndex") ??
    searchParams.get("debugRewardIndex");
  const debugRewardIndex =
    debugRewardIndexParam !== null ? Number(debugRewardIndexParam) : null;
  const hasDebugRewardIndex =
    debugRewardIndex !== null &&
    Number.isInteger(debugRewardIndex) &&
    debugRewardIndex >= 0 &&
    debugRewardIndex < rewards.length;
  const canSpin = hasDebugRewardIndex || spinBalance > 0;

  useEffect(() => {
    preloadWheelAudio();

    return () => {
      stopAllWheelAudio();
    };
  }, []);

  const toggleSound = () => {
    setSoundEnabled((current) => {
      const next = !current;
      window.localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      if (!next) stopAllWheelAudio();
      return next;
    });
  };

  const finishSpin = async () => {
    if (!pendingReward) return;
    stopSpinSound({ fade: false });
    playRewardSound({
      enabled: soundEnabled,
      volume: 0.35,
      maxDurationMs: 1800,
    });
    setIsAnimating(false);
    setDisplayedReward(pendingReward);
    setDialogOpen(true);

    await Promise.all([
      refetchReward(),
      queryClient.invalidateQueries({ queryKey: [REWARDS_KEY] }),
      queryClient.invalidateQueries({ queryKey: [SPIN_HISTORY_KEY] }),
      pendingReward.rewardType === "coupon"
        ? queryClient.invalidateQueries({ queryKey: [MY_COUPONS_KEY] })
        : Promise.resolve(),
    ]);

    toast.success(t("pawmart.rewardsPages.unlockSuccess"));
    setPendingReward(null);
  };

  const handleSpin = async () => {
    if (isBusy || rewardLoading || !rewards.length || !canSpin) return;

    setDialogOpen(false);
    setDisplayedReward(null);
    setPendingReward(null);

    try {
      const debugIndex = hasDebugRewardIndex ? debugRewardIndex : null;
      const spinResult = hasDebugRewardIndex
        ? {
            rewardPoolId: rewards[debugIndex as number]._id,
            rewardIndex: debugIndex as number,
            rewardType: rewards[debugIndex as number].type,
            type: rewards[debugIndex as number].type,
            label: rewards[debugIndex as number].label,
            coinAmount: rewards[debugIndex as number].coinAmount || 0,
            couponId: rewards[debugIndex as number].couponId || null,
            coinBalance: reward?.coinBalance ?? 0,
            spinBalance,
          }
        : await spinMutation.mutateAsync();
      const targetIndex = spinResult.rewardIndex;

      if (
        targetIndex < 0 ||
        targetIndex >= rewards.length ||
        rewards[targetIndex]?._id !== spinResult.rewardPoolId
      ) {
        stopSpinSound({ fade: false });
        toast.error(t("pawmart.rewardsPages.syncFailed"));
        return;
      }

      setPendingReward(spinResult);
      playSpinSound({
        enabled: soundEnabled,
        volume: 0.24,
        maxDurationMs: SPIN_DURATION_MS,
        fadeMs: 800,
        startAtSeconds: 3,
      });
      setIsAnimating(true);
      setRotation((current) => {
        const finalRotation = calculateTargetRotation(
          current,
          targetIndex,
          rewards.length,
        );
        debugWheelSync({
          rewards,
          backendRewardIndex: spinResult.rewardIndex,
          backendRewardLabel: spinResult.label,
          targetIndex,
          finalRotation,
        });
        return finalRotation;
      });
    } catch {
      stopSpinSound({ fade: true, fadeMs: 250 });
      setIsAnimating(false);
    }
  };

  const startSpinAgain = () => {
    setDialogOpen(false);
    setTimeout(() => handleSpin(), 180);
  };

  return (
    <RewardShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge variant="warning">
            <Gift size={13} /> Lucky Wheel
          </Badge>
          <h1 className="mt-3 text-3xl font-black text-gray-950 dark:text-white md:text-4xl">
            {t("pawmart.rewardsPages.spinTitle")}
          </h1>
          <p className="mt-2 max-w-2xl text-gray-500 dark:text-gray-400">
            {t("pawmart.rewardsPages.spinDesc")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CoinBadge coins={reward?.coinBalance ?? 0} />
          <Badge variant="info" className="px-3 py-1.5">
            🎡 {t("pawmart.rewardsPages.spinsLeft", { count: spinBalance })}
          </Badge>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full px-3"
            onClick={toggleSound}
            title={
              soundEnabled
                ? t("pawmart.rewardsPages.turnSoundOff")
                : t("pawmart.rewardsPages.turnSoundOn")
            }
            aria-label={
              soundEnabled
                ? t("pawmart.rewardsPages.turnSoundOff")
                : t("pawmart.rewardsPages.turnSoundOn")
            }
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">
              {soundEnabled
                ? t("pawmart.rewardsPages.soundOn")
                : t("pawmart.rewardsPages.soundOff")}
            </span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-8">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="relative">
            {isError ? (
              <EmptyState
                icon={<RotateCcw size={28} />}
                title={t("pawmart.rewardsPages.loadRewardsFailed")}
                description={t("pawmart.rewardsPages.serviceBusy")}
                action={
                  <Button onClick={() => refetch()}>
                    {t("pawmart.rewardsPages.retry")}
                  </Button>
                }
              />
            ) : isLoading ? (
              <div className="mx-auto h-[340px] max-w-[340px] animate-pulse rounded-full bg-gray-100 dark:bg-gray-800 sm:h-[430px] sm:max-w-[430px]" />
            ) : (
              <LuckyWheel
                rewards={rewards}
                rotation={rotation}
                isSpinning={isAnimating}
                durationMs={SPIN_DURATION_MS}
                onSpinEnd={finishSpin}
              />
            )}
            <div className="mt-7 flex justify-center">
              <Button
                size="lg"
                disabled={
                  !rewards.length || !canSpin || isBusy || rewardLoading
                }
                loading={spinMutation.isPending}
                onClick={handleSpin}
              >
                <RotateCcw size={18} />{" "}
                {hasDebugRewardIndex
                  ? `Test index ${debugRewardIndex}`
                  : spinBalance > 0
                    ? t("pawmart.rewardsPages.spinNow")
                    : t("pawmart.rewardsPages.noSpins")}
              </Button>
            </div>
            {isAnimating}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <h3 className="font-black text-gray-950 dark:text-white">
                {t("pawmart.rewardsPages.availableRewards")}
              </h3>
            </div>
            <div className="mt-4 space-y-2">
              {rewards.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2 dark:bg-gray-800"
                >
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {item.label}
                  </span>
                  <Badge variant={item.type === "coin" ? "warning" : "info"}>
                    {item.type === "coin"
                      ? t("pawmart.rewardsPages.coin")
                      : t("pawmart.rewardsPages.coupon")}
                  </Badge>
                </div>
              ))}
              {!rewards.length && !isLoading && (
                <p className="text-sm text-gray-500">
                  Chưa có phần thưởng đang hoạt động.
                </p>
              )}
            </div>
          </div>
          <Link
            to="/rewards/shop"
            className="block rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 p-5 text-white shadow-lg transition hover:-translate-y-1"
          >
            <ShoppingBag size={24} />
            <h3 className="mt-3 text-xl font-black">Đổi xu lấy coupon</h3>
            <p className="mt-1 text-white/80">
              Vào Reward Shop để dùng số xu bạn đã tích lũy.
            </p>
          </Link>
        </div>
      </div>

      <SpinResultDialog
        result={displayedReward}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        canSpinAgain={(displayedReward?.spinBalance ?? 0) > 0}
        onSpinAgain={startSpinAgain}
      />
    </RewardShell>
  );
}
