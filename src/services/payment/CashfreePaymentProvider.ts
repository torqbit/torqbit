import { Cashfree, OrderEntity } from "cashfree-pg";
import prisma from "@/lib/prisma";
import { $Enums, cashfreePaymentStatus, paymentStatus } from "@prisma/client";
import os from "os";
import path from "path";
import {
  PaymentApiResponse,
  CoursePaymentConfig,
  PaymentServiceProvider,
  UserConfig,
  CashFreePaymentData,
  InvoiceData,
} from "@/types/payment";
import appConstant from "../appConstant";
import { APIResponse } from "@/types/apis";
import { addDays, generateDayAndYear } from "@/lib/utils";
import { BillingService } from "../BillingService";
import { businessConfig } from "../businessConfig";

export interface paymentCustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export class CashfreePaymentProvider implements PaymentServiceProvider {
  name: string = String(process.env.GATEWAY_PROVIDER_NAME);
  clientId: string;
  secretId: string;
  apiVersion: string = "2023-08-01";

  constructor(clientId: string, secretId: string) {
    this.clientId = clientId;
    this.secretId = secretId;
  }

  async successCallback(
    productId: number,
    customerDetail: paymentCustomerDetail,
    orderId: string,
    paymentData: CashFreePaymentData
  ): Promise<APIResponse<string>> {
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
          studentId_courseId: {
            studentId: customerDetail.id,
            courseId: productId,
          },
        },
        select: {
          registrationId: true,
        },
      });

      !isRigistered &&
        (await prisma.courseRegistration.create({
          data: {
            studentId: customerDetail.id,
            courseId: productId,
            expireIn: courseExpiryDate,
            courseState: $Enums.CourseState.ENROLLED,
            courseType: $Enums.CourseType.PAID,
            orderId: orderId,
          },
          select: {
            registrationId: true,
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

      return new APIResponse(true, 200, "Course has been purchased");
    } catch (error: any) {
      return new APIResponse(false, 400, error);
    }
  }

  async updateOrder(
    orderId: string,
    gatewayOrderId: string,
    currentStatus: paymentStatus
  ): Promise<APIResponse<paymentStatus>> {
    if (orderId && gatewayOrderId) {
      if (currentStatus === paymentStatus.SUCCESS) {
        return new APIResponse(true, 200, "Order already updated");
      }

      Cashfree.XClientId = this.clientId;
      Cashfree.XClientSecret = this.secretId;
      const detail = await Cashfree.PGOrderFetchPayments(this.apiVersion, gatewayOrderId);

      if (detail.data.length > 0) {
        let currentTime = new Date();

        const paymentDetail = detail.data.reduce((latest, current) => {
          const latestTime = new Date(String(latest.payment_time)).getTime();
          const currentTime = new Date(String(latest.payment_time)).getTime();
          return currentTime > latestTime ? current : latest;
        });

        let cashfreePaymentData: CashFreePaymentData = {
          paymentMethod: paymentDetail.payment_group,
          gatewayOrderId: gatewayOrderId,
          paymentId: paymentDetail.cf_payment_id,
          amount: paymentDetail.order_amount,
          currency: paymentDetail.payment_currency,
          message: paymentDetail.payment_message,
          bankReference: paymentDetail.bank_reference,
          paymentTime: paymentDetail.payment_time,
        };

        const latestCashfreeOrder = await prisma.cashfreeOrder.findFirst({
          where: {
            orderId: orderId,
          },
          select: {
            id: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const [updateOrder, updateCashfreeOrder] = await prisma.$transaction([
          prisma.order.update({
            where: {
              id: orderId,
            },
            data: {
              latestStatus:
                paymentDetail.payment_status === paymentStatus.SUCCESS ? paymentStatus.SUCCESS : paymentStatus.PENDING,
              updatedAt: currentTime,
              currency: paymentDetail.payment_currency,
            },
            select: {
              productId: true,
              studentId: true,
              user: true,
            },
          }),
          prisma.cashfreeOrder.update({
            where: {
              id: latestCashfreeOrder?.id,
            },
            data: {
              ...cashfreePaymentData,
              gatewayStatus: paymentDetail.payment_status as cashfreePaymentStatus,
              paymentId: Number(cashfreePaymentData.paymentId),

              updatedAt: currentTime,
            },
          }),
        ]);

        if (paymentDetail.payment_status === paymentStatus.SUCCESS) {
          let customerDetail: paymentCustomerDetail = {
            id: updateOrder.studentId,
            name: String(updateOrder.user.name),
            email: String(updateOrder.user.email),
            phone: String(updateOrder.user.phone),
          };
          const response = await this.successCallback(
            updateOrder.productId,
            customerDetail,
            orderId,
            cashfreePaymentData
          );
          return new APIResponse(response.success, response.status, response.message);
        }

        return new APIResponse(true, 200, "Order has been updated");
      } else {
        return new APIResponse(false, 404, "Payment detail is missing");
      }
    } else {
      return new APIResponse(false, 404, "Gateway order id  is missing");
    }
  }

  async testClientCredentials(): Promise<number> {
    Cashfree.XClientId = this.clientId;
    Cashfree.XClientSecret = this.secretId;
    try {
      const response = await Cashfree.PGFetchOrder(this.apiVersion, "test-123");
      return response.status;
    } catch (error) {
      return (error as any).response.status;
    }
  }

  async processPendingPayment(
    orderId: string,
    userConfig: UserConfig,
    courseConfig: CoursePaymentConfig
  ): Promise<PaymentApiResponse> {
    let currentTime = new Date();
    const orderDetail = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        createdAt: true,
      },
    });
    const latestCashfreeOrder = await prisma.cashfreeOrder.findFirst({
      where: {
        orderId: orderId,
      },
      select: {
        createdAt: true,
        sessionExpiry: true,
        sessionId: true,
        gatewayOrderId: true,
        gatewayStatus: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (latestCashfreeOrder) {
      const cashfreeOrderDetail = await prisma.cashfreeOrder.create({
        data: {
          studentId: userConfig.studentId,
          amount: courseConfig.coursePrice,
          courseId: courseConfig.courseId,
          orderId: orderId,
          sessionExpiry: latestCashfreeOrder.sessionExpiry,
          sessionId: latestCashfreeOrder.sessionId,
        },
        select: {
          orderId: true,
          id: true,
          createdAt: true,
          sessionExpiry: true,
          sessionId: true,
        },
      });

      let orderCreatedTime = orderDetail?.createdAt.getTime();

      if (
        cashfreeOrderDetail &&
        cashfreeOrderDetail.sessionExpiry &&
        cashfreeOrderDetail.sessionExpiry.getTime() < currentTime.getTime()
      ) {
        await prisma.order.update({
          where: {
            id: orderId,
          },
          data: {
            updatedAt: currentTime,
            latestStatus: $Enums.paymentStatus.FAILED,
          },
        });
        const order = await prisma.order.create({
          data: {
            studentId: userConfig.studentId,
            latestStatus: $Enums.paymentStatus.INITIATED,
            productId: courseConfig.courseId,
            paymentGateway: $Enums.gatewayProvider.CASHFREE,
            amount: courseConfig.amount,
          },
        });

        const paymentData = await this.createOrder(order.id, userConfig, courseConfig);
        return paymentData;
      } else {
        await prisma.order.update({
          where: {
            id: orderId,
          },
          data: {
            latestStatus: $Enums.paymentStatus.PENDING,
          },
        });

        await prisma.cashfreeOrder.update({
          where: {
            id: cashfreeOrderDetail.id,
          },
          data: {
            gatewayOrderId: latestCashfreeOrder.gatewayOrderId,
            sessionId: latestCashfreeOrder.sessionId,
            sessionExpiry: latestCashfreeOrder.sessionExpiry,
            gatewayProvider: $Enums.gatewayProvider.CASHFREE,
            updatedAt: currentTime,
          },
        });

        return {
          success: true,
          message: "Redirecting to payment page",
          gatewayName: $Enums.gatewayProvider.CASHFREE,
          gatewayResponse: {
            sessionId: String(cashfreeOrderDetail?.sessionId),
          },
        };
      }
    } else {
      return {
        success: false,
        error: `Something went wrong, contact the support team.`,
      };
    }
  }

  async createOrder(
    orderId: string,
    userConfig: UserConfig,
    courseConfig: CoursePaymentConfig
  ): Promise<PaymentApiResponse> {
    try {
      const cashfreeOrderDetail = await prisma.cashfreeOrder.create({
        data: {
          studentId: userConfig.studentId,
          amount: courseConfig.coursePrice,
          courseId: courseConfig.courseId,
          orderId: orderId,
        },
        select: {
          orderId: true,
          id: true,
        },
      });

      let currentTime = new Date();
      const sessionExpiry = new Date(currentTime.getTime() + appConstant.payment.sessionExpiryDuration);

      Cashfree.XClientId = this.clientId;
      Cashfree.XClientSecret = this.secretId;
      Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;
      const date = new Date();
      let request = {
        order_amount: courseConfig.amount,
        order_currency: "INR",

        customer_details: {
          customer_id: userConfig.studentId,
          customer_name: userConfig.studentName,
          customer_email: userConfig.email,
          customer_phone: userConfig.phone,
        },
        order_meta: {
          return_url: `${process.env.NEXTAUTH_URL}/courses/${courseConfig.slug}?callback=payment&order_id=${orderId}`,
          notify_url: `${process.env.NEXTAUTH_URL}/api/v1/course/payment/cashfree/webhook`,
          payment_methods: "upi, nb, cc, dc,app",
        },
        order_note: "",
        order_expiry_time: sessionExpiry.toISOString(),
      };

      const paymentData = await Cashfree.PGCreateOrder(this.apiVersion, request)
        .then(async (response: any) => {
          let a = response.data;

          await prisma.order.update({
            where: {
              id: orderId,
            },
            data: {
              orderId: a.order_id,
              latestStatus: $Enums.paymentStatus.PENDING,
            },
          });

          await prisma.cashfreeOrder.update({
            where: {
              id: cashfreeOrderDetail.id,
            },
            data: {
              gatewayOrderId: a.order_id,
              sessionId: a.payment_session_id,
              sessionExpiry: sessionExpiry,
              gatewayProvider: $Enums.gatewayProvider.CASHFREE,
              updatedAt: date,
            },
          });

          return {
            success: true,
            message: "Payment Successfull",
            gatewayName: this.name,
            gatewayResponse: {
              sessionId: a.payment_session_id,
            },
          } as PaymentApiResponse;
        })
        .catch(async (error: any) => {
          const orderDetail = await prisma.order.update({
            where: {
              id: orderId,
            },
            data: {
              latestStatus: $Enums.paymentStatus.FAILED,
              updatedAt: date,
            },
            select: {
              id: true,
            },
          });

          const latestCashfreeOrder = await prisma.cashfreeOrder.findFirst({
            where: {
              orderId: orderDetail.id,
            },
            select: {
              id: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          if (latestCashfreeOrder) {
            await prisma.cashfreeOrder.update({
              where: {
                id: latestCashfreeOrder.id,
              },
              data: {
                gatewayStatus: $Enums.cashfreePaymentStatus.FAILED,

                updatedAt: date,
                message: error.response.data.message,
              },
            });
          }

          return { success: false, error: error.response.data.message };
        });
      return paymentData as PaymentApiResponse;
    } catch (error) {
      return { success: false, error: "error" };
    }
  }

  async purchaseCourse(
    courseConfig: CoursePaymentConfig,
    userConfig: UserConfig,
    orderId: string
  ): Promise<PaymentApiResponse> {
    let currentTime = new Date();
    console.log(orderId, "d");
    const orderDetail = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        latestStatus: true,
      },
    });
    if (orderDetail?.latestStatus === $Enums.paymentStatus.PENDING) {
      let latestCashfreeOrder = await prisma.cashfreeOrder.findFirst({
        where: {
          orderId: orderId,
        },
        select: {
          gatewayStatus: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (
        Number(latestCashfreeOrder?.createdAt) + appConstant.payment.lockoutMinutes > currentTime.getTime() &&
        latestCashfreeOrder &&
        latestCashfreeOrder.gatewayStatus !== $Enums.cashfreePaymentStatus.FAILED &&
        latestCashfreeOrder.gatewayStatus !== $Enums.cashfreePaymentStatus.USER_DROPPED
      ) {
        return {
          success: false,
          error: `Your payment session is still active .`,
        };
      }
      const paymentResponse = await this.processPendingPayment(orderId, userConfig, courseConfig);
      return paymentResponse;
    } else {
      const response = await this.createOrder(orderId, userConfig, courseConfig);
      return response;
    }
  }
}
