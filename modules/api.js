const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('gsm.db', sqlite3.OPEN_READONLY);

const FIELDS = ['time', 'A0', 'Ax', 'Ay', 'Az', 'Axy'];

function select(params) {
	return new Promise((resolve) => {
		const from = params.from && parseInt(params.from);
		const to = params.to && parseInt(params.to);
		if(!from || isNaN(from) || !to || isNaN(to))
			return null;
		// cursed code here, golang devs would quite dislike it
		const q = `SELECT ${FIELDS.join()} FROM gsm WHERE time >= ${from} AND time < ${to} ORDER BY time`;
		db.all(q, [], (err, rows) => {
			if (err) return null;
			resolve({
				rows: rows.map(r => FIELDS.map(f => r[f])),
				fields: FIELDS
			});
		});
	});
}

router.get('/data', async (req, res) => {
	const resp = await select(req.query);
	if(resp)
		res.status(200).json(resp);
	else
		res.sendStatus(400);
});

module.exports = router;
