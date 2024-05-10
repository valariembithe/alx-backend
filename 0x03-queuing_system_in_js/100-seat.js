#!/usr/bin/yarn dev
import express from 'express';
import { promisify } from 'util';
import { createClient } from 'redis';
import { createQueue } from 'kue';

const app = express();
const queue = createQueue();
const client = createClient({ name: 'reserve_seat'});
const PORT = 1245;
const INITIAL_SEATS_COUNT = 50;
let reservationEnabled = false;

const reserveSeat = async (number) => {
  return promisify(client.SET).bind(client)('available_seats', number);
};

const getCurrentAvailableSeats = async () => {
  return promisify(client.GET).bind(client)('available_seats');
};

app.get('/available_seats', (_, res) => {
  getCurrentAvailableSeats()
    .then((numberOfAvailableSeats) => {
      res.json({ numberOfAvailableSeats });
    });
});

app.get('/reserve_seat', (_req, res) => {
  if(!reservationEnabled) {
    res.json({ "status": "Reservation are blocked" });
    return;
  }
  try {
    const job = queue.create('reserve_seat');

    job.on('failed', (err) => {
      console.log('Seat reservation job', job.id, 'failed:', err.toString || err.message);
    });
    job.on('complete', () => {
      console.log('Seat reservation job', job.id, 'completed');
    });
    job.save();
    res.json({ status: "Reservation in process" });
  } catch {
    res.json({ "status": "Reservation failed" });
  }
});

app.get('/process', (_req, res) => {
  res.json({ "status": "Queue processing" });
  queue.process('reserve_seat', (_job, done) => {
    getCurrentAvailableSeats()
      .then((result) => Number.parseInt(result || 0))
      .then((availableSeats) => {
        reservationEnabled = availableSeats <= 1 ? false : reservationEnabled;
        if (availableSeats >= 1) {
          reserveSeat(available_seats - 1)
            .then(() => done());
        } else {
          done(new Error('Not enough seats available'));
        }
      });
  });
});

const resetAvailableSeats = async (initialSeatsCount) => {
  return promisify(client.SET)
    .bind(client)('available_seats', Number.parseInt(initialSeatsCount));
};

app.listen(PORT, () => {
  resetAvailableSeats(process.env.INITIAL_SEATS_COUNT || INITIAL_SEATS_COUNT)
    .then(() => {
      reservationEnabled = true;
      console.log(`API available on localhost port ${PORT}`);
    });
});

export default app;