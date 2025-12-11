import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password helper
  const hashPassword = async (password: string) => {
    return bcrypt.hash(password, 10);
  };

  // 1. Create Departments
  console.log('📂 Creating departments...');
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'Information Technology' },
      update: {},
      create: { name: 'Information Technology' },
    }),
    prisma.department.upsert({
      where: { name: 'Human Resources' },
      update: {},
      create: { name: 'Human Resources' },
    }),
    prisma.department.upsert({
      where: { name: 'Finance' },
      update: {},
      create: { name: 'Finance' },
    }),
    prisma.department.upsert({
      where: { name: 'Operations' },
      update: {},
      create: { name: 'Operations' },
    }),
  ]);
  console.log(`✅ Created ${departments.length} departments`);

  // 2. Create Users
  console.log('👥 Creating users...');
  
  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      userId: 'ADM001',
      email: 'admin@company.com',
      password: await hashPassword('admin123'),
      fullName: 'System Administrator',
      role: UserRole.ADMIN,
    },
  });

  // HRGA Manager
  const hrgaManager = await prisma.user.upsert({
    where: { email: 'hrga@company.com' },
    update: {},
    create: {
      userId: 'HRGA001',
      email: 'hrga@company.com',
      password: await hashPassword('hrga123'),
      fullName: 'HRGA Manager',
      role: UserRole.HRGA_MANAGER,
      departmentId: departments[1].id, // HR department
    },
  });

  // Section Heads for each department
  const sectionHeadIT = await prisma.user.upsert({
    where: { email: 'head.it@company.com' },
    update: {},
    create: {
      userId: 'SH001',
      email: 'head.it@company.com',
      password: await hashPassword('section123'),
      fullName: 'IT Section Head',
      role: UserRole.SECTION_HEAD,
      departmentId: departments[0].id,
    },
  });

  const sectionHeadHR = await prisma.user.upsert({
    where: { email: 'head.hr@company.com' },
    update: {},
    create: {
      userId: 'SH002',
      email: 'head.hr@company.com',
      password: await hashPassword('section123'),
      fullName: 'HR Section Head',
      role: UserRole.SECTION_HEAD,
      departmentId: departments[1].id,
    },
  });

  const sectionHeadFinance = await prisma.user.upsert({
    where: { email: 'head.finance@company.com' },
    update: {},
    create: {
      userId: 'SH003',
      email: 'head.finance@company.com',
      password: await hashPassword('section123'),
      fullName: 'Finance Section Head',
      role: UserRole.SECTION_HEAD,
      departmentId: departments[2].id,
    },
  });

  // Regular Users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john.doe@company.com' },
      update: {},
      create: {
        userId: 'USR001',
        email: 'john.doe@company.com',
        password: await hashPassword('user123'),
        fullName: 'John Doe',
        role: UserRole.USER,
        departmentId: departments[0].id, // IT
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane.smith@company.com' },
      update: {},
      create: {
        userId: 'USR002',
        email: 'jane.smith@company.com',
        password: await hashPassword('user123'),
        fullName: 'Jane Smith',
        role: UserRole.USER,
        departmentId: departments[1].id, // HR
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob.johnson@company.com' },
      update: {},
      create: {
        userId: 'USR003',
        email: 'bob.johnson@company.com',
        password: await hashPassword('user123'),
        fullName: 'Bob Johnson',
        role: UserRole.USER,
        departmentId: departments[2].id, // Finance
      },
    }),
    prisma.user.upsert({
      where: { email: 'alice.williams@company.com' },
      update: {},
      create: {
        userId: 'USR004',
        email: 'alice.williams@company.com',
        password: await hashPassword('user123'),
        fullName: 'Alice Williams',
        role: UserRole.USER,
        departmentId: departments[3].id, // Operations
      },
    }),
  ]);
  console.log(`✅ Created ${4 + users.length} users (1 admin, 1 HRGA, 3 section heads, ${users.length} regular users)`);

  // 3. Create Department Approvers
  console.log('👔 Creating department approvers...');
  
  // Section Head approvers for each department
  const sectionHeadApprovers = await Promise.all([
    prisma.departmentApprover.upsert({
      where: { 
        departmentId_userId_approverRole: {
          departmentId: departments[0].id, // IT
          userId: sectionHeadIT.id,
          approverRole: UserRole.SECTION_HEAD
        }
      },
      update: {},
      create: {
        departmentId: departments[0].id,
        userId: sectionHeadIT.id,
        approverRole: UserRole.SECTION_HEAD,
      },
    }),
    prisma.departmentApprover.upsert({
      where: { 
        departmentId_userId_approverRole: {
          departmentId: departments[1].id, // HR
          userId: sectionHeadHR.id,
          approverRole: UserRole.SECTION_HEAD
        }
      },
      update: {},
      create: {
        departmentId: departments[1].id,
        userId: sectionHeadHR.id,
        approverRole: UserRole.SECTION_HEAD,
      },
    }),
    prisma.departmentApprover.upsert({
      where: { 
        departmentId_userId_approverRole: {
          departmentId: departments[2].id, // Finance
          userId: sectionHeadFinance.id,
          approverRole: UserRole.SECTION_HEAD
        }
      },
      update: {},
      create: {
        departmentId: departments[2].id,
        userId: sectionHeadFinance.id,
        approverRole: UserRole.SECTION_HEAD,
      },
    }),
  ]);

  // HRGA Manager as approver for all departments
  const hrgaApprovers = await Promise.all(
    departments.map(dept => 
      prisma.departmentApprover.upsert({
        where: { 
          departmentId_userId_approverRole: {
            departmentId: dept.id,
            userId: hrgaManager.id,
            approverRole: UserRole.HRGA_MANAGER
          }
        },
        update: {},
        create: {
          departmentId: dept.id,
          userId: hrgaManager.id,
          approverRole: UserRole.HRGA_MANAGER,
        },
      })
    )
  );

  console.log(`✅ Created ${sectionHeadApprovers.length} section head approvers and ${hrgaApprovers.length} HRGA approvers`);

  // 4. Meeting Rooms (No dummy data - create via admin panel)
  console.log('🏢 Meeting rooms ready (add via admin panel)');

  // 4. Equipment (No dummy data - create via admin panel)
  console.log('🔧 Equipment ready (add via admin panel)');

  console.log('\n✨ Seed completed successfully!\n');
  console.log('📝 Default credentials:');
  console.log('   Admin: admin@company.com / admin123');
  console.log('   HRGA Manager: hrga@company.com / hrga123');
  console.log('   Section Head (IT): head.it@company.com / section123');
  console.log('   Section Head (HR): head.hr@company.com / section123');
  console.log('   Section Head (Finance): head.finance@company.com / section123');
  console.log('   User: john.doe@company.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
