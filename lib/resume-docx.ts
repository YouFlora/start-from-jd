// 把 ResumeData 渲染成 Word .docx Blob。
// 设计目标：结构匹配屏幕预览 (components/resume-preview.tsx)，
// 但用 Word 原生段落 + 项目符号，便于 ATS 解析与用户后续编辑。
//
// 单位约定（docx 库）：
//   - size：half-points（10pt → 20）
//   - spacing.before/after：twips（1pt = 20 twips；1mm ≈ 56.7 twips）
//   - 页面 margin：twips（1440 = 1 英寸）

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";

import { isPlaceholder } from "@/lib/utils";
import type { ExperienceDocument, ExperienceItem, Lang, ResumeData } from "@/types/resume";

const FONT = "Calibri";

// 字号（half-points）
const SIZE_NAME = 36; // 18pt
const SIZE_TITLE = 21; // 10.5pt
const SIZE_CONTACT = 18; // 9pt
const SIZE_BODY = 20; // 10pt
const SIZE_SECTION = 21; // 10.5pt
const SIZE_META = 18; // 9pt（日期 / 地点 / notes）

// 间距（twips）
const SP_AFTER_HEADER = 80;
const SP_AFTER_SECTION = 60;
const SP_AFTER_BLOCK = 60;
const SP_AFTER_BULLET = 20;

// A4 14mm × 16mm 边距 ≈ 794 × 907 twips
const MARGIN_V = 794;
const MARGIN_H = 907;

export async function resumeToDocxBlob(r: ResumeData, lang: Lang = "zh"): Promise<Blob> {
  const children: Paragraph[] = [];

  pushHeader(children, r.basics, lang);
  if (r.summary) pushSummary(children, r.summary);

  if (r.experience.length > 0) {
    pushSectionTitle(children, "Experience");
    r.experience.forEach((e) => pushExperience(children, e));
  }

  if (r.projects && r.projects.length > 0) {
    pushSectionTitle(children, "Projects");
    r.projects.forEach((p) => pushProject(children, p));
  }

  if (r.education.length > 0) {
    pushSectionTitle(children, "Education");
    r.education.forEach((e) => pushEducation(children, e));
  }

  if (r.skills.hard.length > 0 || r.skills.soft.length > 0) {
    pushSectionTitle(children, "Skills");
    if (r.skills.hard.length > 0) pushSkillRow(children, "Technical", r.skills.hard);
    if (r.skills.soft.length > 0) pushSkillRow(children, "Soft", r.skills.soft);
  }

  if (r.missing && r.missing.length > 0) {
    pushMissingNote(children, r.missing);
  }

  const doc = new Document({
    creator: "Start From JD",
    title: "Resume",
    styles: {
      default: {
        document: { run: { font: FONT, size: SIZE_BODY } },
      },
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 360, hanging: 240 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: MARGIN_V, bottom: MARGIN_V, left: MARGIN_H, right: MARGIN_H },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

// ===== 各 section 渲染 =====

function pushHeader(out: Paragraph[], basics: ResumeData["basics"], lang: Lang) {
  const namePlaceholder = lang === "en" ? "TBD · Candidate Name" : "TBD · 候选人姓名";
  const emailPlaceholder = lang === "en" ? "TBD · Email" : "TBD · 联系邮箱";
  const name = isPlaceholder(basics.name) ? namePlaceholder : basics.name;

  out.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 0 },
      children: [
        new TextRun({ text: name, bold: true, size: SIZE_NAME, font: FONT }),
      ],
    })
  );

  if (basics.title) {
    out.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: basics.title, size: SIZE_TITLE, font: FONT }),
        ],
      })
    );
  }

  const contactParts: string[] = [];
  if (!isPlaceholder(basics.email)) contactParts.push(basics.email);
  else contactParts.push(emailPlaceholder);
  if (basics.phone && !isPlaceholder(basics.phone)) contactParts.push(basics.phone);
  if (basics.location && !isPlaceholder(basics.location)) contactParts.push(basics.location);
  (basics.links ?? []).forEach((l) => {
    if (!isPlaceholder(l.url)) contactParts.push(l.url);
  });

  out.push(
    new Paragraph({
      spacing: { after: SP_AFTER_HEADER },
      border: {
        bottom: { color: "BFBFBF", space: 4, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [
        new TextRun({
          text: contactParts.join("  ·  "),
          size: SIZE_CONTACT,
          font: FONT,
          color: "555555",
        }),
      ],
    })
  );
}

function pushSummary(out: Paragraph[], text: string) {
  out.push(
    new Paragraph({
      spacing: { before: 80, after: SP_AFTER_SECTION },
      children: [new TextRun({ text, size: SIZE_BODY, font: FONT })],
    })
  );
}

function pushSectionTitle(out: Paragraph[], title: string) {
  out.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      border: {
        bottom: { color: "BFBFBF", space: 2, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: SIZE_SECTION,
          font: FONT,
          characterSpacing: 12,
        }),
      ],
    })
  );
}

function pushExperience(
  out: Paragraph[],
  item: ResumeData["experience"][number]
) {
  const dateLine = `${item.startDate} – ${item.endDate}${
    item.location ? "  ·  " + item.location : ""
  }`;
  out.push(
    new Paragraph({
      spacing: { before: 60, after: 0 },
      tabStops: [{ type: TabStopType.RIGHT, position: 10000 }],
      children: [
        new TextRun({ text: item.role, bold: true, size: SIZE_BODY, font: FONT }),
        new TextRun({
          text: "  ·  " + item.company,
          size: SIZE_BODY,
          font: FONT,
          color: "444444",
        }),
        new TextRun({ text: "\t", size: SIZE_BODY, font: FONT }),
        new TextRun({
          text: dateLine,
          size: SIZE_META,
          font: FONT,
          color: "666666",
        }),
      ],
    })
  );
  item.bullets.forEach((b, i) => {
    out.push(
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: {
          before: 0,
          after: i === item.bullets.length - 1 ? SP_AFTER_BLOCK : SP_AFTER_BULLET,
        },
        children: [new TextRun({ text: b, size: SIZE_BODY, font: FONT })],
      })
    );
  });
}

function pushProject(
  out: Paragraph[],
  item: NonNullable<ResumeData["projects"]>[number]
) {
  out.push(
    new Paragraph({
      spacing: { before: 60, after: 0 },
      children: [
        new TextRun({ text: item.name, bold: true, size: SIZE_BODY, font: FONT }),
        ...(item.role
          ? [
              new TextRun({
                text: "  ·  " + item.role,
                size: SIZE_BODY,
                font: FONT,
                color: "444444",
              }),
            ]
          : []),
      ],
    })
  );
  item.bullets.forEach((b, i) => {
    out.push(
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: {
          before: 0,
          after: i === item.bullets.length - 1 ? SP_AFTER_BLOCK : SP_AFTER_BULLET,
        },
        children: [new TextRun({ text: b, size: SIZE_BODY, font: FONT })],
      })
    );
  });
}

function pushEducation(
  out: Paragraph[],
  item: ResumeData["education"][number]
) {
  out.push(
    new Paragraph({
      spacing: { before: 60, after: SP_AFTER_BLOCK },
      tabStops: [{ type: TabStopType.RIGHT, position: 10000 }],
      children: [
        new TextRun({ text: item.degree, bold: true, size: SIZE_BODY, font: FONT }),
        new TextRun({
          text: "  ·  " + item.school,
          size: SIZE_BODY,
          font: FONT,
          color: "444444",
        }),
        ...(item.notes
          ? [
              new TextRun({
                text: `   (${item.notes})`,
                size: SIZE_META,
                font: FONT,
                color: "666666",
              }),
            ]
          : []),
        new TextRun({ text: "\t", size: SIZE_BODY, font: FONT }),
        new TextRun({
          text: `${item.startDate} – ${item.endDate}`,
          size: SIZE_META,
          font: FONT,
          color: "666666",
        }),
      ],
    })
  );
}

function pushSkillRow(out: Paragraph[], label: string, items: string[]) {
  out.push(
    new Paragraph({
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({
          text: label + ": ",
          bold: true,
          size: SIZE_BODY,
          font: FONT,
        }),
        new TextRun({
          text: items.join("  ·  "),
          size: SIZE_BODY,
          font: FONT,
        }),
      ],
    })
  );
}

function pushMissingNote(out: Paragraph[], missing: string[]) {
  out.push(
    new Paragraph({
      spacing: { before: 200, after: 40 },
      border: {
        top: { color: "BFBFBF", space: 4, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [
        new TextRun({
          text: "TBD — gather before submitting (do not fabricate):",
          italics: true,
          size: SIZE_META,
          font: FONT,
          color: "888888",
        }),
      ],
    })
  );
  missing.forEach((m) => {
    const clean = m.replace(/^MISSING(?=[:：\s])/, "TBD");
    out.push(
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { before: 0, after: 20 },
        children: [
          new TextRun({
            text: clean,
            italics: true,
            size: SIZE_META,
            font: FONT,
            color: "888888",
          }),
        ],
      })
    );
  });
}

export function resumeDocxFilename(r: ResumeData): string {
  if (isPlaceholder(r.basics.name)) return "resume.docx";
  return `${r.basics.name}-resume.docx`;
}

// ===== ExperienceDocument 导出（Step 0 全量结构化经历，留给用户手改）=====
// 与 resumeToDocxBlob 的区别：
//   - 不裁剪：所有 items / bullets 全保留，按 type 分组（Work / Projects / Education / Other）
//   - 保留 rawNotes（用户原始口语片段），方便回查
//   - 不做"单页"硬约束，因为这是给用户自己编辑用的素材稿
//   - Section 标题用「Experience Notes」前缀提示这是底稿而非最终简历

const ITEM_TYPE_SECTIONS: { type: ExperienceItem["type"]; label: string }[] = [
  { type: "work", label: "Work Experience" },
  { type: "project", label: "Projects" },
  { type: "education", label: "Education" },
  { type: "other", label: "Other" },
];

export async function experienceToDocxBlob(doc: ExperienceDocument, lang: Lang = "zh"): Promise<Blob> {
  const children: Paragraph[] = [];

  // 顶部说明 + summary
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "Experience Notes",
          bold: true,
          size: SIZE_NAME,
          font: FONT,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      border: {
        bottom: { color: "BFBFBF", space: 4, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [
        new TextRun({
          text:
            lang === "en"
              ? "Structured experience draft — full fidelity, ready for manual editing into a final resume"
              : "结构化经历底稿 — 完整保留所有事实，方便手工编辑为最终简历",
          italics: true,
          size: SIZE_META,
          font: FONT,
          color: "666666",
        }),
      ],
    })
  );

  if (doc.summary) {
    pushSectionTitle(children, "Summary");
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({ text: doc.summary, size: SIZE_BODY, font: FONT }),
        ],
      })
    );
  }

  // 按 type 分组
  for (const { type, label } of ITEM_TYPE_SECTIONS) {
    const items = doc.items.filter((it) => it.type === type);
    if (items.length === 0) continue;
    pushSectionTitle(children, label);
    items.forEach((it) => pushExperienceItem(children, it, lang));
  }

  if (doc.skills.hard.length > 0 || doc.skills.soft.length > 0) {
    pushSectionTitle(children, "Skills");
    if (doc.skills.hard.length > 0) pushSkillRow(children, "Technical", doc.skills.hard);
    if (doc.skills.soft.length > 0) pushSkillRow(children, "Soft", doc.skills.soft);
  }

  if (doc.languages.length > 0) {
    pushSectionTitle(children, "Languages");
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 40 },
        children: [
          new TextRun({
            text: doc.languages.join("  ·  "),
            size: SIZE_BODY,
            font: FONT,
          }),
        ],
      })
    );
  }

  const docFile = new Document({
    creator: "Start From JD",
    title: "Experience Notes",
    styles: {
      default: {
        document: { run: { font: FONT, size: SIZE_BODY } },
      },
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 360, hanging: 240 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: MARGIN_V, bottom: MARGIN_V, left: MARGIN_H, right: MARGIN_H },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(docFile);
}

function pushExperienceItem(out: Paragraph[], item: ExperienceItem, lang: Lang) {
  out.push(
    new Paragraph({
      spacing: { before: 80, after: 0 },
      tabStops: [{ type: TabStopType.RIGHT, position: 10000 }],
      children: [
        new TextRun({ text: item.title, bold: true, size: SIZE_BODY, font: FONT }),
        new TextRun({
          text: "  ·  " + item.org,
          size: SIZE_BODY,
          font: FONT,
          color: "444444",
        }),
        new TextRun({ text: "\t", size: SIZE_BODY, font: FONT }),
        new TextRun({
          text: `${item.startDate} – ${item.endDate}`,
          size: SIZE_META,
          font: FONT,
          color: "666666",
        }),
      ],
    })
  );
  item.bullets.forEach((b, i) => {
    out.push(
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: {
          before: 0,
          after: i === item.bullets.length - 1 && !item.rawNotes ? SP_AFTER_BLOCK : SP_AFTER_BULLET,
        },
        children: [new TextRun({ text: b, size: SIZE_BODY, font: FONT })],
      })
    );
  });
  if (item.rawNotes) {
    out.push(
      new Paragraph({
        spacing: { before: 20, after: SP_AFTER_BLOCK },
        indent: { left: 360 },
        children: [
          new TextRun({
            text: (lang === "en" ? "Notes: " : "备注：") + item.rawNotes,
            italics: true,
            size: SIZE_META,
            font: FONT,
            color: "888888",
          }),
        ],
      })
    );
  }
}

export function experienceDocxFilename(): string {
  return "experience-notes.docx";
}
