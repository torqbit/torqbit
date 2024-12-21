import prisma from "@/lib/prisma";
import { NextApiResponse, NextApiRequest } from "next";
import { errorHandler } from "@/lib/api-middlewares/errorHandler";
import { withMethods } from "@/lib/api-middlewares/with-method";
import { withAuthentication } from "@/lib/api-middlewares/with-authentication";
import { $Enums } from "@prisma/client";
import { getCookieName } from "@/lib/utils";
import { getToken } from "next-auth/jwt";
import { PaymentManagemetService } from "@/services/payment/PaymentManagementService";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    let cookieName = getCookieName();

    const token = await getToken({
      req,
      secret: process.env.NEXT_PUBLIC_SECRET,
      cookieName,
    });

    const { courseId } = req.query;

    const latestOrder = await prisma.order.findUnique({
      where: {
        studentId_productId: {
          productId: Number(courseId),
          studentId: String(token?.id),
        },
      },

      select: {
        orderStatus: true,
        paymentGateway: true,
        gatewayOrderId: true,
      },
    });

    if (latestOrder && latestOrder.gatewayOrderId) {
      new PaymentManagemetService()
        .getPaymentStatus(latestOrder?.paymentGateway as $Enums.gatewayProvider, latestOrder.gatewayOrderId)
        .then((result) => {
          return res.status(200).json({
            success: true,
            status: latestOrder.orderStatus,
            gatewayStatus: result.status,
            orderId: result.orderId,
            paymentDisable: result.paymentDisable,
            alertType: result.alertType,
            alertMessage: result.alertMessage,
            alertDescription: result.alertDescription,
          });
        })
        .catch((error) => {
          return res.status(200).json({ success: false, status: latestOrder.orderStatus, paymentDisable: false });
        });
    } else {
      return res.status(200).json({ success: false, remainingTime: 0 });
    }
  } catch (error) {
    return errorHandler(error, res);
  }
};

export default withMethods(["GET"], withAuthentication(handler));
