import SvgIcons from "@/components/SvgIcons";
import { generateDayAndYear } from "@/lib/utils";
import { getFetch } from "@/services/request";
import { OrderHistory } from "@/types/payment";
import { $Enums } from "@prisma/client";
import { Flex, message, Table } from "antd";
import Link from "next/link";
import { FC, useEffect, useState } from "react";

const PaymentHistory: FC<{ active: boolean }> = ({ active }) => {
  const [messageApi, contextMessageHolder] = message.useMessage();
  const [paymentData, setPaymentData] = useState<{
    loading: boolean;
    data?: OrderHistory[];
  }>();

  const columns: any = [
    {
      title: "COURSE NAME",
      dataIndex: "courseName",
      key: "courseName",
      fixed: "left",
    },
    {
      title: "STATUS",
      align: "center",

      dataIndex: "status",
      key: "status",
    },
    {
      title: "AMOUNT",
      dataIndex: "amount",
      align: "center",
      render: (_: any, OrderDetail: OrderHistory) => (
        <div>
          {OrderDetail.amount} {OrderDetail.currency}
        </div>
      ),

      key: "amount",
    },
    {
      title: "PAYMENT DATE",
      align: "center",
      dataIndex: "paymentDate",

      key: "paymentDate",
    },
    {
      title: "RECEIPT",
      align: "center",
      dataIndex: "receipt",

      render: (_: any, OrderDetail: OrderHistory) => (
        <>
          {OrderDetail.status === $Enums.paymentStatus.SUCCESS && (
            <Link href={`/setting/invoice/download/${OrderDetail.invoiceId}`} target="_blank">
              <Flex align="center" gap={5} justify="center">
                {SvgIcons.download} Download
              </Flex>{" "}
            </Link>
          )}
        </>
      ),
      key: "receipt",
    },
  ];

  const data =
    paymentData?.data &&
    paymentData?.data.map((d, i) => {
      return {
        ...d,
        key: i,
        paymentDate: generateDayAndYear(new Date(d.paymentDate)),
      };
    });

  const getPaymentData = async () => {
    try {
      setPaymentData({ ...paymentData, loading: true });
      const res = await getFetch("/api/v1/course/payment/history");

      const result = await res.json();

      if (result.success) {
        setPaymentData({
          loading: false,
          data: result.paymentHistory,
        });
      } else {
        setPaymentData({ ...paymentData, loading: false });
        messageApi.error(result.error);
      }
    } catch (error: any) {
      setPaymentData({ ...paymentData, loading: false });
      messageApi.error(error);
    }
  };

  useEffect(() => {
    active && getPaymentData();
  }, [active]);

  return (
    <>
      {contextMessageHolder}

      <Table
        size="small"
        loading={paymentData?.loading}
        className="users_table"
        columns={columns}
        dataSource={data}
        scroll={{ x: 800 }}
      />
    </>
  );
};

export default PaymentHistory;
