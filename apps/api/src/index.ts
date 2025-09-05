import express from 'express';
import { oauthRouter } from './routes.oauth';
import { cohortRouter } from './routes.cohort';
import { restoreRouter } from './routes.restore';
import { verifyRouter } from './routes.verify';

const app = express();
app.use(express.json());

app.get('/', (_req, res) => res.send('Restoration API running'));
app.use('/oauth', oauthRouter);
app.use('/cohort', cohortRouter);
app.use('/', restoreRouter);
app.use('/', verifyRouter);

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
