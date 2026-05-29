import { History, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSpinHistory } from "@/hooks/useRewards";
import { SpinHistoryList } from "@/components/rewards/SpinHistoryList";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RewardShell } from "./RewardsOverviewPage";

export default function RewardHistoryPage() {
  const { t } = useTranslation();
  const {
    data: history = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useSpinHistory();

  return (
    <RewardShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-950 dark:text-white md:text-4xl">
            {t("pawmart.rewardsPages.history")}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t("pawmart.rewardsPages.historyDesc")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          loading={isFetching}
        >
          <RefreshCw size={15} /> {t("pawmart.rewardsPages.refresh")}
        </Button>
      </div>
      <div className="rounded-[2rem] border border-gray-100 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
        {isError ? (
          <EmptyState
            icon={<History size={28} />}
            title={t("pawmart.rewardsPages.loadHistoryFailed")}
            description={t("pawmart.rewardsPages.tryAgain")}
            action={
              <Button onClick={() => refetch()}>
                {t("pawmart.rewardsPages.retry")}
              </Button>
            }
          />
        ) : (
          <SpinHistoryList history={history} isLoading={isLoading} />
        )}
      </div>
    </RewardShell>
  );
}
