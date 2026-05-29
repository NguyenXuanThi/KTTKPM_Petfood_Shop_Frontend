import { PackageCheck, Truck } from "lucide-react";
import OrdersPage from "./OrdersPage";

export default function ShippingOrdersPage() {
  return (
    <OrdersPage
      onlyShipping
      icon={<Truck size={18} />}
      emptyIcon={<PackageCheck size={30} />}
    />
  );
}
