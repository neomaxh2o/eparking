import BillingClosure from '@/models/BillingClosure';

export async function listBillingClosures(query: Record<string, unknown>) {
  return BillingClosure.find(query).sort({ createdAt: -1 }).lean();
}
