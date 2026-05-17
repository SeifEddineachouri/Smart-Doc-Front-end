export type PaymentEntitlementStatus = 'active' | 'trial' | 'inactive' | 'past_due' | 'canceled' | 'refund';

export interface PaymentEntitlementResponse {
	active: boolean;
	status: PaymentEntitlementStatus;
	planId: string | null;
	planName?: string | null;
	amountCents?: number | null;
	currency?: string | null;
	updatedAt: string | null;
	expiresAt: string | null;
}

export interface PaymentStatusResponse {
	active: boolean;
	status: PaymentEntitlementStatus;
	planId: string | null;
	updatedAt: string | null;
	expiresAt: string | null;
}

export interface PaymentCheckoutSessionRequest {
	userId: string;
	planId: string;
	idempotencyKey: string;
	successUrl: string;
	cancelUrl: string;
	customerEmail: string;
}

export interface PaymentCheckoutSessionResponse {
	checkoutUrl: string;
	sessionId: string;
	status: PaymentEntitlementStatus;
	entitlementActive: boolean;
	planName: string;
	amountCents: number;
	currency: string;
}

export interface PaymentRefundRequest {
	userId: string;
	sessionId?: string;
	paymentIntentId?: string;
	reason?: string;
}

export interface PaymentRefundResponse {
	status: PaymentEntitlementStatus;
	refundedAt?: string | null;
}