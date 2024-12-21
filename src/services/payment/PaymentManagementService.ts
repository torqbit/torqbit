import { $Enums, ConfigurationState, CourseRegistration, Order, orderStatus, paymentStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import appConstant from "../appConstant";
import {
  PaymentApiResponse,
  CoursePaymentConfig,
  PaymentServiceProvider,
  UserConfig,
  GatewayConfig,
  OrderHistory,
  CFPaymentsConfig,
  InvoiceData,
  paymentCustomerDetail,
  ISuccessPaymentData,
} from "@/types/payment";
import { CashfreePaymentProvider } from "./CashfreePaymentProvider";
import SecretsManager from "../secrets/SecretsManager";
import { APIResponse } from "@/types/apis";
import { BillingService } from "../BillingService";
import { businessConfig } from "../businessConfig";
import { addDays, generateDayAndYear } from "@/lib/utils";
import os from "os";
import path from "path";

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

  async processRegistration(
    productId: number,
    customerDetail: paymentCustomerDetail,
    orderId: string,
    paymentData: ISuccessPaymentData
  ): Promise<APIResponse<CourseRegistration | undefined>> {
    try {
      const courseDetail = await prisma.course.findUnique({
        where: {
          courseId: productId,
        },
        select: {
          expiryInDays: true,
          slug: true,
          name: true,
          thumbnail: true,
          coursePrice: true,
          courseId: true,
        },
      });

      const courseExpiryDate = courseDetail && addDays(Number(courseDetail.expiryInDays));

      const isRigistered = await prisma.courseRegistration.findUnique({
        where: {
          orderId,
        },
        select: {
          registrationId: true,
        },
      });

      const courseRegistrationDetail =
        !isRigistered &&
        (await prisma.courseRegistration.create({
          data: {
            studentId: customerDetail.id,
            expireIn: courseExpiryDate,
            courseState: $Enums.CourseState.ENROLLED,
            courseType: $Enums.CourseType.PAID,
            orderId: orderId,
          },
        }));

      const invoiceData = await prisma.invoice.create({
        data: {
          studentId: customerDetail.id,
          taxRate: appConstant.payment.taxRate,
          taxIncluded: true,
          paidDate: String(paymentData.paymentTime),
          amountPaid: Number(paymentData.amount),
          orderId: String(paymentData.gatewayOrderId),
          items: { courses: [Number(courseDetail?.courseId)] },
        },
      });

      const invoiceConfig: InvoiceData = {
        courseDetail: {
          courseId: Number(courseDetail?.courseId),
          courseName: String(courseDetail?.name),
          slug: String(courseDetail?.slug),
          validUpTo: generateDayAndYear(addDays(Number(courseDetail?.expiryInDays))),
          thumbnail: String(courseDetail?.thumbnail),
        },

        totalAmount: Number(paymentData.amount),
        currency: String(paymentData.currency),
        businessInfo: {
          gstNumber: businessConfig.gstNumber,
          panNumber: businessConfig.panNumber,
          address: businessConfig.address,
          state: businessConfig.state,
          country: businessConfig.country,
          taxRate: Number(invoiceData.taxRate),
          taxIncluded: invoiceData.taxIncluded,
          platformName: appConstant.platformName,
        },
        stundentInfo: {
          name: customerDetail.name,
          email: customerDetail.email,
          phone: customerDetail.phone,
        },

        invoiceNumber: Number(invoiceData.id),
      };

      let homeDir = os.homedir();
      const savePath = path.join(
        homeDir,
        `${appConstant.homeDirName}/${appConstant.staticFileDirName}/${invoiceData.id}_invoice.pdf`
      );

      await new BillingService().sendInvoice(invoiceConfig, savePath);

      return new APIResponse(true, 200, "Course has been purchased", courseRegistrationDetail || undefined);
    } catch (error: any) {
      return new APIResponse(false, 400, error);
    }
  }

  updateOrder = async (orderId: string): Promise<APIResponse<paymentStatus>> => {
    const OrderDetail = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        paymentGateway: true,
        gatewayOrderId: true,
      },
    });
    if (OrderDetail?.gatewayOrderId) {
      switch (OrderDetail?.paymentGateway) {
        case $Enums.gatewayProvider.CASHFREE:
          const cf = await this.getPaymentProvider({ name: OrderDetail.paymentGateway });
          const response = await cf.updateOrder(orderId, OrderDetail.gatewayOrderId, this.processRegistration);

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
    orderId: string;
    alertType: string;
    alertMessage: string;
    alertDescription: string;
  }> => {
    switch (gatewayProvider) {
      case $Enums.gatewayProvider.CASHFREE:
        let currentTime = new Date().getTime();
        const getDetail = await prisma.order.findUnique({
          where: {
            gatewayOrderId: orderId,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            paymentStatus: true,
          },
        });
        if (getDetail) {
          let progressTime = getDetail.updatedAt.getTime() + appConstant.payment.lockoutMinutes;
          if (getDetail.paymentStatus === paymentStatus.FAILED) {
            return {
              status: getDetail.paymentStatus,
              paymentDisable: false,
              orderId: getDetail.id,
              alertType: "error",
              alertMessage: "Payment Failed",
              alertDescription: "Your payment has failed. Please contact support if you have any questions",
            };
          } else if (getDetail.paymentStatus === paymentStatus.USER_DROPPED) {
            return {
              status: getDetail.paymentStatus,
              paymentDisable: false,
              orderId: getDetail.id,

              alertType: "warning",
              alertMessage: "Payment Dropped",
              alertDescription: "Your payment has been dropped. Please contact support if you have any questions",
            };
          } else if (getDetail.paymentStatus === paymentStatus.SUCCESS) {
            return {
              status: getDetail.paymentStatus as string,
              paymentDisable: false,
              orderId: getDetail.id,

              alertType: "success",
              alertMessage: "Payment Successful",
              alertDescription: "Congratulations you have successfully purchased this course",
            };
          } else {
            if (progressTime > currentTime) {
              let remainingTime = (progressTime - currentTime) / 1000;
              return {
                status: getDetail.paymentStatus,
                paymentDisable: remainingTime > 0 ? true : false,
                alertType: "warning",
                orderId: getDetail.id,

                alertMessage: "Payment Pending",
                alertDescription: "Your payment is pending. Please contact support if you have any questions",
              };
            } else {
              return {
                status: getDetail.paymentStatus,
                paymentDisable: false,
                orderId: getDetail.id,

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
    >`SELECT o.orderStatus as status,o.amount,o.updatedAt as paymentDate,o.productId,o.gatewayOrderId,o.currency,co.name as courseName,invoice.id as invoiceId FROM \`Order\` AS o  
    INNER JOIN Course as co ON co.courseId = o.productId
       LEFT OUTER JOIN Invoice as invoice ON invoice.studentId = ${studentId}  AND invoice.orderId = o.gatewayOrderId
     WHERE o.studentId = ${studentId} AND o.updatedAt =  (SELECT MAX(updatedAt)
    FROM \`Order\` AS b 
    WHERE o.courseId = b.productId AND o.studentId = ${studentId}) ORDER BY o.updatedAt ASC`;

    return orders;
  };

  processPayment = async (
    userConfig: UserConfig,
    courseConfig: CoursePaymentConfig,
    gatewayConfig: GatewayConfig
  ): Promise<APIResponse<PaymentApiResponse>> => {
    const currentTime = new Date();
    const latestOrder = await this.getLatestOrder(userConfig.studentId, courseConfig.courseId);

    /**
     * if payment is in success state
     */

    if (latestOrder && latestOrder.orderStatus === orderStatus.SUCCESS) {
      return new APIResponse(false, 208, `You have already purchased this course`);
    }

    /**
     *  if payment is in initiated state
     */

    if (latestOrder && latestOrder.orderStatus === orderStatus.INITIATED) {
      const orderCreatedTime = new Date(latestOrder.updatedAt).getTime();

      if (orderCreatedTime + appConstant.payment.lockoutMinutes > currentTime.getTime()) {
        return new APIResponse(false, 102, `Your payment session is still active.`);
      }
    }

    /**
     * if latest order is in failed state or not available
     */
    try {
      const paymentProvider = await this.getPaymentProvider(gatewayConfig);

      if (!latestOrder || latestOrder.orderStatus === orderStatus.FAILED) {
        const order = await prisma.order.create({
          data: {
            studentId: userConfig.studentId,
            orderStatus: orderStatus.INITIATED,
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

      if (latestOrder.orderStatus === orderStatus.PENDING) {
        const pendingPaymentResponse = await paymentProvider.purchaseCourse(courseConfig, userConfig, latestOrder.id);
        return pendingPaymentResponse;
      }

      return new APIResponse(false, 500, "something went wrong.Contact the support team");
    } catch (error: any) {
      return new APIResponse(false, 500, error);
    }
  };
}
