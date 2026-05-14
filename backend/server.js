require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sanitize = require('./middleware/sanitize');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(sanitize);

app.use('/api/auth',                  require('./routes/auth'));
app.use('/api/forms/daily-report',    require('./routes/dailyReport'));
app.use('/api/forms/routine-backlog', require('./routes/routineBacklog'));
app.use('/api/forms/postponed-backlog', require('./routes/postponedBacklog'));
app.use('/api/forms/goals-meeting',   require('./routes/goalsMeeting'));
app.use('/api/forms/reflection',      require('./routes/reflection'));
app.use('/api/forms/week1-review',    require('./routes/week1Review'));
app.use('/api/coach',                 require('./routes/coach'));

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
