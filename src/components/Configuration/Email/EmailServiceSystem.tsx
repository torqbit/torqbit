import { Button, Flex, Form, Input, message, Select, Steps, Tag } from "antd";
import ConfigFormLayout from "../ConfigFormLayout";
import ConfigForm from "../ConfigForm";
import { useEffect, useState } from "react";
import SvgIcons from "@/components/SvgIcons";
import { EmailCredentialsConfig } from "@/types/cms/email";
import emailClient from "@/lib/admin/email/email-client";

const EmailServiceSystem = () => {
  const [emailForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const getEmailCredentials = () => {
    emailClient.getEmailCredendialsConfig(
      (response) => {
        setIsConnected(true);
        emailForm.setFieldsValue(response.body);
      },
      (error) => {
        messageApi.error(error);
      }
    );
  };

  useEffect(() => {
    getEmailCredentials();
  }, []);

  const saveAndTestEmailCredentials = () => {
    setLoading(true);
    let data: EmailCredentialsConfig = {
      smtpHost: emailForm.getFieldsValue().smtpHost,
      smtpUser: emailForm.getFieldsValue().smtpUser,
      smtpPassword: emailForm.getFieldsValue().smtpPassword,
      smtpFromEmail: emailForm.getFieldsValue().smtpFromEmail,
    };
    emailClient.saveAndTestEmailCredentials(
      data,
      (response) => {
        messageApi.success(response.message);
        setLoading(false);
        emailForm.resetFields();
        getEmailCredentials();
      },
      (error) => {
        messageApi.error(error);
        setLoading(false);
      }
    );
  };

  const emailSecretItems = [
    {
      title: "Host Name",
      description: "The host name that will be used to authenticate with the Email service",
      optional: false,

      input: <Input disabled={isConnected} placeholder='smtp.gmail.com' width={250} />,
      inputName: "smtpHost",
    },

    {
      title: "User Name",
      description: "The user name that will be used to authenticate with the Email service",
      optional: false,

      input: <Input disabled={isConnected} placeholder='username' width={250} />,
      inputName: "smtpUser",
    },
    {
      title: "Password",
      description: "The password that will be used to authenticate with the Email service",
      optional: false,
      input: <Input.Password disabled={isConnected} placeholder='password' width={250} />,
      inputName: "smtpPassword",
    },
    {
      title: "From Email",
      description: "The email address that will be used to send emails from",
      optional: false,
      input: <Input disabled={isConnected} placeholder='From Email' width={250} />,
      inputName: "smtpFromEmail",
    },
  ];

  return (
    <>
      {contextHolder}
      <h3>Email Service</h3>
      <ConfigFormLayout
        extraContent={
          <Flex align='center' gap={10}>
            {
              <Button
                disabled
                onClick={() => {
                  emailForm.resetFields;
                }}>
                Reset
              </Button>
            }

            {isConnected ? (
              <Tag style={{ padding: "5px 10px" }}>
                <Flex align='center' gap={5}>
                  <i style={{ lineHeight: 0, fontSize: 15 }}>{SvgIcons.checkFilled}</i>
                  <span>Connected</span>
                </Flex>
              </Tag>
            ) : (
              <Button loading={loading} onClick={() => emailForm.submit()} type='primary'>
                Test/Save
              </Button>
            )}
          </Flex>
        }
        formTitle={"Email Service"}>
        <Form form={emailForm} onFinish={saveAndTestEmailCredentials} requiredMark={false}>
          {emailSecretItems.map((item, i) => {
            return (
              <ConfigForm
                input={
                  <Form.Item
                    style={{ width: 250 }}
                    name={item.inputName}
                    rules={[{ required: true, message: `${item.title} is required` }]}>
                    {item.input}
                  </Form.Item>
                }
                title={item.title}
                description={item.description}
                divider={i === emailSecretItems.length - 1 ? false : true}
                inputName={""}
                optional={item.optional}
              />
            );
          })}
        </Form>
      </ConfigFormLayout>
    </>
  );
};

export default EmailServiceSystem;
