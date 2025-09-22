import prisma from "../utils/prisma";

// Query to check meetings in the database for a given departmentId
export async function getMeetingsByDepartment(departmentId: string) {
  console.log(`[DEBUG] Querying meetings for departmentId: ${departmentId}`);
  const meetings = await prisma.meeting.findMany({
    where: {
      isDeleted: false,
      departmentId,
    },
    select: {
      id: true,
      agenda: true,
      userId: true,
      departmentId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  console.log(
    `[DEBUG] Found ${meetings.length} meetings for departmentId: ${departmentId}`
  );
  return meetings;
}

// Query to check the token payload structure
export function decodeTokenPayload(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    console.log(`[DEBUG] Decoded token payload:`, payload);
    return payload;
  } catch (error) {
    console.error(`[DEBUG] Failed to decode token:`, error);
    return null;
  }
}

// Debug function to check all meetings in database
export async function debugAllMeetings() {
  console.log(`[DEBUG] Fetching all meetings from database...`);
  const meetings = await prisma.meeting.findMany({
    where: {
      isDeleted: false,
    },
    select: {
      id: true,
      agenda: true,
      userId: true,
      departmentId: true,
      overallStatus: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  console.log(`[DEBUG] Total meetings in DB: ${meetings.length}`);
  console.log(`[DEBUG] Sample meetings:`, meetings.slice(0, 5));
  return meetings;
}

// Debug function to check meetings by userId
export async function getMeetingsByUserId(userId: string) {
  console.log(`[DEBUG] Querying meetings for userId: ${userId}`);
  const meetings = await prisma.meeting.findMany({
    where: {
      isDeleted: false,
      userId,
    },
    select: {
      id: true,
      agenda: true,
      userId: true,
      departmentId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  console.log(
    `[DEBUG] Found ${meetings.length} meetings for userId: ${userId}`
  );
  return meetings;
}

// Debug function to check user and department data
export async function debugUserAndDepartment(userId: string) {
  console.log(`[DEBUG] Fetching user data for userId: ${userId}`);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      userId: true,
      email: true,
      role: true,
      departmentId: true,
      department: {
        select: { id: true, name: true },
      },
    },
  });
  console.log(`[DEBUG] User data:`, user);
  return user;
}
