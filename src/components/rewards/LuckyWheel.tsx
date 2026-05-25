import { useMemo } from "react";
import { motion } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";
import { RewardPoolItem } from "@/api/rewardApi";

const COLORS = [
  "#f97316",
  "#facc15",
  "#22c55e",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#84cc16",
];

export function LuckyWheel({
  rewards,
  isSpinning,
  rotation,
  durationMs = 10000,
  onSpinEnd,
}: {
  rewards: RewardPoolItem[];
  isSpinning: boolean;
  rotation: number;
  durationMs?: number;
  onSpinEnd?: () => void;
}) {
  const wheelStyle = useMemo(() => {
    if (!rewards.length) return { background: "#f3f4f6" };
    const step = 100 / rewards.length;
    const gradient = rewards
      .map(
        (_, index) =>
          `${COLORS[index % COLORS.length]} ${index * step}% ${(index + 1) * step}%`,
      )
      .join(", ");
    return { background: `conic-gradient(from -90deg, ${gradient})` };
  }, [rewards]);

  const segmentDeg = rewards.length ? 360 / rewards.length : 0;
  const showDebugIndexes = import.meta.env.DEV;

  return (
    <div className="relative mx-auto flex max-w-xl flex-col items-center">
      <div className="absolute inset-6 rounded-full bg-orange-300/20 blur-3xl" />
      <div className="relative flex h-[320px] w-[320px] items-center justify-center sm:h-[430px] sm:w-[430px]">
        <div className="absolute -top-3 z-20 flex flex-col items-center drop-shadow-lg">
          <div className="h-0 w-0 border-x-[18px] border-t-[34px] border-x-transparent border-t-orange-600" />
          <div className="-mt-1 h-4 w-8 rounded-b-full bg-orange-600" />
        </div>
        <motion.div
          className="relative h-full w-full overflow-hidden rounded-full border-[14px] border-white shadow-[0_30px_90px_-30px_rgba(249,115,22,0.8)] ring-8 ring-amber-100 dark:border-gray-900 dark:ring-amber-900/30"
          style={wheelStyle}
          animate={{ rotate: rotation }}
          transition={{
            duration: isSpinning ? durationMs / 1000 : 0,
            ease: [0.12, 0.8, 0.15, 1],
          }}
          onAnimationComplete={() => {
            if (isSpinning) onSpinEnd?.();
          }}
        >
          {rewards.map((reward, index) => {
            const labelRotation = index * segmentDeg + segmentDeg / 2 - 90;
            return (
              <div
                key={reward._id}
                className="absolute left-1/2 top-1/2 origin-left text-center text-[10px] font-black uppercase tracking-tight text-white drop-shadow sm:text-xs"
                style={{
                  transform: `rotate(${labelRotation}deg) translateX(68px) rotate(90deg)`,
                  width: "116px",
                }}
              >
                <span className="line-clamp-2 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
                  {reward.label}
                </span>
              </div>
            );
          })}
        </motion.div>
        <div className="absolute z-10 flex h-24 w-24 items-center justify-center rounded-full border-8 border-white bg-gradient-to-br from-amber-300 via-orange-500 to-rose-500 text-white shadow-xl dark:border-gray-950">
          <Gift size={32} />
          <Sparkles size={16} className="absolute right-5 top-5" />
        </div>
      </div>
    </div>
  );
}
