import { ICompletionEmailConfig } from "@/lib/emailConfig";

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
  TailwindConfig,
} from "@react-email/components";
import { Flex } from "antd";
import * as React from "react";

interface IProps {
  configData: ICompletionEmailConfig;
}

export const CourseCompletionEmail = ({ configData }: IProps) => {
  return (
    <Html>
      <Head />

      <Preview>{`${process.env.NEXT_PUBLIC_PLATFORM_NAME}`}</Preview>
      <Tailwind
        config={
          {
            theme: {
              extend: {},

              screens: {
                sm: "640px",
                // => @media (min-width: 640px) { ... }

                md: "768px",
                // => @media (min-width: 768px) { ... }

                lg: "1024px",
                // => @media (min-width: 1024px) { ... }

                xl: "1280px",
                // => @media (min-width: 1280px) { ... }

                "2xl": "1636px",
                // => @media (min-width: 1536px) { ... }
              },
            },
          } as TailwindConfig
        }
      >
        <Head>
          <style></style>
        </Head>
        <Body className="bg-[#f5f5f5] my-auto mx-auto font-sans ">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto    max-w-[465px]">
            <Heading className="text-black   w-full  text-[20px] font-normal  my-0 text-center py-2  mx-0 bg-[#fff]">
              <Flex align="center" justify="center">
                <Img
                  height={50}
                  width={50}
                  style={{ display: "unset" }}
                  src={`https://torqbit-dev.b-cdn.net/static/torq.png`}
                />
              </Flex>
            </Heading>
            <Section className="px-[20px]">
              <Text className="text-black text-[20px] leading-[20px]">Hey, {configData.name}!</Text>
              <Text className="text-[#888] text-[14px] leading-[20px]">
                {" "}
                Congratulations! You&apos;ve successfully completed {configData.courseName}. We&apos;re thrilled to
                celebrate this ahievement with you and commend your hard work and dedication throughout the course.
              </Text>
              <Text className="text-[#888] text-[14px] leading-[20px]">
                You can download your certificate of completion by clicking the below image.{" "}
              </Text>
              <Section className="flex item-center gap-5">
                <Link href={configData.url}>
                  <Img
                    src={`https://torqbit-dev.b-cdn.net/static/certificate-template.png`}
                    className="w-full"
                    alt="course"
                  />
                </Link>
              </Section>

              <Text className="text-[#888] text-[14px] leading-[20px]">
                If you have any questions, feel free to email our support team, or even send a reply to this email. We
                wouuld be happy to answer any queries.
              </Text>
              <Text className="text-[#000] text-[15px] m-0 ">
                Thanks & Regards <br />
              </Text>
              <Text className="text-black text-[15px] my-2">{`${process.env.NEXT_PUBLIC_PLATFORM_NAME}`} team</Text>

              <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
              <Text className="text-[#888] text-[14px] leading-[20px]">
                If you&apos;re having trouble with the button above, copy and paste the URL below into your web browser.
              </Text>
              <Link className="text-blue-600 cursor-pointer">{configData.url}</Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default CourseCompletionEmail;
