import sqlite3

def load_categories():
    conn = sqlite3.connect('categories.db')
    cursor = conn.cursor()  
    cursor.execute('SELECT name, category FROM tag_category')
    tag_category = dict(cursor.fetchall())
    cursor.execute('SELECT name, category FROM class_category')
    class_category = dict(cursor.fetchall())

    conn.close()
    return tag_category, class_category

def get_max_index(table_name):
    conn = sqlite3.connect('categories.db')
    cursor = conn.cursor()
    table_name += '_category'
    cursor.execute(f'SELECT MAX(category) FROM {table_name}')
    max_index = cursor.fetchone()[0]
    return max_index

def insert_category(table_name, element_name, category):
    print(table_name, element_name, category)
    table_name += '_category'
    conn = sqlite3.connect('categories.db')
    cursor = conn.cursor()
    query = f'INSERT INTO {table_name} (name, category) VALUES (?, ?)'
    cursor.execute(query, (element_name, category))
    conn.commit()
    conn.close()