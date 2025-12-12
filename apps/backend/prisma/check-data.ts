import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const departments = await prisma.department.findMany();
    const rooms = await prisma.meetingRoom.findMany();
    const equipment = await prisma.equipment.findMany();
    const users = await prisma.user.findMany({
        include: { department: true },
        orderBy: { role: 'asc' }
    });

    const data = {
        departments: departments.map(d => d.name),
        meetingRooms: rooms.map(r => ({ name: r.name, location: r.location })),
        equipment: equipment.map(e => e.name),
        users: users.map(u => ({
            userId: u.userId,
            email: u.email,
            fullName: u.fullName,
            role: u.role,
            department: u.department?.name || null
        }))
    };

    fs.writeFileSync('prisma/db-data.json', JSON.stringify(data, null, 2));
    console.log('Data saved to prisma/db-data.json');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
