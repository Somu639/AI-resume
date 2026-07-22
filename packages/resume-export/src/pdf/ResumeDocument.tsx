import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumeJson } from "@resumeai/shared";
import { getSpacing } from "../spacing";
import { getTheme, type ResumeTheme, type ResumeThemeId } from "../themes";
import {
  contactLine,
  educationHeadline,
  formatDateRange,
} from "../utils/format";

type Props = {
  resume: ResumeJson;
  themeId?: ResumeThemeId;
};

function createStyles(theme: ResumeTheme) {
  const space = getSpacing(theme);
  return StyleSheet.create({
    page: {
      fontFamily: theme.fonts.body,
      fontSize: theme.fontSize.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      paddingTop: space.pageMargin,
      paddingBottom: space.pageMargin,
      paddingHorizontal: space.pageMargin,
      lineHeight: 1.35,
    },
    name: {
      fontFamily: theme.fonts.heading,
      fontSize: theme.fontSize.name,
      fontWeight: 700,
      color: theme.colors.accent,
      marginBottom: space.headerGap,
    },
    contact: {
      fontSize: theme.fontSize.small,
      color: theme.colors.muted,
      marginBottom: space.sectionGap,
    },
    section: {
      marginBottom: space.sectionGap,
    },
    sectionTitle: {
      fontFamily: theme.fonts.heading,
      fontSize: theme.fontSize.section,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: theme.colors.accent,
      marginBottom: space.ruleGap,
    },
    rule: {
      height: space.ruleHeight,
      backgroundColor: theme.colors.rule,
      marginBottom: space.ruleGap,
    },
    block: {
      marginBottom: space.blockGap,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    roleTitle: {
      fontFamily: theme.fonts.heading,
      fontSize: theme.fontSize.body,
      fontWeight: 700,
      flexGrow: 1,
      flexShrink: 1,
    },
    dates: {
      fontSize: theme.fontSize.small,
      color: theme.colors.muted,
      flexShrink: 0,
    },
    company: {
      fontSize: theme.fontSize.small,
      color: theme.colors.muted,
      marginBottom: space.lineGap,
    },
    paragraph: {
      marginBottom: space.lineGap,
    },
    bulletRow: {
      flexDirection: "row",
      marginBottom: space.bulletGap,
      paddingLeft: 2,
    },
    bulletMark: {
      width: 10,
      fontSize: theme.fontSize.body,
    },
    bulletText: {
      flex: 1,
      fontSize: theme.fontSize.body,
    },
    skills: {
      fontSize: theme.fontSize.body,
    },
  });
}

function Section({
  title,
  styles,
  children,
}: {
  title: string;
  styles: ReturnType<typeof createStyles>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.rule} />
      {children}
    </View>
  );
}

function Bullets({
  items,
  styles,
}: {
  items: string[];
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <>
      {items.filter(Boolean).map((item, index) => (
        <View key={`${index}-${item.slice(0, 12)}`} style={styles.bulletRow}>
          <Text style={styles.bulletMark}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </>
  );
}

/** One-column ATS-friendly resume document for react-pdf. */
export function ResumePdfDocument({ resume, themeId = "classic" }: Props) {
  const theme = getTheme(themeId);
  const styles = createStyles(theme);
  const { personalInfo, skills, experience, education, projects, certifications } =
    resume;

  return (
    <Document
      title={`${personalInfo.name} — Resume`}
      author={personalInfo.name}
      subject="ATS-friendly resume"
      creator="ResumeAI"
    >
      <Page size="LETTER" style={styles.page}>
        <View>
          <Text style={styles.name}>{personalInfo.name}</Text>
          <Text style={styles.contact}>{contactLine(personalInfo)}</Text>
        </View>

        {personalInfo.summary ? (
          <Section title="Summary" styles={styles}>
            <Text style={styles.paragraph}>{personalInfo.summary}</Text>
          </Section>
        ) : null}

        {skills.length ? (
          <Section title="Skills" styles={styles}>
            <Text style={styles.skills}>{skills.join(" · ")}</Text>
          </Section>
        ) : null}

        {experience.length ? (
          <Section title="Experience" styles={styles}>
            {experience.map((job, idx) => (
              <View key={`${job.company}-${idx}`} style={styles.block}>
                <View style={styles.row}>
                  <Text style={styles.roleTitle}>{job.title}</Text>
                  <Text style={styles.dates}>
                    {formatDateRange(job.startDate, job.endDate)}
                  </Text>
                </View>
                <Text style={styles.company}>
                  {[job.company, job.location].filter(Boolean).join(" · ")}
                </Text>
                <Bullets items={job.bullets} styles={styles} />
              </View>
            ))}
          </Section>
        ) : null}

        {projects.length ? (
          <Section title="Projects" styles={styles}>
            {projects.map((project, idx) => (
              <View key={`${project.name}-${idx}`} style={styles.block}>
                <Text style={styles.roleTitle}>{project.name}</Text>
                {project.description ? (
                  <Text style={styles.paragraph}>{project.description}</Text>
                ) : null}
                {project.technologies?.length ? (
                  <Text style={styles.company}>
                    {project.technologies.join(" · ")}
                  </Text>
                ) : null}
                <Bullets items={project.bullets} styles={styles} />
              </View>
            ))}
          </Section>
        ) : null}

        {education.length ? (
          <Section title="Education" styles={styles}>
            {education.map((edu, idx) => (
              <View key={`${edu.institution}-${idx}`} style={styles.block}>
                <View style={styles.row}>
                  <Text style={styles.roleTitle}>{educationHeadline(edu)}</Text>
                  <Text style={styles.dates}>
                    {formatDateRange(edu.startDate, edu.endDate)}
                  </Text>
                </View>
                <Bullets items={edu.details ?? []} styles={styles} />
              </View>
            ))}
          </Section>
        ) : null}

        {certifications.length ? (
          <Section title="Certifications" styles={styles}>
            {certifications.map((cert, idx) => (
              <View key={`${cert.name}-${idx}`} style={styles.block}>
                <Text style={styles.roleTitle}>
                  {[cert.name, cert.issuer].filter(Boolean).join(" — ")}
                </Text>
                {cert.date ? (
                  <Text style={styles.company}>{cert.date}</Text>
                ) : null}
              </View>
            ))}
          </Section>
        ) : null}
      </Page>
    </Document>
  );
}
