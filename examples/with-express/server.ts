import express from 'express';
import { pipe, promptInjection, pii, keyword } from 'open-guardrail';

const app = express();
app.use(express.json());

const inputGuard = pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email', 'phone'], action: 'mask' }),
  keyword({ denied: ['hack', 'exploit'], action: 'block' }),
);

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  const result = await inputGuard.run(message);
  if (!result.passed) {
    res.status(400).json({ error: 'Input blocked', action: result.action });
    return;
  }

  const safeMessage = result.output ?? message;
  res.json({ reply: `Echo: ${safeMessage}` });
});

app.listen(3000, () => console.log('Server on http://localhost:3000'));
