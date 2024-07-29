import sqlite3

# 데이터베이스 연결
conn = sqlite3.connect('categories.db')
cursor = conn.cursor()

# 테이블 생성
cursor.execute('''
CREATE TABLE IF NOT EXISTS tag_category (
    name TEXT PRIMARY KEY,
    category INTEGER
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS class_category (
    name TEXT PRIMARY KEY,
    category INTEGER
)
''')

# 데이터 삽입
tag_data = [
    ('body', 1),
    ('div', 2),
    ('p', 3),
    ('span', 4),
    ('img', 5),
    ('a', 6)
]

class_data = [
    ('nac_inline_1', 100),
    ('nac_textbox_center', 101),
    ('pubtree_textbox', 102),
    ('nac_container', 103),
    ('nac_container_free', 104)
]

cursor.executemany('INSERT OR IGNORE INTO tag_category (name, category) VALUES (?, ?)', tag_data)
cursor.executemany('INSERT OR IGNORE INTO class_category (name, category) VALUES (?, ?)', class_data)

# 변경사항 저장 및 연결 종료
conn.commit()
conn.close()
