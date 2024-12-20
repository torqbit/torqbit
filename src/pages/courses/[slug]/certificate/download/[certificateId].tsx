import { GetServerSidePropsContext } from "next";

import prisma from "@/lib/prisma";
import { downloadPrivateFile } from "@/actions/downloadPrivateFile";

const DownloadCertificate = () => null;

export default DownloadCertificate;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { req, res, query } = ctx;

  const certificate = await prisma.courseCertificates.findUnique({
    where: {
      id: String(query.certificateId),
    },
    select: {
      pdfPath: true,
    },
  });
  if (certificate?.pdfPath) {
    const getFile = await downloadPrivateFile(certificate?.pdfPath);

    if (getFile.body) {
      const arrayBuffer = getFile.body;

      const buffer = Buffer.from(arrayBuffer);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; `);

      res.write(buffer);
      res.end();

      return {
        props: {},
      };
    }
  }
};
