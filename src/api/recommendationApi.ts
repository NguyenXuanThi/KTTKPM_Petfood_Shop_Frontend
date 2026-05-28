import apiClient from "@/lib/axios";
import { ProductRecommendationResponse } from "@/types";

export const recommendationApi = {
  async getProductRecommendations(): Promise<ProductRecommendationResponse> {
    const { data } = await apiClient.get<ProductRecommendationResponse>(
      "/ai/recommendations/products",
    );
    console.log("[Recommendation API response]", data);
    console.log("[Recommendation source]", data?.source);
    console.log(
      "[Recommendation products]",
      data?.products?.map((product) => product.name),
    );
    return data;
  },
};
