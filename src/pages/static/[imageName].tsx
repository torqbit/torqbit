import { GetServerSidePropsContext, NextPage } from "next";

import getImage from "@/lib/admin/cms/getImage";

const StaticImagePage = () => null;

export default StaticImagePage;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { req, res } = ctx;

  const params = ctx?.query;
  const file = getImage(res, params.imageName as string);
  if (params.imageName) {
    res.setHeader("Content-Type", "image/png");
    res.write(file);
    res.end();

    return {
      props: {},
    };
  }
};
