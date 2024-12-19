import { $Enums, ConfigurationState, CourseRegistration, Order, paymentMode, paymentStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import appConstant from "../appConstant";
import {
  PaymentApiResponse,
  CoursePaymentConfig,
  PaymentServiceProvider,
  UserConfig,
  GatewayConfig,
  CashFreeConfig,
  OrderDetail,
  OrderHistory,
  CFPaymentsConfig,
} from "@/types/payment";
import { CashfreePaymentProvider } from "./CashfreePaymentProvider";
import SecretsManager from "../secrets/SecretsManager";
import { APIResponse } from "@/types/apis";

export const paymentsConstants = {
  CF_CLIENT_ID: "CLIENT_ID",
  CF_CLIENT_SECRET: "CLIENT_SECRET",
};
export class PaymentManagemetService {
  serviceType: string = "payments";

  getGatewayConfig = async (gateway: string): Promise<APIResponse<any>> => {
    switch (gateway) {
      case $Enums.gatewayProvider.CASHFREE:
        const cf = await prisma.serviceProvider.findUnique({
          select: {
            providerDetail: true,
            state: true,
          },
          where: {
            service_type: this.serviceType,
            provider_name: gateway,
          },
        });
        console.log(cf);
        if (cf) {
          return new APIResponse<any>(true, 200, "Succesfully fetched the gateway configuration", {
            state: cf.state,
            config: cf.providerDetail,
          });
        } else {
          return new APIResponse<any>(false, 404, "Failed to fetched the gateway configuration");
        }
      default:
        return new APIResponse<any>(false, 400, "No configuration found for the given payment gateway");
    }
  };

  verifyConnection = async (gateway: string, clientId: string, clientSecret: string): Promise<APIResponse<void>> => {
    switch (gateway) {
      case $Enums.gatewayProvider.CASHFREE:
        const cf = new CashfreePaymentProvider(clientId, clientSecret);
        const result = await cf.testClientCredentials();
        const success = result != 401;
        const message =
          result == 401
            ? `Invalid crendentials. Check the credentials again`
            : `Succesfully authenticated with the given credentials.`;
        if (success) {
          //save the config
          const cfConfig: CFPaymentsConfig = {
            name: $Enums.gatewayProvider.CASHFREE,
            auth: {
              secretId: clientSecret,
              clientId: clientId,
            },
          };
          this.saveConfig(cfConfig, ConfigurationState.AUTHENTICATED);
        }
        return new APIResponse(result != 401, result, message, undefined, result == 401 ? message : undefined);

      default:
        throw new Error(`No implementation found for the payment gateway - ${gateway}`);
    }
  };

  saveConfig = async (config: GatewayConfig, configurationState: ConfigurationState): Promise<APIResponse<void>> => {
    switch (config.name) {
      case $Enums.gatewayProvider.CASHFREE:
        const c = config as CFPaymentsConfig;
        const secretStore = SecretsManager.getSecretsProvider();
        const count = await prisma.serviceProvider.count({
          where: {
            service_type: this.serviceType,
          },
        });
        if (count > 0) {
          await prisma.serviceProvider.updateMany({
            data: {
              providerDetail: c.paymentConfig,
              state: configurationState,
            },
            where: {
              service_type: this.serviceType,
            },
          });
        } else {
          await prisma.serviceProvider.create({
            data: {
              provider_name: $Enums.gatewayProvider.CASHFREE,
              service_type: this.serviceType,
              providerDetail: c.paymentConfig,
              state: configurationState,
            },
          });
        }

        if (c.auth) {
          await secretStore.put(paymentsConstants.CF_CLIENT_ID, c.auth.clientId);
          await secretStore.put(paymentsConstants.CF_CLIENT_SECRET, c.auth.secretId);
        }
        return new APIResponse<void>(true, 200, `Successfully saved the payments configuration`);

      default:
        return new APIResponse<void>(
          false,
          400,
          `Failed to save the payments configuration`,
          undefined,
          `Payment configuration not found`
        );
    }
  };

  getPaymentProvider = async (config: GatewayConfig): Promise<PaymentServiceProvider> => {
    switch (config.name) {
      case $Enums.gatewayProvider.CASHFREE:
        const secretStore = SecretsManager.getSecretsProvider();
        const clientId = await secretStore.get(paymentsConstants.CF_CLIENT_ID);
        const clientSecret = await secretStore.get(paymentsConstants.CF_CLIENT_SECRET);
        if (clientId && clientSecret) {
          return new CashfreePaymentProvider(clientId, clientSecret);
        } else {
          throw new Error("Access key and secret for Cashfree not found");
        }

      default:
        throw new Error("Unable to find the payment provider! Contact your support team");
    }
  };

  updateOrder = async (orderId: string): Promise<APIResponse<paymentStatus>> => {
    const orderDetail = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        paymentGateway: true,
        orderId: true,
        latestStatus: true,
      },
    });
    if (orderDetail?.orderId) {
      switch (orderDetail?.paymentGateway) {
        case $Enums.gatewayProvider.CASHFREE:
          const cf = await this.getPaymentProvider({ name: orderDetail.paymentGateway });
          const response = await cf.updateOrder(orderId, orderDetail.orderId, orderDetail.latestStatus || undefined);

          return new APIResponse(response.success, response.status, response.message, response.body);

        default:
          return new APIResponse(false, 404, "Unable to find the payment provider! Contact your support team");
      }
    } else {
      return new APIResponse(false, 404, "Order detail is missing");
    }
  };

  getPaymentStatus = async (
    gatewayProvider: $Enums.gatewayProvider,
    orderId: string
  ): Promise<{
    status: string | null;
    paymentDisable: boolean;
    alertType: string;
    alertMessage: string;
    alertDescription: string;
  }> => {
    switch (gatewayProvider) {
      case $Enums.gatewayProvider.CASHFREE:
        let currentTime = new Date().getTime();
        const getDetail = await prisma.cashfreeOrder.findFirst({
          where: {
            gatewayOrderId: orderId,
          },
          select: {
            createdAt: true,
            gatewayStatus: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        if (getDetail) {
          let progressTime = getDetail.createdAt.getTime() + appConstant.payment.lockoutMinutes;
          if (getDetail.gatewayStatus === $Enums.cashfreePaymentStatus.FAILED) {
            return {
              status: getDetail.gatewayStatus,
              paymentDisable: false,
              alertType: "error",
              alertMessage: "Payment Failed",
              alertDescription: "Your payment has failed. Please contact support if you have any questions",
            };
          } else if (getDetail.gatewayStatus === $Enums.cashfreePaymentStatus.USER_DROPPED) {
            return {
              status: getDetail.gatewayStatus,
              paymentDisable: false,
              alertType: "warning",
              alertMessage: "Payment Dropped",
              alertDescription: "Your payment has been dropped. Please contact support if you have any questions",
            };
          } else if (getDetail.gatewayStatus === $Enums.cashfreePaymentStatus.SUCCESS) {
            return {
              status: getDetail.gatewayStatus as string,
              paymentDisable: false,
              alertType: "success",
              alertMessage: "Payment Successful",
              alertDescription: "Congratulations you have successfully purchased this course",
            };
          } else {
            if (progressTime > currentTime) {
              let remainingTime = (progressTime - currentTime) / 1000;
              return {
                status: getDetail.gatewayStatus,
                paymentDisable: remainingTime > 0 ? true : false,
                alertType: "warning",
                alertMessage: "Payment Pending",
                alertDescription: "Your payment is pending. Please contact support if you have any questions",
              };
            } else {
              return {
                status: getDetail.gatewayStatus,
                paymentDisable: false,
                alertType: "warning",
                alertMessage: "Payment Pending",
                alertDescription: "Your payment is pending. Please contact support if you have any questions",
              };
            }
          }
        }

      default:
        throw new Error("Unable to find the payment provider! contact with support team");
    }
  };

  getLatestOrder = async (studentId: string, productId: number): Promise<Order | undefined> => {
    const latestOrder = await prisma.order.findFirst({
      where: {
        studentId,
        productId,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
    return latestOrder || undefined;
  };

  getOrderHistoryByUser = async (studentId: string): Promise<OrderHistory[]> => {
    const orders = await prisma.$queryRaw<
      any[]
    >`SELECT o.latestStatus as status,o.amount,o.updatedAt as paymentDate,o.productId,o.orderId,o.currency,co.name as courseName,invoice.id as invoiceId FROM \`Order\` AS o  
    INNER JOIN Course as co ON co.courseId = o.productId
       LEFT OUTER JOIN Invoice as invoice ON invoice.studentId = ${studentId}  AND invoice.orderId = o.orderId
     WHERE o.studentId = ${studentId} AND o.updatedAt =  (SELECT MAX(updatedAt)
    FROM \`Order\` AS b 
    WHERE o.productId = b.productId AND o.studentId = ${studentId}) ORDER BY o.updatedAt ASC`;

    return orders;
  };

  processPayment = async (
    userConfig: UserConfig,
    courseConfig: CoursePaymentConfig,
    gatewayConfig: GatewayConfig
  ): Promise<PaymentApiResponse> => {
    const currentTime = new Date();
    const latestOrder = await this.getLatestOrder(userConfig.studentId, courseConfig.courseId);

    /**
     * if payment is in success state
     */

    if (latestOrder && latestOrder.latestStatus === $Enums.paymentStatus.SUCCESS) {
      return {
        success: false,
        error: "You have already purchased this course",
      };
    }

    /**
     *  if payment is in initiated state
     */

    if (latestOrder && latestOrder.latestStatus === $Enums.paymentStatus.INITIATED) {
      const orderCreatedTime = new Date(latestOrder.createdAt).getTime();

      if (orderCreatedTime + appConstant.payment.lockoutMinutes > currentTime.getTime()) {
        return {
          success: false,
          error: `Your payment session is still active.`,
        };
      }
    }

    /**
     * if latest order is in failed state or not available
     */
    try {
      const paymentProvider = await this.getPaymentProvider(gatewayConfig);

      if (!latestOrder || latestOrder.latestStatus === $Enums.paymentStatus.FAILED) {
        const order = await prisma.order.create({
          data: {
            studentId: userConfig.studentId,
            latestStatus: $Enums.paymentStatus.INITIATED,
            productId: courseConfig.courseId,
            paymentGateway: gatewayConfig.name as $Enums.gatewayProvider,
            amount: courseConfig.amount,
          },
          select: {
            id: true,
          },
        });

        const paymentData = await paymentProvider.purchaseCourse(courseConfig, userConfig, order.id);
        return paymentData;
      }

      /**
       *   if payment is in pending state
       */

      if (latestOrder.latestStatus === $Enums.paymentStatus.PENDING) {
        const pendingPaymentResponse = await paymentProvider.purchaseCourse(courseConfig, userConfig, latestOrder.id);
        return pendingPaymentResponse;
      }
    } catch (error) {
      console.log(error);

      return {
        success: false,
        error: "Unable to find the payment provider.Contact the support team",
      };
    }

    return { success: false, error: "something went wrong" };
  };
}
