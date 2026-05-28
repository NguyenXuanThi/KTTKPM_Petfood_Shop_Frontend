import { useQuery } from "@tanstack/react-query";
import { recommendationApi } from "@/api/recommendationApi";
import { getPetfoodSessionId } from "@/lib/axios";
import { useAppSelector } from "@/hooks/useAppDispatch";

export const RECOMMENDATIONS_KEY = "recommendations";

export function useProductRecommendations() {
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id || user?._id || "guest";
  const sessionId = getPetfoodSessionId();

  return useQuery({
    queryKey: [RECOMMENDATIONS_KEY, "products", userId, sessionId],
    queryFn: recommendationApi.getProductRecommendations,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
