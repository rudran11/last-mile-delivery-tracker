import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

// Routes
app.use('/api/v1', routes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, status: 'ok' });
});

// Error handling middleware must be the last middleware
app.use(errorHandler);

export default app;
