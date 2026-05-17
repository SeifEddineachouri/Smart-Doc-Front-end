import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
	PaymentCheckoutSessionRequest,
	PaymentCheckoutSessionResponse,
	PaymentEntitlementResponse,
	PaymentRefundRequest,
	PaymentRefundResponse,
	PaymentStatusResponse
} from '../models';
import { API_BASE_URL } from './api.constants';

@Injectable({ providedIn: 'root' })
export class PaymentService {
	private readonly baseUrl = `${API_BASE_URL}/payments`;

	public constructor(private readonly http: HttpClient) {}

	getEntitlement(userId: string): Observable<PaymentEntitlementResponse> {
		return this.http.get<PaymentEntitlementResponse>(`${this.baseUrl}/entitlement/${userId}`);
	}

	getStatus(userId: string): Observable<PaymentStatusResponse> {
		return this.http.get<PaymentStatusResponse>(`${this.baseUrl}/status/${userId}`);
	}

	createCheckoutSession(payload: PaymentCheckoutSessionRequest): Observable<PaymentCheckoutSessionResponse> {
		return this.http.post<PaymentCheckoutSessionResponse>(`${this.baseUrl}/checkout-session`, payload);
	}

	requestRefund(payload: PaymentRefundRequest): Observable<PaymentRefundResponse> {
		return this.http.post<PaymentRefundResponse>(`${this.baseUrl}/refund`, payload);
	}
}