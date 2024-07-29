from bs4 import BeautifulSoup

# 태그 카테고리
tag_category = {
    'body': 1,
    'div': 2,
    'p': 3,
    'span': 4,
    'img': 5,
    'a': 6
}

# 클래스 카테고리
class_category = {
    'nac_inline_1': 10,
    'nac_textbox_center': 11,
    'pubtree_textbox': 12,
    'nac_container': 13,
    'nac_container_free': 14
}

# 스타일 카테고리
style_category = {
}

# 카테고리 매핑 함수
def get_category(tag):
    tag_name = tag.name
    category = tag_category.get(tag_name, 0)  # 태그에 따른 카테고리

    if tag.has_attr('class'):
        for cls in tag['class']:
            category = max(category, class_category.get(cls, 0))  # 클래스에 따른 카테고리

    if tag.has_attr('style'):
        styles = tag['style'].split(';')
        for style in styles:
            if style.strip() in style_category:
                category = max(category, style_category[style.strip()])  # 스타일에 따른 카테고리

    return category

# HTML 요소 순회 및 출력
def print_category(tag, level=0):
    category = get_category(tag)
    print(' ' * level * 2 + str(category))
    for child in tag.children:
        if hasattr(child, 'children'):
            print_category(child, level + 1)

# 파일에서 XHTML 내용을 읽어옵니다.
file_path = 'test.xhtml'
with open(file_path, 'r', encoding='utf-8') as file:
    xhtml_content = file.read()

soup = BeautifulSoup(xhtml_content, 'html.parser')
body_content = soup.body

print_category(body_content)