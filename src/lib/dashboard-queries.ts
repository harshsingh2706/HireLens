import { prisma } from "@/lib/prisma";

export interface DashboardMetrics {
  activeJobsCount: number;
  totalCandidatesCount: number;
  toReviewCount: number;
  shortlistedCount: number;
}

export interface RecentJobItem {
  id: string;
  title: string;
  location: string | null;
  employmentType: string | null;
  status: string;
  candidateCount: number;
  createdAt: Date;
}

export interface RecentCandidateItem {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string | null;
  jobId: string;
  jobTitle: string;
  status: string;
  createdAt: Date;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentJobs: RecentJobItem[];
  recentCandidates: RecentCandidateItem[];
  hasAnyJobs: boolean;
}

/**
 * Retrieves dashboard summary metrics, recent jobs, and recent candidate applications.
 * Strictly scoped to the authenticated recruiter to enforce multi-tenant isolation.
 */
export async function getDashboardData(recruiterId: string): Promise<DashboardData> {
  const [
    activeJobsCount,
    totalCandidatesCount,
    toReviewCount,
    shortlistedCount,
    recentJobsRaw,
    recentApplicationsRaw,
    totalJobsCount,
  ] = await Promise.all([
    // 1. Active jobs count
    prisma.job.count({
      where: { recruiterId, status: "ACTIVE" },
    }),
    // 2. Total candidates associated with this recruiter
    prisma.candidate.count({
      where: { recruiterId },
    }),
    // 3. Applications requiring review (NEW or REVIEWING)
    prisma.application.count({
      where: {
        job: { recruiterId },
        status: { in: ["NEW", "REVIEWING"] },
      },
    }),
    // 4. Shortlisted applications
    prisma.application.count({
      where: {
        job: { recruiterId },
        status: "SHORTLISTED",
      },
    }),
    // 5. Recent 5 jobs created by this recruiter
    prisma.job.findMany({
      where: { recruiterId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        location: true,
        employmentType: true,
        status: true,
        createdAt: true,
        _count: {
          select: { applications: true },
        },
      },
    }),
    // 6. Recent 5 applications for jobs owned by this recruiter
    prisma.application.findMany({
      where: {
        job: { recruiterId },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    // 7. Check if recruiter has any jobs at all (for contextual empty states)
    prisma.job.count({
      where: { recruiterId },
    }),
  ]);

  const recentJobs: RecentJobItem[] = recentJobsRaw.map((job) => ({
    id: job.id,
    title: job.title,
    location: job.location,
    employmentType: job.employmentType,
    status: job.status,
    candidateCount: job._count.applications,
    createdAt: job.createdAt,
  }));

  const recentCandidates: RecentCandidateItem[] = recentApplicationsRaw.map((app) => ({
    id: app.id,
    candidateId: app.candidate.id,
    candidateName: app.candidate.name,
    candidateEmail: app.candidate.email,
    jobId: app.job.id,
    jobTitle: app.job.title,
    status: app.status,
    createdAt: app.createdAt,
  }));

  return {
    metrics: {
      activeJobsCount,
      totalCandidatesCount,
      toReviewCount,
      shortlistedCount,
    },
    recentJobs,
    recentCandidates,
    hasAnyJobs: totalJobsCount > 0,
  };
}
