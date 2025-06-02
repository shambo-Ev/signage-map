const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.static(__dirname));
app.use(express.json({ limit: '10mb' }));

app.post('/signs.json', (req, res) => {
  fs.writeFileSync(__dirname + '/signs.json', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
