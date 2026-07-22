import {
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from "docx";
import type { ResumeJson } from "@resumeai/shared";
import { getSpacing, ptToInch, ptToTwip } from "../spacing";
import { getTheme, type ResumeTheme, type ResumeThemeId } from "../themes";
import {
  assertResume,
  type GenerateResumeDocumentOptions,
  type GeneratedFile,
} from "../types";
import {
  contactLine,
  educationHeadline,
  formatDateRange,
  safeFileStem,
} from "../utils/format";

function themeFont(theme: ResumeTheme): string {
  return theme.fonts.body === "Times-Roman" ? "Times New Roman" : "Arial";
}

function sectionHeading(title: string, theme: ResumeTheme): Paragraph[] {
  const space = getSpacing(theme);
  return [
    new Paragraph({
      spacing: {
        before: ptToTwip(space.sectionGap),
        after: ptToTwip(space.ruleGap / 2),
      },
      border: {
        bottom: {
          color: theme.colors.rule.replace("#", ""),
          space: 4,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: Math.round(theme.fontSize.section * 2),
          font: themeFont(theme),
          color: theme.colors.accent.replace("#", ""),
        }),
      ],
    }),
  ];
}

function bullet(text: string, theme: ResumeTheme): Paragraph {
  const space = getSpacing(theme);
  return new Paragraph({
    spacing: {
      after: ptToTwip(space.bulletGap),
      line: 276,
    },
    indent: { left: ptToTwip(14) },
    children: [
      new TextRun({
        text: `•  ${text}`,
        size: Math.round(theme.fontSize.body * 2),
        font: themeFont(theme),
        color: theme.colors.text.replace("#", ""),
      }),
    ],
  });
}

function buildChildren(resume: ResumeJson, theme: ResumeTheme): Paragraph[] {
  const space = getSpacing(theme);
  const font = themeFont(theme);
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      spacing: { after: ptToTwip(space.headerGap) },
      children: [
        new TextRun({
          text: resume.personalInfo.name,
          bold: true,
          size: Math.round(theme.fontSize.name * 2),
          font,
          color: theme.colors.accent.replace("#", ""),
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: ptToTwip(space.sectionGap) },
      children: [
        new TextRun({
          text: contactLine(resume.personalInfo),
          size: Math.round(theme.fontSize.small * 2),
          font,
          color: theme.colors.muted.replace("#", ""),
        }),
      ],
    })
  );

  if (resume.personalInfo.summary) {
    children.push(...sectionHeading("Summary", theme));
    children.push(
      new Paragraph({
        spacing: { after: ptToTwip(space.lineGap), line: 276 },
        children: [
          new TextRun({
            text: resume.personalInfo.summary,
            size: Math.round(theme.fontSize.body * 2),
            font,
            color: theme.colors.text.replace("#", ""),
          }),
        ],
      })
    );
  }

  if (resume.skills.length) {
    children.push(...sectionHeading("Skills", theme));
    children.push(
      new Paragraph({
        spacing: { after: ptToTwip(space.lineGap), line: 276 },
        children: [
          new TextRun({
            text: resume.skills.join(" · "),
            size: Math.round(theme.fontSize.body * 2),
            font,
            color: theme.colors.text.replace("#", ""),
          }),
        ],
      })
    );
  }

  if (resume.experience.length) {
    children.push(...sectionHeading("Experience", theme));
    for (const job of resume.experience) {
      children.push(
        new Paragraph({
          spacing: { after: ptToTwip(space.lineGap) },
          children: [
            new TextRun({
              text: job.title,
              bold: true,
              size: Math.round(theme.fontSize.body * 2),
              font,
              color: theme.colors.text.replace("#", ""),
            }),
            new TextRun({
              text: `    ${formatDateRange(job.startDate, job.endDate)}`,
              size: Math.round(theme.fontSize.small * 2),
              font,
              color: theme.colors.muted.replace("#", ""),
            }),
          ],
        })
      );
      children.push(
        new Paragraph({
          spacing: { after: ptToTwip(space.lineGap) },
          children: [
            new TextRun({
              text: [job.company, job.location].filter(Boolean).join(" · "),
              italics: true,
              size: Math.round(theme.fontSize.small * 2),
              font,
              color: theme.colors.muted.replace("#", ""),
            }),
          ],
        })
      );
      for (const item of job.bullets) {
        children.push(bullet(item, theme));
      }
    }
  }

  if (resume.projects.length) {
    children.push(...sectionHeading("Projects", theme));
    for (const project of resume.projects) {
      children.push(
        new Paragraph({
          spacing: { after: ptToTwip(space.lineGap) },
          children: [
            new TextRun({
              text: project.name,
              bold: true,
              size: Math.round(theme.fontSize.body * 2),
              font,
              color: theme.colors.text.replace("#", ""),
            }),
          ],
        })
      );
      if (project.description) {
        children.push(
          new Paragraph({
            spacing: { after: ptToTwip(space.lineGap) },
            children: [
              new TextRun({
                text: project.description,
                size: Math.round(theme.fontSize.body * 2),
                font,
                color: theme.colors.text.replace("#", ""),
              }),
            ],
          })
        );
      }
      if (project.technologies?.length) {
        children.push(
          new Paragraph({
            spacing: { after: ptToTwip(space.lineGap) },
            children: [
              new TextRun({
                text: project.technologies.join(" · "),
                italics: true,
                size: Math.round(theme.fontSize.small * 2),
                font,
                color: theme.colors.muted.replace("#", ""),
              }),
            ],
          })
        );
      }
      for (const item of project.bullets) {
        children.push(bullet(item, theme));
      }
    }
  }

  if (resume.education.length) {
    children.push(...sectionHeading("Education", theme));
    for (const edu of resume.education) {
      children.push(
        new Paragraph({
          spacing: { after: ptToTwip(space.lineGap) },
          children: [
            new TextRun({
              text: educationHeadline(edu),
              bold: true,
              size: Math.round(theme.fontSize.body * 2),
              font,
              color: theme.colors.text.replace("#", ""),
            }),
            new TextRun({
              text: `    ${formatDateRange(edu.startDate, edu.endDate)}`,
              size: Math.round(theme.fontSize.small * 2),
              font,
              color: theme.colors.muted.replace("#", ""),
            }),
          ],
        })
      );
      for (const detail of edu.details ?? []) {
        children.push(bullet(detail, theme));
      }
    }
  }

  if (resume.certifications.length) {
    children.push(...sectionHeading("Certifications", theme));
    for (const cert of resume.certifications) {
      children.push(
        new Paragraph({
          spacing: { after: ptToTwip(space.lineGap) },
          children: [
            new TextRun({
              text: [cert.name, cert.issuer].filter(Boolean).join(" — "),
              bold: true,
              size: Math.round(theme.fontSize.body * 2),
              font,
              color: theme.colors.text.replace("#", ""),
            }),
          ],
        })
      );
      if (cert.date) {
        children.push(
          new Paragraph({
            spacing: { after: ptToTwip(space.blockGap) },
            children: [
              new TextRun({
                text: cert.date,
                size: Math.round(theme.fontSize.small * 2),
                font,
                color: theme.colors.muted.replace("#", ""),
              }),
            ],
          })
        );
      }
    }
  }

  return children;
}

/** Generate an ATS-friendly DOCX buffer from resume JSON. */
export async function generateResumeDocx(
  options: GenerateResumeDocumentOptions
): Promise<GeneratedFile> {
  assertResume(options.resume);
  const themeId: ResumeThemeId = options.theme ?? "classic";
  const theme = getTheme(themeId);
  const space = getSpacing(theme);
  const margin = convertInchesToTwip(ptToInch(space.pageMargin));
  const stem = safeFileStem(options.fileName ?? options.resume.personalInfo.name);

  const doc = new Document({
    creator: "ResumeAI",
    title: `${options.resume.personalInfo.name} — Resume`,
    description: "ATS-friendly one-column resume",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: margin,
              bottom: margin,
              left: margin,
              right: margin,
            },
          },
        },
        children: buildChildren(options.resume, theme),
      },
    ],
  });

  const buffer = Buffer.from(await Packer.toBuffer(doc));

  return {
    filename: `${stem}-${themeId}.docx`,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer,
  };
}

/** Browser-friendly DOCX Blob generator. */
export async function generateResumeDocxBlob(
  options: GenerateResumeDocumentOptions
): Promise<Blob> {
  assertResume(options.resume);
  const themeId: ResumeThemeId = options.theme ?? "classic";
  const theme = getTheme(themeId);
  const space = getSpacing(theme);
  const margin = convertInchesToTwip(ptToInch(space.pageMargin));

  const doc = new Document({
    creator: "ResumeAI",
    title: `${options.resume.personalInfo.name} — Resume`,
    description: "ATS-friendly one-column resume",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: margin,
              bottom: margin,
              left: margin,
              right: margin,
            },
          },
        },
        children: buildChildren(options.resume, theme),
      },
    ],
  });

  return Packer.toBlob(doc);
}
