import express, { Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', routes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, status: 'ok' });
});

// Error handling middleware must be the last middleware
app.use(errorHandler);

export default app;
