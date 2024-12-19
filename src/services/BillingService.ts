import { generateDayAndYear } from "@/lib/utils";
import { InvoiceData } from "@/types/payment";
import prisma from "@/lib/prisma";
import appConstant from "./appConstant";
import MailerService from "./MailerService";
import path from "path";
import { createTempDir } from "@/actions/checkTempDirExist";
import { ContentManagementService } from "./cms/ContentManagementService";
import { FileObjectType } from "@/types/cms/common";
import { APIResponse } from "@/types/apis";
import os from "os";

const fs = require("fs");
const PDFDocument = require("pdfkit");

export class BillingService {
  // currency formatter

  async createPdf(invoice: InvoiceData, savePath: string): Promise<string> {
    let doc = new PDFDocument({ margin: 50 });

    // currency formatter

    function formatCurrency(amount: number, currency: string) {
      return amount.toFixed(2) + " " + currency;
    }

    // Hr
    function generateHr(y: number) {
      doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
    }
    const logoPath = path.join(process.cwd(), appConstant.platformLogo);
    // header
    function generateHeader(invoiceData: InvoiceData) {
      doc
        .image(logoPath, 50, 45, { width: 50 })
        .fillColor("#666")
        .fontSize(20)
        .text(invoiceData.businessInfo.platformName, 110, 62)
        .fontSize(10)
        .text(invoiceData.businessInfo.address, 200, 65, { align: "right" })
        .text(`${invoiceData.businessInfo.state}, ${invoiceData.businessInfo.country}`, 200, 80, { align: "right" })
        .text(`GSTIN: ${invoiceData.businessInfo.gstNumber}`, 200, 97, { align: "right" })
        .text(`PAN: ${invoiceData.businessInfo.panNumber}`, 200, 112, { align: "right" })
        .moveDown();
    }

    // generate bill to
    function generateBillTo(invoice: InvoiceData) {
      doc
        .fillColor("#444")
        .fontSize(12)
        .text("Bill To", 50, 152)
        .fillColor("#666")
        .fontSize(10)
        .text(invoice.stundentInfo.name, 50, 175, { align: "left" })
        .text(invoice.stundentInfo.email, 50, 195, { align: "left" })
        .text(invoice.stundentInfo.phone, 50, 215, { align: "left" })

        .moveDown();
    }

    // customer information
    function generateCustomerInformation(invoice: InvoiceData) {
      doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 260);

      generateHr(285);

      const customerInformationTop = 300;

      doc
        .fontSize(10)
        .text("Invoice Number:", 50, customerInformationTop, { align: "center", width: "100%" })
        .font("Helvetica-Bold")
        .text(invoice.invoiceNumber, 150, customerInformationTop, { align: "center", width: "100%" })
        .font("Helvetica")
        .text("Invoice Date:", 50, customerInformationTop + 15, { align: "center", width: "100%" })
        .text(generateDayAndYear(new Date()), 150, customerInformationTop + 15, { align: "center", width: "100%" })
        .font("Helvetica")
        .moveDown();

      generateHr(342);
    }

    // table row
    function generateTableRow(y: number, c1: string, c2: string, c3: string, c4: string) {
      doc
        .fillColor("#444444")
        .fontSize(10)
        .text(c1, 50, y)
        .text(c2, 300, y)
        .text(c3, 350, y, { width: 150, align: "center" })
        .text(c4, 440, y, { width: 150, align: "center" });
    }

    // table
    function generateInvoiceTable(invoice: InvoiceData) {
      const invoiceTableTop = 380;

      doc.font("Helvetica-Bold");
      generateTableRow(invoiceTableTop, "Course Name", "Amount", "Validity", " Total");
      generateHr(invoiceTableTop + 20);
      doc.font("Helvetica");

      const item = invoice.courseDetail;
      const position = invoiceTableTop + 30;
      generateTableRow(
        position,
        String(item.courseName),
        formatCurrency(invoice.totalAmount, String(invoice.currency)),
        item.validUpTo,
        formatCurrency(invoice.totalAmount, String(invoice.currency))
      );

      generateHr(position + 20);
    }

    // price summary
    function generatePriceSummary(x: number, align: string, color: string, r1: string, r2: string, r3: string) {
      doc
        .fillColor(color)
        .fontSize(10)
        .text(r1, x, 450, { align: align })
        .text(r2, x, 470, { align: align })
        .text(r3, x, 490, { align: align });
    }

    // calculate GST
    function calculateGst(totalAmount: number, taxRate: number) {
      const subtotal = totalAmount / (1 + taxRate / 100);
      const gstAmount = totalAmount - subtotal;

      return {
        subtotal: subtotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
      };
    }

    const homeDir = os.homedir();
    const dirPath = path.join(homeDir, `${appConstant.homeDirName}/${appConstant.staticFileDirName}`);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, {
        recursive: true,
      });
    }

    const amountDetail = calculateGst(Number(invoice.totalAmount), invoice.businessInfo.taxRate);
    generateHeader(invoice);
    generateBillTo(invoice);
    generateCustomerInformation(invoice);
    generateInvoiceTable(invoice);
    if (invoice.businessInfo.taxIncluded) {
      generatePriceSummary(
        350,
        "left",
        "#666",
        `Subtotal in ${invoice.currency}`,
        `Integrated GST (${invoice.businessInfo.taxRate}%)`,
        `Total in ${invoice.currency}`
      );

      generatePriceSummary(
        500,
        "left",
        "#000",
        `${amountDetail.subtotal}`,
        `${amountDetail.gstAmount}`,
        `${invoice.totalAmount.toFixed(2)}`
      );
    }
    return new Promise<string>((resolve, reject) => {
      const outputStream = doc.pipe(fs.createWriteStream(savePath));

      outputStream.on("error", (error: any) => {
        reject(`Error writing file: ${error.message}`);
      });

      outputStream.on("finish", () => {
        resolve(savePath);
      });

      doc.end(); // End the document after piping to the output stream
    });
  }

  async mailInvoice(pdfPath: string, invoice: InvoiceData) {
    const configData = {
      name: invoice.stundentInfo.name,
      email: invoice.stundentInfo.email,
      url: `${process.env.NEXTAUTH_URL}/courses/${invoice.courseDetail.slug}`,
      pdfPath: pdfPath,
      course: {
        name: invoice.courseDetail.courseName,
        thumbnail: invoice.courseDetail.thumbnail,
      },
    };

    MailerService.sendMail("COURSE_ENROLMENT", configData).then(async (result) => {
      console.log(result.error);
      fs.unlinkSync(pdfPath);
    });
  }

  async uploadInvoice(pdfPath: string, invoice: InvoiceData): Promise<APIResponse<string>> {
    return new Promise(async (resolve, reject) => {
      if (pdfPath) {
        const pdfBuffer = fs.readFileSync(pdfPath);
        const cms = new ContentManagementService().getCMS(appConstant.defaultCMSProvider);
        const cmsConfig = (await cms.getCMSConfig()).body?.config;

        const response = await cms.uploadPrivateFile(
          cmsConfig,
          pdfBuffer,
          FileObjectType.INVOICE,
          `${invoice.invoiceNumber}_invocie.pdf`,
          "pdf"
        );

        if (response.success) {
          await prisma.invoice.update({
            where: {
              id: invoice.invoiceNumber,
            },
            data: {
              pdfPath: response.body,
            },
          });
        }

        resolve(response);
      }
    });
  }

  async sendInvoice(invoice: InvoiceData, savePath: string) {
    this.createPdf(invoice, savePath)
      .then(async (result) => {
        this.uploadInvoice(result, invoice)
          .then((result) => {
            this.mailInvoice(savePath, invoice)
              .then((r) => console.log("invoice sent through mail"))
              .catch((error) => {
                console.log(error, "error while sending  invoice mail");
              });
          })
          .catch((error) => {
            console.log(error, "error while uploading invoice");
          });
      })
      .catch((error) => {
        console.log(error, "error while creating pdf");
      });
  }
}
