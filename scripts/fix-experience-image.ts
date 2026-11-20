import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.experience.updateMany({
    where: { title: "Cape Coast Castle Heritage Tour" },
    data: {
      imageUrl:
        "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&h=600&fit=crop",
    },
  });
  console.log(result);
}

main()
  .finally(() => prisma.$disconnect());
