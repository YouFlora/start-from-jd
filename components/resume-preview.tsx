"use client";

import type { ResumeData } from "@/types/resume";
import { cn, isPlaceholder } from "@/lib/utils";

const isMissing = isPlaceholder;

// A4: 210mm × 297mm。屏幕预览模拟纸张；打印走 globals.css 的 @page 规则覆盖容器。
// 边距 / 字号 / 行高都偏紧凑，目标是单页放下"经历完整 + JD 关键词命中"的内容。
export function ResumePreview({ data }: { data: ResumeData }) {
  return (
    <div
      className={cn(
        "print-area mx-auto bg-white text-neutral-900 shadow-md ring-1 ring-neutral-200"
      )}
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "14mm 16mm",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
        fontSize: "10pt",
        lineHeight: 1.38,
        color: "#111",
      }}
    >
      <Header basics={data.basics} />
      {data.summary && <Summary text={data.summary} />}
      {data.experience.length > 0 && (
        <Section title="Experience">
          {data.experience.map((e, i) => (
            <div className="resume-block" key={i}>
              <ExperienceBlock item={e} />
            </div>
          ))}
        </Section>
      )}
      {data.projects && data.projects.length > 0 && (
        <Section title="Projects">
          {data.projects.map((p, i) => (
            <div className="resume-block" key={i}>
              <ProjectBlock item={p} />
            </div>
          ))}
        </Section>
      )}
      {data.education.length > 0 && (
        <Section title="Education">
          {data.education.map((e, i) => (
            <div className="resume-block" key={i}>
              <EducationBlock item={e} />
            </div>
          ))}
        </Section>
      )}
      {(data.skills.hard.length > 0 || data.skills.soft.length > 0) && (
        <Section title="Skills">
          {data.skills.hard.length > 0 && (
            <SkillRow label="Technical" items={data.skills.hard} />
          )}
          {data.skills.soft.length > 0 && (
            <SkillRow label="Soft" items={data.skills.soft} />
          )}
        </Section>
      )}
    </div>
  );
}

function Header({ basics }: { basics: ResumeData["basics"] }) {
  return (
    <header className="mb-2 border-b border-neutral-300 pb-2">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1
            className={cn(
              "font-bold leading-tight tracking-tight",
              isMissing(basics.name) && "text-blue-600"
            )}
            style={{ fontSize: "18pt" }}
          >
            {isMissing(basics.name) ? "TBD · 候选人姓名" : basics.name}
          </h1>
          <div className="mt-0.5 text-neutral-700" style={{ fontSize: "10.5pt" }}>
            {basics.title}
          </div>
        </div>
      </div>
      <ContactLine basics={basics} />
    </header>
  );
}

function ContactLine({ basics }: { basics: ResumeData["basics"] }) {
  const parts: { value: string; missing: boolean }[] = [
    {
      value: isMissing(basics.email) ? "TBD · 联系邮箱" : basics.email,
      missing: isMissing(basics.email),
    },
  ];
  if (basics.phone && !isMissing(basics.phone)) {
    parts.push({ value: basics.phone, missing: false });
  }
  if (basics.location && !isMissing(basics.location)) {
    parts.push({ value: basics.location, missing: false });
  }
  (basics.links ?? []).forEach((l) => {
    if (!isMissing(l.url)) parts.push({ value: l.url, missing: false });
  });
  return (
    <div
      className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-neutral-700"
      style={{ fontSize: "9pt" }}
    >
      {parts.map((p, i) => (
        <span key={i} className={cn(p.missing && "text-blue-600")}>
          {p.value}
        </span>
      ))}
    </div>
  );
}

function Summary({ text }: { text: string }) {
  return (
    <section className="mb-2">
      <p className="leading-snug text-neutral-800" style={{ fontSize: "10pt" }}>
        {text}
      </p>
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-2">
      <h2
        className="mb-1 border-b border-neutral-300 pb-0.5 font-semibold uppercase"
        style={{ fontSize: "10.5pt", letterSpacing: "0.08em" }}
      >
        {title}
      </h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function ExperienceBlock({
  item,
}: {
  item: ResumeData["experience"][number];
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-semibold">
          {item.role}
          <span className="ml-2 font-normal text-neutral-700">
            · {item.company}
          </span>
        </div>
        <div className="shrink-0 text-neutral-600" style={{ fontSize: "9pt" }}>
          {item.startDate} – {item.endDate}
          {item.location ? ` · ${item.location}` : ""}
        </div>
      </div>
      <ul className="ml-4 mt-0.5 list-disc space-y-0">
        {item.bullets.map((b, i) => (
          <li key={i} className="leading-snug">
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectBlock({
  item,
}: {
  item: NonNullable<ResumeData["projects"]>[number];
}) {
  return (
    <div>
      <div className="font-semibold">
        {item.name}
        {item.role && (
          <span className="ml-2 font-normal text-neutral-700">
            · {item.role}
          </span>
        )}
      </div>
      <ul className="ml-4 mt-0.5 list-disc space-y-0">
        {item.bullets.map((b, i) => (
          <li key={i} className="leading-snug">
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EducationBlock({
  item,
}: {
  item: ResumeData["education"][number];
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <div>
        <span className="font-semibold">{item.degree}</span>
        <span className="ml-2 text-neutral-700">· {item.school}</span>
        {item.notes && (
          <span className="ml-2 text-neutral-600" style={{ fontSize: "9pt" }}>
            ({item.notes})
          </span>
        )}
      </div>
      <div className="shrink-0 text-neutral-600" style={{ fontSize: "9pt" }}>
        {item.startDate} – {item.endDate}
      </div>
    </div>
  );
}

function SkillRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex gap-2">
      <div
        className="w-16 shrink-0 font-semibold text-neutral-700"
        style={{ fontSize: "9.5pt" }}
      >
        {label}
      </div>
      <div className="leading-snug">{items.join(" · ")}</div>
    </div>
  );
}
