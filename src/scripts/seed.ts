import mongoose from 'mongoose';
import '../config/env';
import { connectDB } from '../config/db';
import User from '../models/User';
import Trip from '../models/Trip';

const sampleTrips = [
  {
    title: '7 Days Along the Amalfi Coast',
    destination: 'Amalfi Coast',
    category: 'Cultural',
    location: { city: 'Positano', country: 'Italy' },
    price: 2100,
    duration: 7,
    rating: 4.8,
    shortDescription: 'Cliffside towns, coastal hikes, and long dinners overlooking the Tyrrhenian Sea.',
    fullDescription:
      'Spend a week moving between Positano, Amalfi, and Ravello. Mornings are for coastal trails and boat rides between towns, afternoons for wandering lemon groves and hillside piazzas, and evenings for seafood dinners with a view of the water.',
    images: ['https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1200'],
    itinerary: [
      { day: 1, title: 'Arrival in Positano', details: 'Settle in, evening walk through the town center.' },
      { day: 2, title: 'Path of the Gods hike', details: 'A coastal trail with sweeping views over the Tyrrhenian Sea.' },
      { day: 3, title: 'Amalfi & Ravello day trip', details: 'Cathedral visit and gardens overlooking the coast.' },
    ],
  },
  {
    title: 'Bali Beach & Culture Escape',
    destination: 'Bali',
    category: 'Beach',
    location: { city: 'Seminyak', country: 'Indonesia' },
    price: 1400,
    duration: 8,
    rating: 4.6,
    shortDescription: 'Surf breaks, rice terraces, and sunset beach clubs across southern Bali.',
    fullDescription:
      'Split your time between the beach clubs of Seminyak and the rice terraces of Ubud. Includes a surf lesson, a sunrise trek, and a traditional Balinese cooking class.',
    images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200'],
    itinerary: [
      { day: 1, title: 'Arrival & beach sunset', details: 'Check in near Seminyak beach, catch the sunset.' },
      { day: 2, title: 'Surf lesson', details: 'Beginner-friendly surf session with a local instructor.' },
      { day: 4, title: 'Ubud rice terraces', details: 'Tegallalang terraces and a traditional cooking class.' },
    ],
  },
  {
    title: 'Swiss Alps Trekking',
    destination: 'Swiss Alps',
    category: 'Mountain',
    location: { city: 'Zermatt', country: 'Switzerland' },
    price: 2600,
    duration: 6,
    rating: 4.9,
    shortDescription: 'Alpine trails beneath the Matterhorn, glacier views, and cozy mountain huts.',
    fullDescription:
      'A trekking-focused week based in Zermatt, with day hikes toward the Matterhorn, a cable car ride to Gornergrat, and one overnight stay in a mountain hut.',
    images: ['https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200'],
    itinerary: [
      { day: 1, title: 'Arrival in Zermatt', details: 'Acclimatize and walk the village center.' },
      { day: 2, title: 'Gornergrat & glacier views', details: 'Scenic train ride up to Gornergrat for Matterhorn views.' },
      { day: 3, title: 'Hut-to-hut trek', details: 'Full day trekking with an overnight in a mountain hut.' },
    ],
  },
  {
    title: 'Tokyo City Explorer',
    destination: 'Tokyo',
    category: 'City',
    location: { city: 'Tokyo', country: 'Japan' },
    price: 1900,
    duration: 6,
    rating: 4.7,
    shortDescription: 'Neon streets, quiet temples, and some of the best food in the world.',
    fullDescription:
      'From Shibuya crossing to the quiet gardens of Yanaka, this itinerary balances Tokyo\'s density with pockets of calm, plus a day trip to Kamakura.',
    images: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200'],
    itinerary: [
      { day: 1, title: 'Shibuya & Shinjuku', details: 'Evening exploring the city\'s busiest crossings and skyline.' },
      { day: 2, title: 'Asakusa & Ueno', details: 'Senso-ji temple and Ueno Park museums.' },
      { day: 3, title: 'Kamakura day trip', details: 'Great Buddha statue and coastal temples outside the city.' },
    ],
  },
  {
    title: 'Patagonia Trekking Adventure',
    destination: 'Patagonia',
    category: 'Adventure',
    location: { city: 'El Chalten', country: 'Argentina' },
    price: 2300,
    duration: 9,
    rating: 4.8,
    shortDescription: 'Granite spires, glacial lakes, and some of the best trekking on the planet.',
    fullDescription:
      'A multi-day trekking trip based out of El Chalten, with hikes to Laguna de los Tres and Cerro Torre, plus a glacier boat tour.',
    images: ['https://images.unsplash.com/photo-1531794262263-9e2f9b78a41e?w=1200'],
    itinerary: [
      { day: 1, title: 'Arrival in El Chalten', details: 'Gear check and short orientation walk.' },
      { day: 2, title: 'Laguna de los Tres', details: 'Full-day trek to the base of Fitz Roy.' },
      { day: 3, title: 'Cerro Torre viewpoint', details: 'Trek toward Cerro Torre with a glacier lake at the base.' },
    ],
  },
  {
    title: 'Serengeti Safari',
    destination: 'Serengeti',
    category: 'Wildlife',
    location: { city: 'Arusha', country: 'Tanzania' },
    price: 3400,
    duration: 7,
    rating: 4.9,
    shortDescription: 'Game drives across the Serengeti plains with a chance to see the Great Migration.',
    fullDescription:
      'A guided safari through the Serengeti and Ngorongoro Crater, with morning and evening game drives and stays in tented camps.',
    images: ['https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200'],
    itinerary: [
      { day: 1, title: 'Arrival & Arusha briefing', details: 'Safari orientation and gear check.' },
      { day: 2, title: 'Serengeti game drive', details: 'Full day game drive across the central plains.' },
      { day: 3, title: 'Ngorongoro Crater', details: 'Descent into the crater for a dense wildlife concentration.' },
    ],
  },
  {
    title: 'Santorini Sunset Getaway',
    destination: 'Santorini',
    category: 'Beach',
    location: { city: 'Oia', country: 'Greece' },
    price: 1800,
    duration: 5,
    rating: 4.7,
    shortDescription: 'Whitewashed villages, volcanic beaches, and the best sunsets in the Aegean.',
    fullDescription:
      'A relaxed five days between Oia and Fira, with a catamaran cruise around the caldera and time on the island\'s black-sand beaches.',
    images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200'],
    itinerary: [
      { day: 1, title: 'Arrival in Oia', details: 'Check in and evening sunset viewing.' },
      { day: 2, title: 'Caldera catamaran cruise', details: 'Half-day sailing trip with swim stops.' },
    ],
  },
  {
    title: 'Banff National Park Explorer',
    destination: 'Banff',
    category: 'Mountain',
    location: { city: 'Banff', country: 'Canada' },
    price: 2000,
    duration: 6,
    rating: 4.8,
    shortDescription: 'Turquoise lakes, glacier-fed rivers, and trails through the Canadian Rockies.',
    fullDescription:
      'A driving-and-hiking itinerary covering Lake Louise, Moraine Lake, and the Icefields Parkway, with wildlife spotting along the way.',
    images: ['https://images.unsplash.com/photo-1609825488888-3a766db05542?w=1200'],
    itinerary: [
      { day: 1, title: 'Arrival in Banff', details: 'Town orientation and short waterfall walk.' },
      { day: 2, title: 'Lake Louise & Moraine Lake', details: 'Two of the most photographed lakes in the Rockies.' },
      { day: 3, title: 'Icefields Parkway', details: 'Scenic drive with glacier and waterfall stops.' },
    ],
  },
  {
    title: 'Marrakech Medina Immersion',
    destination: 'Marrakech',
    category: 'Cultural',
    location: { city: 'Marrakech', country: 'Morocco' },
    price: 1300,
    duration: 5,
    rating: 4.5,
    shortDescription: 'Souks, riads, and a day trip into the Atlas Mountains.',
    fullDescription:
      'Explore the medina\'s markets and palaces, stay in a traditional riad, and take a day trip into the nearby Atlas Mountains villages.',
    images: ['https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200'],
    itinerary: [
      { day: 1, title: 'Arrival & medina walk', details: 'Orientation walk through the souks.' },
      { day: 2, title: 'Bahia Palace & gardens', details: 'Historic palace and the Majorelle Garden.' },
      { day: 3, title: 'Atlas Mountains day trip', details: 'Berber villages and mountain scenery outside the city.' },
    ],
  },
  {
    title: 'Costa Rica Rainforest Adventure',
    destination: 'Monteverde',
    category: 'Adventure',
    location: { city: 'Monteverde', country: 'Costa Rica' },
    price: 1700,
    duration: 7,
    rating: 4.7,
    shortDescription: 'Cloud forest canopy walks, zip-lining, and wildlife spotting.',
    fullDescription:
      'A week through the Monteverde cloud forest and Arenal region, combining canopy tours, a volcano hike, and hot springs.',
    images: ['https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=1200'],
    itinerary: [
      { day: 1, title: 'Arrival in Monteverde', details: 'Cloud forest orientation walk.' },
      { day: 2, title: 'Canopy zip-line tour', details: 'Zip-lining and hanging bridges through the forest canopy.' },
      { day: 3, title: 'Arenal Volcano & hot springs', details: 'Hike near the volcano followed by natural hot springs.' },
    ],
  },
];

const run = async () => {
  await connectDB();

  const demoEmail = 'demo@trailmind.ai';
  let demoUser = await User.findOne({ email: demoEmail });
  if (!demoUser) {
    demoUser = await User.create({
      name: 'Demo Traveler',
      email: demoEmail,
      password: 'Demo@1234',
      preferences: { interests: ['beaches', 'hiking'], budgetRange: 'moderate', travelStyle: 'adventure' },
    });
    console.log('Created demo user');
  }

  const existingCount = await Trip.countDocuments();
  if (existingCount > 0) {
    console.log(`Skipping seed: ${existingCount} trips already exist. Drop the trips collection first to reseed.`);
    await mongoose.disconnect();
    return;
  }

  const trips = sampleTrips.map((t) => ({ ...t, createdBy: demoUser!._id }));
  await Trip.insertMany(trips);
  console.log(`Seeded ${trips.length} trips.`);

  await mongoose.disconnect();
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
