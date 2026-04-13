export type PaymentDto = {
payment_id: string;
status: string;
amount: number;
currency: string;
payment_method?: string;
paid_at?: string | null;
};
