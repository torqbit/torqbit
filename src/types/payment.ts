import { $Enums, Order, CashfreeOrder, paymentStatus } from "@prisma/client";
import { z } from "zod";
import { APIResponse } from "./apis";

export interface CashFreeConfig extends GatewayConfig {
  clientId: string;
  secretId: string;
}

export interface UserConfig {
  studentId: string;
  email: string;
  phone: string;
  studentName: string;
}

export interface CoursePaymentConfig {
  courseId: number;
  slug: string;
  amount: number;
  coursePrice: number;
}

export interface GatewayResponse {
  sessionId: string;
}

export interface PaymentApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  gatewayName?: string;
  status?: number;
  gatewayResponse?: GatewayResponse;
}

export interface PaymentServiceProvider {
  name: string;
  purchaseCourse(
    courseConfig: CoursePaymentConfig,
    userConfig: UserConfig,
    orderId: string
  ): Promise<PaymentApiResponse>;
  updateOrder(
    orderId: string,
    gatewayOrderId: string,
    currentStatus?: paymentStatus
  ): Promise<APIResponse<paymentStatus>>;
}

export interface CashFreePaymentData {
  status?: $Enums.paymentStatus;
  paymentMethod?: string;
  gatewayOrderId?: string;
  paymentId?: string;
  currency?: string;
  amount?: number;
  message?: string;
  bankReference?: string;
  paymentTime?: string;
  gatewayStatus?: $Enums.cashfreePaymentStatus;
}

export interface OrderDetail extends Order {
  gatewayOrder: CashfreeOrder[];
}

export interface InvoiceData {
  courseDetail: {
    courseId: number;
    slug: string;
    courseName: string;
    validUpTo: string;
    thumbnail: string;
  };
  businessInfo: {
    gstNumber: string;
    panNumber: string;
    address: string;
    state: string;
    country: string;
    taxRate: number;
    taxIncluded: boolean;
    platformName: string;
  };
  stundentInfo: {
    name: string;
    phone: string;
    email: string;
  };

  totalAmount: number;
  currency: string;

  invoiceNumber: number;
}

export interface OrderHistory {
  status: string;
  paymentDate: Date;
  amount: number;
  courseName: string;
  invoiceId: number;
  currency: string;
}

export const paymentGatewayName = z.object({
  gateway: z.string().min(2, "Payment gateway name is required"),
});

export const paymentAuth = z.object({
  apiKey: z.string().min(2, "Access key is required"),
  secretKey: z.string().min(2, "Secret key is required"),
  gateway: z.string().min(2, "Payment gateway is required"),
});

export type PaymentAuthConfig = z.infer<typeof paymentAuth>;

export const paymentInfo = z.object({
  currency: z.string().min(2, "Choose the currency"),
  paymentMethods: z.array(z.string()).min(1, "Atleast one payment method must be specified"),
  gateway: z.string().min(2, "Payment gateway is required"),
});

export type PaymentInfoConfig = z.infer<typeof paymentInfo>;

export interface GatewayConfig {
  name: string;
  paymentConfig?: {
    currency: string;
    paymentMethods: string[];
  };
}

export interface CFPaymentsConfig extends GatewayConfig {
  name: string;
  auth: {
    clientId: string;
    secretId: string;
  };
}
