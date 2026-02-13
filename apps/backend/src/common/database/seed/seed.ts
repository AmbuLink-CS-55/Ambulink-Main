/**
 * Combined Seed - Merging Seed 2 (Test Users & Reset) and Seed 3 (Real Hospital Data)
 */

import * as schema from "@/common/database/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { reset, seed as drizzleSeed } from "drizzle-seed";
import env from "env";
import { sql } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

async function main() {
  console.log("🌱 Starting combined seeding process...");
  console.log("═".repeat(60));

  // 1. Reset Database (from Seed 2)
  console.log("🗑️  Resetting database...");
  await reset(db, schema);

  // 2. Insert Specific Test Users (from Seed 2)
  console.log("👤 Inserting specific test users...");
  await db.insert(schema.users).values({
    id: env.PATIENT_ID,
    fullName: "Joe Patient",
    phoneNumber: "+94771234567",
    email: "patient@example.com",
    passwordHash: "pw123",
    role: "PATIENT",
    isActive: true,
    status: "OFFLINE",
  });

  const [ambulinkProvider] = await db
    .insert(schema.ambulanceProviders)
    .values({
      name: "AMBULINK AMBULANCE PROVIDERS",
      providerType: "PRIVATE",
      hotlineNumber: "+94112345678",
      address: "123 Main Street, Colombo 03",
      initialPrice: "2500.00",
      pricePerKm: "1500.00",
      isActive: true,
    })
    .returning();

  await db.insert(schema.users).values([
    {
      id: env.DRIVER_ID,
      fullName: "Joe Driver",
      phoneNumber: "+94777654321",
      email: "driver@example.com",
      passwordHash: "pw123",
      role: "DRIVER",
      isActive: true,
      status: "OFFLINE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.85469529731564, 6.901523549363248), 4326)`,
      providerId: ambulinkProvider.id,
    },
    {
      id: env.EMT_ID,
      fullName: "Joe EMT",
      phoneNumber: "+94777654329",
      email: "emt@example.com",
      passwordHash: "pw123",
      role: "EMT",
      isActive: true,
      status: "OFFLINE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.85369529731564, 6.901523549363248), 4326)`,
      providerId: ambulinkProvider.id,
    },
    {
      id: env.DISPATCHER_ID,
      fullName: "Joe Dispatcher",
      phoneNumber: "+94777654391",
      email: "dispatcher@example.com",
      passwordHash: "pw123",
      role: "DISPATCHER",
      isActive: true,
      status: "OFFLINE",
      providerId: ambulinkProvider.id,
    },
  ]);

  // 3. Insert Real Ambulance Providers (from Seed 3)
  console.log("🚑 Seeding real ambulance providers...");
  await db
    .insert(schema.ambulanceProviders)
    .values([
      {
        name: "1990 Suwa Seriya - Colombo Central",
        providerType: "PUBLIC",
        hotlineNumber: "1990",
        address: "Colombo Central Operations, Colombo 10",
        initialPrice: "0.00",
        pricePerKm: "0.00",
        isActive: true,
      },
      {
        name: "1990 Suwa Seriya - Colombo South",
        providerType: "PUBLIC",
        hotlineNumber: "1990",
        address: "Kalubowila Teaching Hospital, Dehiwala",
        initialPrice: "0.00",
        pricePerKm: "0.00",
        isActive: true,
      },
      {
        name: "1990 Suwa Seriya - Colombo North",
        providerType: "PUBLIC",
        hotlineNumber: "1990",
        address: "Ragama Teaching Hospital, Ragama",
        initialPrice: "0.00",
        pricePerKm: "0.00",
        isActive: true,
      },
      {
        name: "1990 Suwa Seriya - Gampaha",
        providerType: "PUBLIC",
        hotlineNumber: "1990",
        address: "Gampaha District General Hospital, Gampaha",
        initialPrice: "0.00",
        pricePerKm: "0.00",
        isActive: true,
      },
      {
        name: "Lanka Hospitals Ambulance Service",
        providerType: "PRIVATE",
        hotlineNumber: "011-5430000",
        address: "578 Elvitigala Mawatha, Colombo 05",
        initialPrice: "3500.00",
        pricePerKm: "200.00",
        isActive: true,
      },
      {
        name: "Asiri Emergency Medical Services",
        providerType: "PRIVATE",
        hotlineNumber: "011-4523300",
        address: "181 Kirula Road, Colombo 05",
        initialPrice: "3000.00",
        pricePerKm: "180.00",
        isActive: true,
      },
      {
        name: "Nawaloka Ambulance Service",
        providerType: "PRIVATE",
        hotlineNumber: "011-5577111",
        address: "23 Deshamanya H.K. Dharmadasa Mawatha, Colombo 02",
        initialPrice: "2500.00",
        pricePerKm: "150.00",
        isActive: true,
      },
      {
        name: "Durdans Hospital Ambulance",
        providerType: "PRIVATE",
        hotlineNumber: "011-2140000",
        address: "3 Alfred Place, Colombo 03",
        initialPrice: "2800.00",
        pricePerKm: "170.00",
        isActive: true,
      },
      {
        name: "Hemas Hospital Emergency Services",
        providerType: "PRIVATE",
        hotlineNumber: "011-7888888",
        address: "389 Negombo Road, Wattala",
        initialPrice: "2500.00",
        pricePerKm: "150.00",
        isActive: true,
      },
      {
        name: "Ninewells Hospital Ambulance",
        providerType: "PRIVATE",
        hotlineNumber: "011-5559000",
        address: "67 Park Road, Colombo 05",
        initialPrice: "2700.00",
        pricePerKm: "160.00",
        isActive: true,
      },
      {
        name: "Kings Hospital Emergency Service",
        providerType: "PRIVATE",
        hotlineNumber: "011-2430000",
        address: "294/10 Kotte Road, Rajagiriya",
        initialPrice: "2500.00",
        pricePerKm: "150.00",
        isActive: true,
      },
      {
        name: "St. John Ambulance Sri Lanka",
        providerType: "PRIVATE",
        hotlineNumber: "011-2691095",
        address: "28 Horton Place, Colombo 07",
        initialPrice: "2000.00",
        pricePerKm: "120.00",
        isActive: true,
      },
      {
        name: "Sri Lanka Red Cross Ambulance",
        providerType: "PRIVATE",
        hotlineNumber: "011-2691095",
        address: "106 Dharmapala Mawatha, Colombo 07",
        initialPrice: "1800.00",
        pricePerKm: "100.00",
        isActive: true,
      },
      {
        name: "Medihelp Ambulance Service",
        providerType: "PRIVATE",
        hotlineNumber: "011-2555555",
        address: "No 42, Norris Canal Road, Colombo 10",
        initialPrice: "2200.00",
        pricePerKm: "130.00",
        isActive: true,
      },
      {
        name: "Oasis Hospital Ambulance",
        providerType: "PRIVATE",
        hotlineNumber: "011-5200200",
        address: "32 Negombo Road, Wattala",
        initialPrice: "2400.00",
        pricePerKm: "140.00",
        isActive: true,
      },
    ])
    .returning();

  // 4. Insert Real Hospitals (from Seed 3)
  console.log("🏥 Seeding real hospitals...");
  await db.insert(schema.hospitals).values([
    {
      name: "National Hospital of Sri Lanka",
      hospitalType: "PUBLIC",
      address: "Regent Street, Colombo 10",
      phoneNumber: "011-2691111",
      location: sql`ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326)`,
      isActive: true,
    },
    {
      name: "Colombo South Teaching Hospital (Kalubowila)",
      hospitalType: "PUBLIC",
      address: "Kalubowila Road, Dehiwala",
      phoneNumber: "011-2763000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8847, 6.8528), 4326)`,
      isActive: true,
    },
    {
      name: "Colombo North Teaching Hospital (Ragama)",
      hospitalType: "PUBLIC",
      address: "Ragama",
      phoneNumber: "011-2958337",
      location: sql`ST_SetSRID(ST_MakePoint(79.9211, 7.0279), 4326)`,
      isActive: true,
    },
    {
      name: "Sri Jayewardenepura General Hospital",
      hospitalType: "PUBLIC",
      address: "Thalapathpitiya, Nugegoda",
      phoneNumber: "011-2778000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8897, 6.8706), 4326)`,
      isActive: true,
    },
    {
      name: "Lady Ridgeway Hospital for Children",
      hospitalType: "PUBLIC",
      address: "Dr. Danister De Silva Mawatha, Colombo 08",
      phoneNumber: "011-2693711",
      location: sql`ST_SetSRID(ST_MakePoint(79.8675, 6.9201), 4326)`,
      isActive: true,
    },
    {
      name: "Castle Street Hospital for Women",
      hospitalType: "PUBLIC",
      address: "Castle Street, Colombo 08",
      phoneNumber: "011-2695431",
      location: sql`ST_SetSRID(ST_MakePoint(79.8641, 6.9223), 4326)`,
      isActive: true,
    },
    {
      name: "National Institute of Mental Health (Angoda)",
      hospitalType: "PUBLIC",
      address: "Angoda, Ragama",
      phoneNumber: "011-2961051",
      location: sql`ST_SetSRID(ST_MakePoint(79.9217, 6.9386), 4326)`,
      isActive: true,
    },
    {
      name: "Apeksha Hospital (National Cancer Institute)",
      hospitalType: "PUBLIC",
      address: "Maharagama",
      phoneNumber: "011-2850275",
      location: sql`ST_SetSRID(ST_MakePoint(79.9264, 6.8481), 4326)`,
      isActive: true,
    },
    {
      name: "National Eye Hospital",
      hospitalType: "PUBLIC",
      address: "Danister De Silva Mawatha, Colombo 10",
      phoneNumber: "011-2695385",
      location: sql`ST_SetSRID(ST_MakePoint(79.8689, 6.9253), 4326)`,
      isActive: true,
    },
    {
      name: "Dental Hospital & Teaching Institution",
      hospitalType: "PUBLIC",
      address: "D.R. Wijewardene Mawatha, Colombo 10",
      phoneNumber: "011-2695217",
      location: sql`ST_SetSRID(ST_MakePoint(79.8631, 6.9276), 4326)`,
      isActive: true,
    },
    {
      name: "Lanka Hospitals",
      hospitalType: "PRIVATE",
      address: "578 Elvitigala Mawatha, Colombo 05",
      phoneNumber: "011-5430000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8773, 6.8942), 4326)`,
      isActive: true,
    },
    {
      name: "Asiri Central Hospital",
      hospitalType: "PRIVATE",
      address: "114 Norris Canal Road, Colombo 10",
      phoneNumber: "011-4660000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8580, 6.9298), 4326)`,
      isActive: true,
    },
    {
      name: "Asiri Surgical Hospital",
      hospitalType: "PRIVATE",
      address: "21 Kirimandala Mawatha, Colombo 05",
      phoneNumber: "011-4523300",
      location: sql`ST_SetSRID(ST_MakePoint(79.8756, 6.8951), 4326)`,
      isActive: true,
    },
    {
      name: "Nawaloka Hospital Colombo",
      hospitalType: "PRIVATE",
      address: "23 Deshamanya H.K. Dharmadasa Mawatha, Colombo 02",
      phoneNumber: "011-5577111",
      location: sql`ST_SetSRID(ST_MakePoint(79.8497, 6.9344), 4326)`,
      isActive: true,
    },
    {
      name: "Durdans Hospital",
      hospitalType: "PRIVATE",
      address: "3 Alfred Place, Colombo 03",
      phoneNumber: "011-2140000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8508, 6.9165), 4326)`,
      isActive: true,
    },
    {
      name: "Ninewells Hospital",
      hospitalType: "PRIVATE",
      address: "67 Park Road, Colombo 05",
      phoneNumber: "011-5559000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8699, 6.9008), 4326)`,
      isActive: true,
    },
    {
      name: "Hemas Hospital Wattala",
      hospitalType: "PRIVATE",
      address: "389 Negombo Road, Wattala",
      phoneNumber: "011-7888888",
      location: sql`ST_SetSRID(ST_MakePoint(79.8917, 6.9892), 4326)`,
      isActive: true,
    },
    {
      name: "Hemas Hospital Thalawathugoda",
      hospitalType: "PRIVATE",
      address: "389 Pannipitiya Road, Thalawathugoda",
      phoneNumber: "011-7678888",
      location: sql`ST_SetSRID(ST_MakePoint(79.9283, 6.8728), 4326)`,
      isActive: true,
    },
    {
      name: "Kings Hospital Colombo",
      hospitalType: "PRIVATE",
      address: "294/10 Kotte Road, Rajagiriya",
      phoneNumber: "011-2430000",
      location: sql`ST_SetSRID(ST_MakePoint(79.9019, 6.9086), 4326)`,
      isActive: true,
    },
    {
      name: "Oasis Hospital",
      hospitalType: "PRIVATE",
      address: "32 Negombo Road, Wattala",
      phoneNumber: "011-5200200",
      location: sql`ST_SetSRID(ST_MakePoint(79.8903, 6.9868), 4326)`,
      isActive: true,
    },
    {
      name: "Central Hospital Colombo",
      hospitalType: "PRIVATE",
      address: "114 Norris Canal Road, Colombo 10",
      phoneNumber: "011-2369369",
      location: sql`ST_SetSRID(ST_MakePoint(79.8575, 6.9302), 4326)`,
      isActive: true,
    },
    {
      name: "Golden Key Eye Hospital",
      hospitalType: "PRIVATE",
      address: "350/14 Elvitigala Mawatha, Colombo 05",
      phoneNumber: "011-2369400",
      location: sql`ST_SetSRID(ST_MakePoint(79.8747, 6.8919), 4326)`,
      isActive: true,
    },
    {
      name: "Joseph Fraser Memorial Hospital",
      hospitalType: "PRIVATE",
      address: "98 D.R. Wijewardene Mawatha, Colombo 10",
      phoneNumber: "011-2695711",
      location: sql`ST_SetSRID(ST_MakePoint(79.8620, 6.9281), 4326)`,
      isActive: true,
    },
    {
      name: "New Durdans Hospital",
      hospitalType: "PRIVATE",
      address: "337 Baddegama Road, Pitakotte",
      phoneNumber: "011-7888888",
      location: sql`ST_SetSRID(ST_MakePoint(79.9233, 6.8889), 4326)`,
      isActive: true,
    },
    {
      name: "Sevana City Hospital",
      hospitalType: "PRIVATE",
      address: "Nawala Road, Rajagiriya",
      phoneNumber: "011-2888888",
      location: sql`ST_SetSRID(ST_MakePoint(79.8972, 6.9128), 4326)`,
      isActive: true,
    },
    {
      name: "Western Hospital",
      hospitalType: "PRIVATE",
      address: "28 Horton Place, Colombo 07",
      phoneNumber: "011-5599000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8669, 6.9111), 4326)`,
      isActive: true,
    },
    {
      name: "Melsta Hospital",
      hospitalType: "PRIVATE",
      address: "73 A Vauxhall Street, Colombo 02",
      phoneNumber: "011-2342342",
      location: sql`ST_SetSRID(ST_MakePoint(79.8545, 6.9336), 4326)`,
      isActive: true,
    },
    {
      name: "Winsetha Hospital",
      hospitalType: "PRIVATE",
      address: "64 Wijerama Mawatha, Colombo 07",
      phoneNumber: "011-2695191",
      location: sql`ST_SetSRID(ST_MakePoint(79.8728, 6.9089), 4326)`,
      isActive: true,
    },
    {
      name: "Neville Fernando Teaching Hospital",
      hospitalType: "PRIVATE",
      address: "2 Penelope Avenue, Malabe",
      phoneNumber: "011-2737000",
      location: sql`ST_SetSRID(ST_MakePoint(79.9614, 6.9058), 4326)`,
      isActive: true,
    },
    {
      name: "Colombo City Hospital",
      hospitalType: "PRIVATE",
      address: "7-1-1 Bauddhaloka Mawatha, Colombo 07",
      phoneNumber: "011-7177177",
      location: sql`ST_SetSRID(ST_MakePoint(79.8639, 6.9147), 4326)`,
      isActive: true,
    },
    {
      name: "Healthway Hospital Kadawatha",
      hospitalType: "PRIVATE",
      address: "120 Kandy Road, Kadawatha",
      phoneNumber: "011-2927000",
      location: sql`ST_SetSRID(ST_MakePoint(79.9536, 7.0036), 4326)`,
      isActive: true,
    },
    {
      name: "Rocell Hospital Panadura",
      hospitalType: "PRIVATE",
      address: "No. 26, Galle Road, Panadura",
      phoneNumber: "038-2292000",
      location: sql`ST_SetSRID(ST_MakePoint(79.9033, 6.7133), 4326)`,
      isActive: true,
    },
    {
      name: "Nawaloka Hospital Negombo",
      hospitalType: "PRIVATE",
      address: "115 A Colombo Road, Negombo",
      phoneNumber: "031-2233333",
      location: sql`ST_SetSRID(ST_MakePoint(79.8353, 7.2094), 4326)`,
      isActive: true,
    },
    {
      name: "Pearl Hospital",
      hospitalType: "PRIVATE",
      address: "37 Hospital Road, Kalubowila, Dehiwala",
      phoneNumber: "011-2712000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8842, 6.8506), 4326)`,
      isActive: true,
    },
    {
      name: "Browns Hospital",
      hospitalType: "PRIVATE",
      address: "Negombo Road, Wattala",
      phoneNumber: "011-2959000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8914, 6.9881), 4326)`,
      isActive: true,
    },
    {
      name: "Gampaha District General Hospital",
      hospitalType: "PUBLIC",
      address: "Hospital Road, Gampaha",
      phoneNumber: "033-2222261",
      location: sql`ST_SetSRID(ST_MakePoint(80.0117, 7.0917), 4326)`,
      isActive: true,
    },
    {
      name: "Negombo General Hospital",
      hospitalType: "PUBLIC",
      address: "Hospital Road, Negombo",
      phoneNumber: "031-2222261",
      location: sql`ST_SetSRID(ST_MakePoint(79.8367, 7.2047), 4326)`,
      isActive: true,
    },
    {
      name: "Kalutara District General Hospital",
      hospitalType: "PUBLIC",
      address: "Kalutara North",
      phoneNumber: "034-2222261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9597, 6.5856), 4326)`,
      isActive: true,
    },
    {
      name: "Homagama Base Hospital",
      hospitalType: "PUBLIC",
      address: "High Level Road, Homagama",
      phoneNumber: "011-2855261",
      location: sql`ST_SetSRID(ST_MakePoint(80.0024, 6.8444), 4326)`,
      isActive: true,
    },
    {
      name: "Panadura Base Hospital",
      hospitalType: "PUBLIC",
      address: "Horana Road, Panadura",
      phoneNumber: "038-2292261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9022, 6.7119), 4326)`,
      isActive: true,
    },
    {
      name: "Maharagama Base Hospital",
      hospitalType: "PUBLIC",
      address: "High Level Road, Maharagama",
      phoneNumber: "011-2839261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9256, 6.8475), 4326)`,
      isActive: true,
    },
    {
      name: "Kaduwela Base Hospital",
      hospitalType: "PUBLIC",
      address: "Kaduwela",
      phoneNumber: "011-2577261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9833, 6.9333), 4326)`,
      isActive: true,
    },
    {
      name: "Wattala Base Hospital",
      hospitalType: "PUBLIC",
      address: "Negombo Road, Wattala",
      phoneNumber: "011-2945261",
      location: sql`ST_SetSRID(ST_MakePoint(79.8906, 6.9889), 4326)`,
      isActive: true,
    },
    {
      name: "Ja-Ela Base Hospital",
      hospitalType: "PUBLIC",
      address: "Negombo Road, Ja-Ela",
      phoneNumber: "011-2233261",
      location: sql`ST_SetSRID(ST_MakePoint(79.8917, 7.0744), 4326)`,
      isActive: true,
    },
    {
      name: "Minuwangoda Base Hospital",
      hospitalType: "PUBLIC",
      address: "Katunayake Road, Minuwangoda",
      phoneNumber: "011-2296261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9542, 7.1728), 4326)`,
      isActive: true,
    },
    {
      name: "Horana Base Hospital",
      hospitalType: "PUBLIC",
      address: "Panadura Road, Horana",
      phoneNumber: "034-2263261",
      location: sql`ST_SetSRID(ST_MakePoint(80.0631, 6.7156), 4326)`,
      isActive: true,
    },
    {
      name: "Chest Hospital Colombo",
      hospitalType: "PUBLIC",
      address: "Borella, Colombo 08",
      phoneNumber: "011-2695811",
      location: sql`ST_SetSRID(ST_MakePoint(79.8758, 6.9147), 4326)`,
      isActive: true,
    },
    {
      name: "Infectious Diseases Hospital (IDH)",
      hospitalType: "PUBLIC",
      address: "Baseline Road, Colombo 10",
      phoneNumber: "011-2693881",
      location: sql`ST_SetSRID(ST_MakePoint(79.8594, 6.9311), 4326)`,
      isActive: true,
    },
    {
      name: "National Hospital for Respiratory Diseases",
      hospitalType: "PUBLIC",
      address: "Welisara, Ragama",
      phoneNumber: "011-2950216",
      location: sql`ST_SetSRID(ST_MakePoint(79.9194, 7.0336), 4326)`,
      isActive: true,
    },
    {
      name: "De Soysa Hospital for Women",
      hospitalType: "PUBLIC",
      address: "Kynsey Road, Colombo 08",
      phoneNumber: "011-2696241",
      location: sql`ST_SetSRID(ST_MakePoint(79.8714, 6.9186), 4326)`,
      isActive: true,
    },
    {
      name: "Colombo East Base Hospital (Mulleriyawa)",
      hospitalType: "PUBLIC",
      address: "Mulleriyawa New Town",
      phoneNumber: "011-2555261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9289, 6.9333), 4326)`,
      isActive: true,
    },
    {
      name: "Colombo West Base Hospital (Attidiya)",
      hospitalType: "PUBLIC",
      address: "Attidiya, Dehiwala",
      phoneNumber: "011-2738261",
      location: sql`ST_SetSRID(ST_MakePoint(79.8739, 6.8397), 4326)`,
      isActive: true,
    },
    {
      name: "Piliyandala Base Hospital",
      hospitalType: "PUBLIC",
      address: "Piliyandala",
      phoneNumber: "011-2614261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9219, 6.7989), 4326)`,
      isActive: true,
    },
    {
      name: "Avissawella Base Hospital",
      hospitalType: "PUBLIC",
      address: "Avissawella",
      phoneNumber: "036-2222261",
      location: sql`ST_SetSRID(ST_MakePoint(80.2131, 6.9528), 4326)`,
      isActive: true,
    },
    {
      name: "Kelaniya Base Hospital",
      hospitalType: "PUBLIC",
      address: "Kandy Road, Kelaniya",
      phoneNumber: "011-2911261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9219, 6.9553), 4326)`,
      isActive: true,
    },
    {
      name: "Beruwala Base Hospital",
      hospitalType: "PUBLIC",
      address: "Galle Road, Beruwala",
      phoneNumber: "034-2276261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9828, 6.4789), 4326)`,
      isActive: true,
    },
    {
      name: "Matugama Base Hospital",
      hospitalType: "PUBLIC",
      address: "Matugama",
      phoneNumber: "034-2247261",
      location: sql`ST_SetSRID(ST_MakePoint(80.1444, 6.5167), 4326)`,
      isActive: true,
    },
    {
      name: "Mirigama Base Hospital",
      hospitalType: "PUBLIC",
      address: "Colombo Road, Mirigama",
      phoneNumber: "033-2267261",
      location: sql`ST_SetSRID(ST_MakePoint(80.1242, 7.2492), 4326)`,
      isActive: true,
    },
    {
      name: "Divulapitiya Base Hospital",
      hospitalType: "PUBLIC",
      address: "Kurunegala Road, Divulapitiya",
      phoneNumber: "033-2257261",
      location: sql`ST_SetSRID(ST_MakePoint(80.0172, 7.2231), 4326)`,
      isActive: true,
    },
    {
      name: "Veyangoda Base Hospital",
      hospitalType: "PUBLIC",
      address: "Hospital Road, Veyangoda",
      phoneNumber: "033-2285261",
      location: sql`ST_SetSRID(ST_MakePoint(80.0556, 7.1569), 4326)`,
      isActive: true,
    },
    {
      name: "Biyagama Base Hospital",
      hospitalType: "PUBLIC",
      address: "Kelaniya Road, Biyagama",
      phoneNumber: "011-2470261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9692, 6.9553), 4326)`,
      isActive: true,
    },
    {
      name: "Pugoda Base Hospital",
      hospitalType: "PUBLIC",
      address: "Avissawella Road, Pugoda",
      phoneNumber: "011-2579261",
      location: sql`ST_SetSRID(ST_MakePoint(80.0994, 6.9667), 4326)`,
      isActive: true,
    },
    {
      name: "Hanwella Base Hospital",
      hospitalType: "PUBLIC",
      address: "Colombo Road, Hanwella",
      phoneNumber: "036-2255261",
      location: sql`ST_SetSRID(ST_MakePoint(80.0864, 6.9078), 4326)`,
      isActive: true,
    },
    {
      name: "Mathugama District Hospital",
      hospitalType: "PUBLIC",
      address: "Hospital Road, Mathugama",
      phoneNumber: "034-2247261",
      location: sql`ST_SetSRID(ST_MakePoint(80.1436, 6.5158), 4326)`,
      isActive: true,
    },
    {
      name: "Agalawatta Base Hospital",
      hospitalType: "PUBLIC",
      address: "Horana Road, Agalawatta",
      phoneNumber: "034-2291261",
      location: sql`ST_SetSRID(ST_MakePoint(80.0564, 6.6450), 4326)`,
      isActive: true,
    },
    {
      name: "Bandaragama Base Hospital",
      hospitalType: "PUBLIC",
      address: "Panadura Road, Bandaragama",
      phoneNumber: "038-2291261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9881, 6.6886), 4326)`,
      isActive: true,
    },
    {
      name: "Borella General Hospital",
      hospitalType: "PUBLIC",
      address: "Borella, Colombo 08",
      phoneNumber: "011-2698261",
      location: sql`ST_SetSRID(ST_MakePoint(79.8750, 6.9153), 4326)`,
      isActive: true,
    },
    {
      name: "Mahamodara Base Hospital",
      hospitalType: "PUBLIC",
      address: "Mahamodara, Galle",
      phoneNumber: "091-2222261",
      location: sql`ST_SetSRID(ST_MakePoint(80.2097, 6.0478), 4326)`,
      isActive: true,
    },
    {
      name: "Ratmalana Airport Hospital",
      hospitalType: "PUBLIC",
      address: "Ratmalana",
      phoneNumber: "011-2636261",
      location: sql`ST_SetSRID(ST_MakePoint(79.8861, 6.8222), 4326)`,
      isActive: true,
    },
    {
      name: "Moratuwa Base Hospital",
      hospitalType: "PUBLIC",
      address: "Hospital Road, Moratuwa",
      phoneNumber: "011-2645261",
      location: sql`ST_SetSRID(ST_MakePoint(79.8819, 6.7731), 4326)`,
      isActive: true,
    },
    {
      name: "Kotte District Hospital",
      hospitalType: "PUBLIC",
      address: "Ethul Kotte",
      phoneNumber: "011-2868261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9025, 6.8894), 4326)`,
      isActive: true,
    },
    {
      name: "Battaramulla Base Hospital",
      hospitalType: "PUBLIC",
      address: "Battaramulla",
      phoneNumber: "011-2887261",
      location: sql`ST_SetSRID(ST_MakePoint(79.9186, 6.8972), 4326)`,
      isActive: true,
    },
    {
      name: "Nugegoda General Hospital",
      hospitalType: "PUBLIC",
      address: "High Level Road, Nugegoda",
      phoneNumber: "011-2814261",
      location: sql`ST_SetSRID(ST_MakePoint(79.8897, 6.8653), 4326)`,
      isActive: true,
    },
    {
      name: "Mount Lavinia Base Hospital",
      hospitalType: "PUBLIC",
      address: "Galle Road, Mount Lavinia",
      phoneNumber: "011-2717261",
      location: sql`ST_SetSRID(ST_MakePoint(79.8628, 6.8372), 4326)`,
      isActive: true,
    },
    {
      name: "Dehiwala Base Hospital",
      hospitalType: "PUBLIC",
      address: "Galle Road, Dehiwala",
      phoneNumber: "011-2724261",
      location: sql`ST_SetSRID(ST_MakePoint(79.8631, 6.8514), 4326)`,
      isActive: true,
    },
  ]);

  // 5. Insert Real Helplines (from Seed 3)
  console.log("📞 Seeding real helplines...");
  await db.insert(schema.helplines).values([
    {
      name: "Suwa Seriya - National Ambulance Service",
      phoneNumber: "1990",
      description: "Free 24/7 national ambulance service covering all of Sri Lanka",
      isActive: true,
    },
    {
      name: "Police Emergency Hotline",
      phoneNumber: "119",
      description: "Sri Lanka Police 24/7 emergency response",
      isActive: true,
    },
    {
      name: "Fire & Rescue Services",
      phoneNumber: "110",
      description: "National fire brigade and rescue operations",
      isActive: true,
    },
    {
      name: "Disaster Management Centre",
      phoneNumber: "117",
      description: "National emergency and disaster response coordination",
      isActive: true,
    },
    {
      name: "Accident Service - National Hospital",
      phoneNumber: "011-2691111",
      description: "National Hospital Colombo 24/7 accident and emergency service",
      isActive: true,
    },
    {
      name: "Lanka Hospitals Emergency",
      phoneNumber: "011-5430000",
      description: "24/7 emergency and ambulance service",
      isActive: true,
    },
    {
      name: "Asiri Hospital Emergency",
      phoneNumber: "011-4523300",
      description: "24/7 emergency medical services",
      isActive: true,
    },
    {
      name: "Nawaloka Hospital Emergency",
      phoneNumber: "011-5577111",
      description: "24/7 emergency care and ambulance",
      isActive: true,
    },
    {
      name: "Durdans Hospital Emergency",
      phoneNumber: "011-2140000",
      description: "24/7 accident and emergency department",
      isActive: true,
    },
    {
      name: "National Poison Information Centre",
      phoneNumber: "011-2691111",
      description: "24/7 poison emergency information and guidance",
      isActive: true,
    },
    {
      name: "Mental Health Helpline (NIMH)",
      phoneNumber: "011-2961051",
      description: "National Institute of Mental Health crisis support",
      isActive: true,
    },
    {
      name: "Child Protection Helpline",
      phoneNumber: "1929",
      description: "24/7 child abuse and protection reporting",
      isActive: true,
    },
    {
      name: "Women in Need (WIN) Helpline",
      phoneNumber: "011-2671411",
      description: "Support for women facing domestic violence and crisis",
      isActive: true,
    },
    {
      name: "Sumithrayo - Mental Health Helpline",
      phoneNumber: "011-2692909",
      description: "Emotional support and suicide prevention",
      isActive: true,
    },
    {
      name: "Government Information Center",
      phoneNumber: "1919",
      description: "Government services and information hotline",
      isActive: true,
    },
    {
      name: "Sri Lanka Red Cross",
      phoneNumber: "011-2691095",
      description: "Red Cross emergency and humanitarian services",
      isActive: true,
    },
    {
      name: "St. John Ambulance",
      phoneNumber: "011-2691095",
      description: "First aid training and ambulance services",
      isActive: true,
    },
    {
      name: "Health Promotion Bureau Hotline",
      phoneNumber: "1997",
      description: "Public health information and guidance",
      isActive: true,
    },
    {
      name: "National Medicine Quality Assurance",
      phoneNumber: "011-2368611",
      description: "Report counterfeit medicines and quality issues",
      isActive: true,
    },
    {
      name: "Dengue Control Hotline",
      phoneNumber: "011-2695112",
      description: "Report dengue cases and breeding sites",
      isActive: true,
    },
  ]);

  // 6. Optional: Generate additional random data (from Seed 2)
  console.log("🎲 Generating additional random data...");
  await drizzleSeed(db, schema, { count: 5 }).refine((f) => ({
    users: {
      columns: {
        isActive: f.default({ defaultValue: true }),
        status: f.default({ defaultValue: "OFFLINE" }),
        currentLocation: f.point({
          minXValue: 79.84,
          maxXValue: 79.95,
          minYValue: 6.83,
          maxYValue: 6.98,
        }),
      },
    },
    ambulance: {
      columns: {
        currentLocation: f.point({
          minXValue: 79.81,
          maxXValue: 79.95,
          minYValue: 6.83,
          maxYValue: 6.98,
        }),
      },
    },
    bookings: {
      columns: {
        pickupLocation: f.point({
          minXValue: 79.81,
          maxXValue: 79.95,
          minYValue: 6.83,
          maxYValue: 6.98,
        }),
      },
    },
  }));

  // 7. Fix SRIDs (from Seed 2)
  console.log("📍 Updating SRIDs for PostGIS...");
  await db.execute(
    sql`UPDATE users SET current_location = ST_SetSRID(current_location, 4326) WHERE ST_SRID(current_location) = 0`
  );
  await db.execute(
    sql`UPDATE ambulances SET current_location = ST_SetSRID(current_location, 4326) WHERE ST_SRID(current_location) = 0`
  );
  await db.execute(
    sql`UPDATE hospitals SET location = ST_SetSRID(location, 4326) WHERE ST_SRID(location) = 0;`
  );
  await db.execute(
    sql`UPDATE bookings SET pickup_location = ST_SetSRID(pickup_location, 4326) WHERE ST_SRID(pickup_location) = 0`
  );

  console.log("═".repeat(60));
  console.log("🎉 Combined seeding complete!");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Combined seed failed:", e);
  process.exit(1);
});
