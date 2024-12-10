import { IEventAccessDeniedMailConfig, IEventAccessMailConfig, ITestEmailConfig } from "@/lib/emailConfig";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
  TailwindConfig,
} from "@react-email/components";
import * as React from "react";
interface IProps {
  configData: ITestEmailConfig;
}

export const TestEmailCredentialsEmail = ({ configData }: IProps) => {
  return (
    <Tailwind>
      <Html>
        <Head />

        <Preview>{`${process.env.NEXT_PUBLIC_PLATFORM_NAME}`}</Preview>

        <Head>
          <style></style>
        </Head>
        <Body className='bg-[#f5f5f5] my-auto mx-auto font-sans '>
          <Container className='border border-solid border-[#eaeaea] rounded my-[40px] mx-auto    max-w-[465px]'>
            <Heading className='text-black   w-full  text-[20px] font-normal  my-0  py-2 px-[20px]  mx-0 '>
              <Img height={50} width={50} style={{ display: "unset" }} src={`https://cdn.torqbit.com/static/torq.png`} />
            </Heading>
            <Hr className='border border-solid border-[#eaeaea]  mx-0 w-full' />
            <Section className='px-[20px]'>
              <Text className='text-black text-[20px] leading-[20px]'>Hey, {configData.name}!</Text>
              <Text className='text-[#888] text-[14px] leading-[20px]'>This is the Test Email for Email Credentials</Text>

              <Text className='text-[#000] text-[15px] m-0 '>
                Thanks & Regards <br />
              </Text>
              <Text className='text-black text-[15px] my-2'>{`${process.env.NEXT_PUBLIC_PLATFORM_NAME}`} team</Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};

export default TestEmailCredentialsEmail;
