import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, MapPin, QrCode, Ticket, Truck } from "lucide-react";
import { useCartApi } from "@/hooks/useCartApi";
import { useAddresses } from "@/hooks/useAddresses";
import { orderService } from "@/services/order.service";
import { couponService } from "@/services/coupon.service";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { formatDate } from "@/lib/couponUtils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { CART_KEY } from "@/hooks/useCartApi";
import { useTranslation } from "react-i18next";

type DirectBuyCheckoutItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

type DirectBuyCheckoutState = {
  mode: "buy_now";
  sourceProductId?: string;
  items: DirectBuyCheckoutItem[];
};

const DIRECT_BUY_STORAGE_KEY = "directBuyCheckout";

const getDirectBuyState = (state: unknown): DirectBuyCheckoutState | null => {
  const maybeState = state as Partial<DirectBuyCheckoutState> | null;
  if (
    maybeState?.mode === "buy_now" &&
    Array.isArray(maybeState.items) &&
    maybeState.items.length > 0
  ) {
    return maybeState as DirectBuyCheckoutState;
  }

  try {
    const raw = sessionStorage.getItem(DIRECT_BUY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DirectBuyCheckoutState>;
    if (
      parsed.mode === "buy_now" &&
      Array.isArray(parsed.items) &&
      parsed.items.length > 0
    ) {
      return parsed as DirectBuyCheckoutState;
    }
  } catch {
    sessionStorage.removeItem(DIRECT_BUY_STORAGE_KEY);
  }

  return null;
};

export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { items, isLoading: cartLoading } = useCartApi();
  const { data: addresses = [], isLoading: addressLoading } = useAddresses();
  const directBuyState = useMemo(
    () => getDirectBuyState(location.state),
    [location.state],
  );
  const isDirectBuy = directBuyState?.mode === "buy_now";

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "banking" | "vnpay"
  >("cash");
  const [note, setNote] = useState("");
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponShippingDiscount, setCouponShippingDiscount] = useState(0);

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0],
    [addresses],
  );
  const selectedCartItemIds = useMemo(() => {
    if (isDirectBuy) return [];
    const ids = (location.state as { selectedCartItemIds?: string[] } | null)
      ?.selectedCartItemIds;
    return ids?.length ? ids : items.map((item) => item.productId.toString());
  }, [items, location.state, isDirectBuy]);
  const selectedItems = useMemo(
    () =>
      isDirectBuy
        ? (directBuyState?.items ?? []).map((item) => ({
            productId: item.productId,
            productName: item.name,
            priceAtAdd: item.price,
            imageUrl: item.imageUrl,
            quantity: item.quantity,
          }))
        : items.filter((item) =>
            selectedCartItemIds.includes(item.productId.toString()),
          ),
    [directBuyState?.items, isDirectBuy, items, selectedCartItemIds],
  );
  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (a) => a.id === (selectedAddressId || defaultAddress?.id),
      ) ?? defaultAddress,
    [addresses, selectedAddressId, defaultAddress],
  );

  const selectedSubtotal = selectedItems.reduce(
    (sum, item) => sum + item.priceAtAdd * item.quantity,
    0,
  );
  const baseShippingFee = 30_000;
  const automaticShippingDiscount =
    selectedSubtotal >= 500_000 ? baseShippingFee : 0;
  const payableShippingFee = Math.max(
    0,
    baseShippingFee - automaticShippingDiscount,
  );
  const shippingDiscount = Math.min(
    baseShippingFee,
    automaticShippingDiscount + couponShippingDiscount,
  );
  const finalTotal = Math.max(
    0,
    selectedSubtotal + baseShippingFee - shippingDiscount - couponDiscount,
  );

  const {
    data: checkoutCoupons,
    isLoading: couponLoading,
    isError: couponError,
    refetch: refetchCoupons,
  } = useQuery({
    queryKey: ["checkout-coupons", selectedSubtotal, payableShippingFee],
    queryFn: () =>
      couponService.getAvailableCoupons({
        subtotal: selectedSubtotal,
        shippingFee: payableShippingFee,
      }),
    enabled: selectedSubtotal > 0,
  });

  const applyCoupon = async (code: string) => {
    try {
      const result = await couponService.validateCoupon({
        code,
        subtotal: selectedSubtotal,
        shippingFee: payableShippingFee,
      });

      if (!result.valid) {
        toast.error(result.message);
        return;
      }

      setAppliedCouponCode(result.coupon?.code || code.toUpperCase());
      setCouponCode(result.coupon?.code || code.toUpperCase());
      setCouponDiscount(result.discountAmount || 0);
      setCouponShippingDiscount(result.shippingDiscount || 0);
      setCouponDialogOpen(false);
      toast.success(result.message);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          t("pawmart.checkout.unableApplyCoupon"),
      );
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: () => {
      if (!selectedAddress?.id) {
        throw new Error(t("pawmart.checkout.selectShippingAddress"));
      }
      if (selectedItems.length === 0) {
        throw new Error(t("pawmart.checkout.selectAtLeastOneItem"));
      }

      return orderService.createOrder({
        ...(isDirectBuy
          ? {
              directItems: selectedItems.map((item) => ({
                productId: item.productId.toString(),
                name: item.productName,
                price: item.priceAtAdd,
                imageUrl: item.imageUrl,
                quantity: item.quantity,
              })),
            }
          : {
              selectedCartItemIds: selectedItems.map((item) =>
                item.productId.toString(),
              ),
            }),
        addressId: selectedAddress.id,
        paymentMethod,
        couponCode: appliedCouponCode || undefined,
        notes: note,
      });
    },
    onSuccess: (result) => {
      if (isDirectBuy) {
        sessionStorage.removeItem(DIRECT_BUY_STORAGE_KEY);
      } else {
        queryClient.invalidateQueries({ queryKey: [CART_KEY] });
      }
      if (result.nextAction === "UPLOAD_BANKING_PROOF") {
        toast.info(t("pawmart.checkout.uploadProofInfo"));
        navigate(`/payment/upload-proof/${result.order._id}`);
      } else if (result.nextAction === "REDIRECT_VNPAY" && result.paymentUrl) {
        toast.info(t("pawmart.checkout.redirectVnpay"));
        navigate(`/payment/vnpay`, {
          state: { paymentUrl: result.paymentUrl, orderId: result.order._id },
        });
      } else {
        toast.success(t("pawmart.checkout.orderCreated"));
        navigate(`/my-account/orders/${result.order._id}`);
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          error?.message ??
          t("pawmart.checkout.placeOrderFailed"),
      );
    },
  });

  useEffect(() => {
    if (isDirectBuy || cartLoading) return;
    if (items.length === 0 || selectedItems.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [cartLoading, isDirectBuy, items.length, navigate, selectedItems.length]);

  useEffect(() => {
    if (!isDirectBuy || selectedItems.length > 0) return;
    navigate(
      directBuyState?.sourceProductId
        ? `/products/${directBuyState.sourceProductId}`
        : "/products",
      {
        replace: true,
      },
    );
  }, [
    directBuyState?.sourceProductId,
    isDirectBuy,
    navigate,
    selectedItems.length,
  ]);

  if (
    (!isDirectBuy &&
      !cartLoading &&
      (items.length === 0 || selectedItems.length === 0)) ||
    (isDirectBuy && selectedItems.length === 0)
  ) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        {t("pawmart.checkout.title")}{" "}
        {isDirectBuy && (
          <span className="text-base font-medium text-amber-600">
            ({t("pawmart.checkout.buyNow")})
          </span>
        )}
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <MapPin size={16} className="text-amber-500" />{" "}
                {t("pawmart.checkout.shippingAddress")}
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddressDialogOpen(true)}
              >
                {t("pawmart.checkout.changeAddress")}
              </Button>
            </div>

            {addressLoading && (
              <p className="text-sm text-gray-500">
                {t("pawmart.checkout.loadingAddresses")}
              </p>
            )}
            {!addressLoading && !selectedAddress && (
              <p className="text-sm text-red-500">
                {t("pawmart.checkout.noAddress")}
              </p>
            )}
            {selectedAddress && (
              <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800/60">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedAddress.fullName} - {selectedAddress.phone}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedAddress.detailAddress}, {selectedAddress.ward},{" "}
                  {selectedAddress.district}, {selectedAddress.province}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">
              {isDirectBuy
                ? t("pawmart.checkout.buyNowItem")
                : t("pawmart.checkout.cartItems")}
            </h2>
            <div className="space-y-3">
              {selectedItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <img
                    src={getImageUrl(item.imageUrl)}
                    alt={item.productName}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {item.productName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("pawmart.checkout.qty")}: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(item.priceAtAdd * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <Ticket size={16} className="text-amber-500" />{" "}
              {t("pawmart.checkout.coupon")}
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={t("pawmart.checkout.enterCoupon")}
              />
              <Button
                variant="outline"
                onClick={() => applyCoupon(couponCode)}
                disabled={!couponCode}
              >
                {t("pawmart.checkout.apply")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setCouponDialogOpen(true);
                  refetchCoupons();
                }}
              >
                {t("pawmart.checkout.chooseCoupon")}
              </Button>
            </div>
            {appliedCouponCode ? (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                <span>
                  {t("pawmart.checkout.applied", { code: appliedCouponCode })}
                </span>
                <button
                  onClick={() => {
                    setAppliedCouponCode("");
                    setCouponCode("");
                    setCouponDiscount(0);
                    setCouponShippingDiscount(0);
                  }}
                  className="font-semibold hover:underline"
                >
                  {t("pawmart.checkout.remove")}
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-400">
                {t("pawmart.checkout.couponHint")}
              </p>
            )}

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("pawmart.checkout.availableCoupons")}
                </p>
                {couponLoading && (
                  <span className="text-xs text-gray-400">
                    {t("pawmart.common.loading")}
                  </span>
                )}
              </div>

              {couponError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
                  {t("pawmart.checkout.unableLoadCoupons")}
                </p>
              )}

              {!couponLoading &&
                !couponError &&
                (checkoutCoupons ?? []).length === 0 && (
                  <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                    {t("pawmart.checkout.noAvailableCoupons")}
                  </p>
                )}

              {(checkoutCoupons ?? []).slice(0, 3).map((coupon) => {
                const selected = appliedCouponCode === coupon.code;
                return (
                  <div
                    key={`inline-${coupon.code}-${coupon.userCouponId ?? coupon.couponId}`}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                      selected
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20"
                        : "border-amber-100 bg-amber-50/60 hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-900/10"
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-amber-700 dark:text-amber-300">
                          {coupon.code}
                        </p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-gray-900 dark:text-gray-300">
                          {coupon.source === "assigned"
                            ? t("pawmart.checkout.assignedToYou")
                            : t("pawmart.checkout.public")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t("pawmart.checkout.savesMin", {
                          save: formatPrice(coupon.discountPreview || 0),
                          min: formatPrice(coupon.minOrderAmount || 0),
                        })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={selected ? "outline" : "primary"}
                      onClick={() => applyCoupon(coupon.code)}
                      disabled={selected}
                    >
                      {selected
                        ? t("pawmart.checkout.appliedStatus")
                        : t("pawmart.checkout.apply")}
                    </Button>
                  </div>
                );
              })}

              {(checkoutCoupons ?? []).length > 3 && (
                <button
                  onClick={() => setCouponDialogOpen(true)}
                  className="text-sm font-semibold text-amber-600 hover:underline"
                >
                  {t("pawmart.checkout.viewAllCoupons", {
                    count: (checkoutCoupons ?? []).length,
                  })}
                </button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <CreditCard size={16} className="text-amber-500" />{" "}
              {t("pawmart.checkout.paymentMethod")}
            </h2>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Truck size={16} /> {t("pawmart.checkout.cashOnDelivery")}
                </div>
                <input
                  type="radio"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} />{" "}
                  {t("pawmart.checkout.bankingTransfer")}
                </div>
                <input
                  type="radio"
                  checked={paymentMethod === "banking"}
                  onChange={() => setPaymentMethod("banking")}
                />
              </label>
              {/* <div className="rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                VNPay{" "}
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                  Coming soon
                </span>
              </div> */}
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <QrCode size={16} /> {t("pawmart.checkout.vnpay")}
                </div>
                <input
                  type="radio"
                  checked={paymentMethod === "vnpay"}
                  onChange={() => setPaymentMethod("vnpay")}
                />
              </label>
            </div>

            {paymentMethod === "vnpay" && (
              <div className="mt-4 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900/40 dark:bg-emerald-900/20">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {t("pawmart.checkout.vnpayTitle")}
                </p>
                <p className="text-emerald-700/90 dark:text-emerald-300/90">
                  {t("pawmart.checkout.vnpayDesc")}
                </p>
              </div>
            )}

            {paymentMethod === "banking" && (
              <div className="mt-4 space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900/40 dark:bg-blue-900/20">
                <p className="font-semibold text-blue-700 dark:text-blue-300">
                  {t("pawmart.checkout.bankInstructions")}
                </p>
                <p className="text-blue-700/90 dark:text-blue-300/90">
                  {t("pawmart.checkout.bankInfo")}
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-blue-700 dark:bg-gray-900 dark:text-blue-300">
                  <QrCode size={16} /> {t("pawmart.checkout.qrPlaceholder")}
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("pawmart.checkout.orderNote")}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-amber-400 dark:border-gray-700 dark:bg-gray-900"
                placeholder={t("pawmart.checkout.notePlaceholder")}
              />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
            {t("pawmart.checkout.orderSummary")}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">
                {t("pawmart.checkout.subtotal")}
              </span>
              <span>{formatPrice(selectedSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">
                {t("pawmart.checkout.shipping")}
              </span>
              <span>{formatPrice(baseShippingFee)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>{t("pawmart.checkout.shippingDiscount")}</span>
              <span>-{formatPrice(shippingDiscount)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>{t("pawmart.checkout.couponDiscount")}</span>
              <span>-{formatPrice(couponDiscount)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold dark:border-gray-800">
              <span>{t("pawmart.checkout.total")}</span>
              <span className="text-amber-600">{formatPrice(finalTotal)}</span>
            </div>
          </div>
          <Button
            className="mt-4 w-full"
            loading={createOrderMutation.isPending}
            onClick={() => createOrderMutation.mutate()}
          >
            {createOrderMutation.isPending
              ? t("pawmart.checkout.processing")
              : t("pawmart.checkout.placeOrder")}
          </Button>
        </aside>
      </div>

      <Modal
        isOpen={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        title={t("pawmart.checkout.selectAddressTitle")}
        size="lg"
      >
        <div className="space-y-2">
          {addresses.map((address) => (
            <button
              key={address.id}
              onClick={() => {
                setSelectedAddressId(address.id);
                setAddressDialogOpen(false);
              }}
              className={`w-full rounded-xl border p-3 text-left transition ${
                (selectedAddressId || defaultAddress?.id) === address.id
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                  : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              }`}
            >
              <p className="font-medium text-gray-900 dark:text-white">
                {address.fullName} - {address.phone}{" "}
                {address.isDefault && `(${t("pawmart.common.default")})`}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {address.detailAddress}, {address.ward}, {address.district},{" "}
                {address.province}
              </p>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={couponDialogOpen}
        onClose={() => setCouponDialogOpen(false)}
        title={t("pawmart.checkout.availableCouponsTitle")}
        size="lg"
      >
        <div className="space-y-3">
          {couponLoading && (
            <p className="text-sm text-gray-500">
              {t("pawmart.checkout.loadingCoupons")}
            </p>
          )}
          {couponError && (
            <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
              {t("pawmart.checkout.unableLoadAvailableCoupons")}
            </p>
          )}
          {!couponLoading &&
            !couponError &&
            (checkoutCoupons ?? []).length === 0 && (
              <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-800">
                {t("pawmart.checkout.noUsableCoupons")}
              </p>
            )}
          {(checkoutCoupons ?? []).map((coupon) => {
            return (
              <div
                key={`${coupon.code}-${coupon.userCouponId ?? coupon.couponId}`}
                className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-amber-600">
                      {coupon.code}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {coupon.description ||
                        t("pawmart.checkout.discountCoupon")}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {coupon.appliesTo === "shipping"
                        ? t("pawmart.checkout.shippingCoupon")
                        : t("pawmart.checkout.orderCoupon")}{" "}
                      · {t("pawmart.filters.min")}{" "}
                      {formatPrice(coupon.minOrderAmount || 0)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {coupon.source === "assigned"
                        ? t("pawmart.checkout.assignedToYou")
                        : t("pawmart.checkout.publicCampaign")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t("pawmart.checkout.expiresAt", {
                        date: formatDate(coupon.expiresAt),
                      })}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => applyCoupon(coupon.code)}>
                    {t("pawmart.checkout.apply")}
                  </Button>
                </div>
                <p className="mt-2 text-sm text-emerald-600">
                  {t("pawmart.checkout.savesMin", {
                    save: formatPrice(coupon.discountPreview || 0),
                    min: formatPrice(coupon.minOrderAmount || 0),
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
