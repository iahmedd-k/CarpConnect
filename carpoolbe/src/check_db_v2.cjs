const mongoose = require('mongoose');
const RideOffer = require('./models/RideOffer');
const Match = require('./models/Match');
const RideRequest = require('./models/RideRequest');
require('dotenv').config({ path: '../.env' });

async function checkDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const requests = await RideRequest.find().sort('-createdAt').limit(1);
    if (requests.length > 0) {
        const req = requests[0];
        console.log(`\n--- Latest Request ---`);
        console.log(`ID: ${req._id}, Rider: ${req.rider}, Origin: ${req.origin.address}`);

        const matches = await Match.find({ request: req._id }).populate('offer').lean();
        console.log(`\n--- Matches found: ${matches.length} ---`);
        matches.forEach((m, i) => {
            console.log(`\nMatch #${i+1}:`);
            console.log(`ID: ${m._id}, Score: ${m.score}`);
            console.log(`Metrics:`, JSON.stringify(m.metrics, null, 2));
            if (m.offer) {
                console.log(`Offer ID: ${m.offer._id}`);
                console.log(`Offer Data: pricePerSeat=${m.offer.pricePerSeat}, seatsAvailable=${m.offer.seatsAvailable}, departureTime=${m.offer.departureTime}, dist=${m.offer.estimatedDistanceKm}`);
            } else {
                console.log(`Offer: NOT POPULATED (ID in DB: ${m.offer})`);
            }
        });
    }

    await mongoose.disconnect();
}

checkDB().catch(console.error);
