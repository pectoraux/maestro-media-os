// Seed admin user + waitlist sample data
import { db } from "./src/lib/db";
import { hashPassword, computeReadinessScore } from "./src/lib/auth";
import { jstr } from "./src/lib/json";

async function main() {
  // ── Admin user ─────────────────────────────────────────────────────────
  const adminExists = await db.user.findUnique({ where: { email: "ekontetevi@gmail.com" } });
  if (!adminExists) {
    const passwordHash = await hashPassword("Payswap123456");
    await db.user.create({
      data: {
        email: "ekontetevi@gmail.com",
        passwordHash,
        name: "Admin",
        role: "super_admin",
        status: "active",
      },
    });
    console.log("seeded admin user: ekontetevi@gmail.com");
  }

  // ── Sample waitlist entries ─────────────────────────────────────────────
  const waitlistCount = await db.waitlistEntry.count();
  if (waitlistCount === 0) {
    const samples = [
      {
        email: "sarah.chen@gmail.com", name: "Sarah Chen", country: "USA", occupation: "Senior ML Engineer",
        skills: jstr(["Machine Learning", "Python", "Teaching", "Writing"]), experience: "8 years in ML, built production systems at Stripe",
        goals: jstr(["Grow to 50k subscribers", "Launch ML course", "Build consulting pipeline"]),
        targetPlatforms: jstr(["youtube", "newsletter"]), interests: jstr(["ML infrastructure", "MLOps", "Career growth"]),
        existingAudience: "2.5k LinkedIn", youtubeChannel: "", xAccount: "@sarahchen_ml", linkedinUrl: "linkedin.com/in/sarahchen",
        preferredFormats: jstr(["long-form", "newsletter"]), monetizationGoals: "$10k/month within 12 months",
        availableHours: 15, personality: "Analytical, patient, dry humor",
      },
      {
        email: "marcus@growthstack.io", name: "Marcus Reid", country: "UK", occupation: "Startup Founder",
        skills: jstr(["Product Strategy", "Go-to-market", "Content Marketing", "Public Speaking"]), experience: "Founded 2 startups, 10 years in SaaS",
        goals: jstr(["Build audience for SaaS", "Generate leads", "Establish authority"]),
        targetPlatforms: jstr(["youtube", "linkedin", "podcast"]), interests: jstr(["Startups", "B2B SaaS", "Growth"]),
        existingAudience: "8k Twitter", youtubeChannel: "@marcusreid", xAccount: "@marcusreid", linkedinUrl: "linkedin.com/in/marcusreid",
        preferredFormats: jstr(["long-form", "shorts", "podcast"]), monetizationGoals: "Lead gen for SaaS",
        availableHours: 12, personality: "Energetic, direct, opinionated",
      },
      {
        email: "maya@designdev.fyi", name: "Maya Patel", country: "Canada", occupation: "Design Engineer",
        skills: jstr(["UI/UX Design", "Frontend Development", "Figma", "Teaching"]), experience: "5 years at Vercel, design systems expert",
        goals: jstr(["Grow YouTube to 20k", "Launch design course", "Speak at conferences"]),
        targetPlatforms: jstr(["youtube", "tiktok", "instagram"]), interests: jstr(["Design systems", "Frontend", "Developer experience"]),
        existingAudience: "5k YouTube, 12k TikTok", youtubeChannel: "@mayapatel", xAccount: "@mayadesigns", linkedinUrl: "",
        preferredFormats: jstr(["shorts", "long-form"]), monetizationGoals: "Course sales + sponsorships",
        availableHours: 20, personality: "Creative, enthusiastic, visual thinker",
      },
    ];

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const skills = JSON.parse(s.skills);
      const goals = JSON.parse(s.goals);
      const platforms = JSON.parse(s.targetPlatforms);
      const interests = JSON.parse(s.interests);
      const formats = JSON.parse(s.preferredFormats);

      const { score, breakdown } = computeReadinessScore({
        skills, experience: s.experience, goals, targetPlatforms: platforms, interests,
        existingAudience: s.existingAudience, youtubeChannel: s.youtubeChannel,
        xAccount: s.xAccount, linkedinUrl: s.linkedinUrl, preferredFormats: formats,
        monetizationGoals: s.monetizationGoals, availableHours: s.availableHours, personality: s.personality,
      });

      const user = await db.user.create({
        data: { email: s.email, name: s.name, role: "creator", status: "waitlisted" },
      });

      await db.waitlistEntry.create({
        data: { ...s, userId: user.id, readinessScore: score, readinessBreakdown: jstr(breakdown), position: i + 1 },
      });
    }
    console.log(`seeded ${samples.length} waitlist entries`);
  }

  console.log("Auth seed complete");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
