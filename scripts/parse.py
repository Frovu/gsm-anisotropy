from datetime import datetime, timezone, timedelta
import sqlite3
conn = sqlite3.connect("./gsm.db")
cursor = conn.cursor()

with open('./1993_2019_A0A1.txt') as file:
    lines = file.readlines()[2:]
    rows = []
    for line in lines:
        split = line.split()
        d = datetime.strptime(split[0], "%Y.%m.%d").replace(tzinfo=timezone.utc) + timedelta(hours=int(split[1])-1)
        rows.append([d.timestamp()] + split[2:])
    print("Inserting...", end="")
    cursor.executemany('INSERT INTO gsm VALUES(?,?,?,?,?,?,?);', rows);
    conn.commit()
    print("done!")
