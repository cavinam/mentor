import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database contents...\n');

  // Count records in each table
  const userCount = await prisma.user.count();
  const deptCount = await prisma.department.count();
  const approverCount = await prisma.departmentApprover.count();
  const roomCount = await prisma.meetingRoom.count();
  const equipmentCount = await prisma.equipment.count();
  const meetingCount = await prisma.meeting.count();

  console.log('📊 Database Statistics:');
  console.log(`   Users: ${userCount}`);
  console.log(`   Departments: ${deptCount}`);
  console.log(`   Department Approvers: ${approverCount}`);
  console.log(`   Meeting Rooms: ${roomCount}`);
  console.log(`   Equipment: ${equipmentCount}`);
  console.log(`   Meetings: ${meetingCount}`);
  console.log('\n👥 User Details:');
  
  const users = await prisma.user.findMany({
    select: {
      userId: true,
      email: true,
      fullName: true,
      role: true,
      department: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      role: 'asc'
    }
  });

  users.forEach(user => {
    console.log(`   ${user.userId} | ${user.email.padEnd(30)} | ${user.role.padEnd(15)} | ${user.fullName}`);
  });

  console.log('\n👔 Department Approvers:');
  const approvers = await prisma.departmentApprover.findMany({
    include: {
      department: true,
      user: {
        select: {
          userId: true,
          fullName: true,
        }
      }
    },
    orderBy: {
      department: {
        name: 'asc'
      }
    }
  });

  approvers.forEach(app => {
    console.log(`   ${app.department.name.padEnd(25)} | ${app.approverRole.padEnd(15)} | ${app.user.fullName}`);
  });
}

checkDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
