import { useQuery } from "@tanstack/react-query";
import { useUid } from "@/live/db";
import { billingRpc, FREE, type Entitlements } from "@/lib/billing";
export function useBilling(enabled = true) {
 const uid = useUid();
 const query = useQuery({
  queryKey: ["billing", uid], enabled: enabled && !!uid,
  queryFn: () => billingRpc<Entitlements>("billing_snapshot"),
  refetchInterval: 30000, staleTime: 5000,
 });
 return { ...query, uid, entitlement: query.data ?? FREE, loading: uid === undefined || (!!uid && query.isPending), refresh: query.refetch };
}
