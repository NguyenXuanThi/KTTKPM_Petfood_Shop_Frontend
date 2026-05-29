﻿import { Gift, RotateCcw, ShoppingBag, Ticket, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SpinResult } from "@/api/rewardApi";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCoins } from "./CoinBadge";
import { useTranslation } from "react-i18next";

export function SpinResultDialog({
  result,
  isOpen,
  onClose,
  canSpinAgain = false,
  onSpinAgain,
}: {
  result: SpinResult | null;
  isOpen: boolean;
  onClose: () => void;
  canSpinAgain?: boolean;
  onSpinAgain?: () => void;
}) {
  const { t } = useTranslation();
  if (!result) return null;
  const isCoin = result.rewardType === "coin";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isCoin ? t("pawmart.rewards.congrats") : t("pawmart.rewards.couponWon")
      }
      size="md"
    >
      <div className="relative overflow-hidden text-center">
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 18 }).map((_, index) => (
            <motion.span
              key={index}
              className="absolute h-2 w-2 rounded-full bg-amber-400"
              style={{
                left: `${10 + ((index * 17) % 80)}%`,
                top: `${8 + ((index * 23) % 70)}%`,
              }}
              initial={{ y: -20, opacity: 0, scale: 0.4 }}
              animate={{
                y: [0, 18, 34],
                opacity: [0, 1, 0],
                scale: [0.4, 1, 0.6],
              }}
              transition={{
                duration: 1.4,
                delay: index * 0.04,
                repeat: Infinity,
                repeatDelay: 1.2,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-amber-300 via-orange-500 to-rose-500 text-white shadow-xl shadow-orange-500/25">
          {isCoin ? <Trophy size={42} /> : <Ticket size={42} />}
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-500">
          PawMart Rewards
        </p>
        <h3 className="mt-2 text-2xl font-black text-gray-950 dark:text-white">
          {result.label}
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-gray-500 dark:text-gray-400">
          {isCoin
            ? t("pawmart.rewards.coinResult", {
                amount: formatCoins(result.coinAmount),
              })
            : t("pawmart.rewards.couponResult")}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {isCoin && canSpinAgain && onSpinAgain && (
            <Button onClick={onSpinAgain}>
              <RotateCcw size={16} /> {t("pawmart.rewards.spinAgain")}
            </Button>
          )}
          {isCoin ? (
            <Link to="/rewards/shop" onClick={onClose}>
              <Button variant="outline" className="w-full">
                <ShoppingBag size={16} /> {t("pawmart.rewards.redeemCoupon")}
              </Button>
            </Link>
          ) : (
            <Link to="/my-account/coupons" onClick={onClose}>
              <Button className="w-full">
                <Ticket size={16} /> {t("pawmart.rewards.viewMyCoupons")}
              </Button>
            </Link>
          )}
          <Button variant="ghost" onClick={onClose}>
            <Gift size={16} /> {t("pawmart.rewards.close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
