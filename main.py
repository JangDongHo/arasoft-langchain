from bs4 import BeautifulSoup
from query import load_categories, insert_category, get_max_index

# 카테고리 매핑 함수
def get_category(tag):
    global tag_category, class_category
    tag_name = tag.name
    category = tag_category.get(tag_name, 0)  # 태그에 따른 카테고리
    if category == 0:
        max_index = get_max_index('tag')
        category = max_index + 1
        insert_category('tag', tag_name, category)
        tag_category, class_category = load_categories()


    if tag.has_attr('class'):
        for cls in tag['class']:
            category = max(category, class_category.get(cls, 0))  # 클래스에 따른 카테고리
            if category == 0:
                max_index = get_max_index('class')
                category = max_index + 1
                insert_category('class', cls, category)
                tag_category, class_category = load_categories()

    return category

# HTML 요소 순회 및 출력
def print_category(tag, level=0):
    category = get_category(tag)
    print(' ' * level * 2 + str(category))
    for child in tag.children:
        if hasattr(child, 'children'):
            print_category(child, level + 1)


tag_category, class_category = load_categories()

# 파일에서 XHTML 내용을 읽어옵니다.
file_path = 'test2.xhtml'
with open(file_path, 'r', encoding='utf-8') as file:
    xhtml_content = file.read()

soup = BeautifulSoup(xhtml_content, 'html.parser')
body_content = soup.body

print_category(body_content)